import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Event } from '../database/entities/event.entity.js';

/**
 * 日聚合：把 events 的明细压成 (cardId, day) 粒度。
 *
 * 目的：让后台查询从「扫 6 万行 × 6 次」变成「扫 3000 行 × 1 次」。
 * 数据量大后（百万级）这是唯一可行的方案。
 */
/** 短链路径（不含域名） */
function shortUrlPath(code: string): string {
  return '/' + code;
}

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Event) private readonly events: Repository<Event>,
  ) {}

  /** 物化最近 N 天（默认 60 天）的聚合数据 */
  async materialize(days = 60): Promise<{ cardRows: number; ms: number }> {
    const t0 = Date.now();

    // 1) 卡片日聚合
    const cardRows = await this.ds.query(
      `
      INSERT INTO card_daily_stats ("cardId","userId",day,views,uv,clicks,dwell_sum,dwell_count)
      SELECT
        e."cardId",
        e."userId",
        date_trunc('day', e."createdAt")::date AS day,
        COUNT(*) FILTER (WHERE e.type='view')::int,
        COUNT(DISTINCT e."visitorHash") FILTER (WHERE e.type='view')::int,
        COUNT(*) FILTER (WHERE e.type<>'view' AND e.type<>'dwell')::int,
        COALESCE(SUM(e.duration),0)::bigint,
        COUNT(*) FILTER (WHERE e.type='dwell')::int
      FROM events e
      WHERE e."createdAt" >= now() - ($1 || ' days')::interval
        AND e."userId" IS NOT NULL
      GROUP BY e."cardId", e."userId", day
      ON CONFLICT ("cardId", day) DO UPDATE SET
        views = EXCLUDED.views,
        uv = EXCLUDED.uv,
        clicks = EXCLUDED.clicks,
        dwell_sum = EXCLUDED.dwell_sum,
        dwell_count = EXCLUDED.dwell_count,
        "userId" = EXCLUDED."userId"
      `,
      [String(days)],
    );

    // 2) 模板日聚合
    await this.ds.query(
      `
      INSERT INTO template_daily_stats (template_slug,day,views,clicks)
      SELECT c."templateSlug", date_trunc('day', e."createdAt")::date,
        COUNT(*) FILTER (WHERE e.type='view')::int,
        COUNT(*) FILTER (WHERE e.type<>'view' AND e.type<>'dwell')::int
      FROM events e JOIN cards c ON c.id = e."cardId"
      WHERE e."createdAt" >= now() - ($1 || ' days')::interval
      GROUP BY c."templateSlug", 2
      ON CONFLICT (template_slug, day) DO UPDATE SET
        views = EXCLUDED.views, clicks = EXCLUDED.clicks
      `,
      [String(days)],
    );

    // 3) 全站日聚合
    await this.ds.query(
      `
      INSERT INTO daily_stats (day,views,uv,clicks,visitors)
      SELECT date_trunc('day', e."createdAt")::date,
        COUNT(*) FILTER (WHERE e.type='view')::int,
        COUNT(DISTINCT e."visitorHash") FILTER (WHERE e.type='view')::int,
        COUNT(*) FILTER (WHERE e.type<>'view' AND e.type<>'dwell')::int,
        COUNT(DISTINCT e."visitorHash")::int
      FROM events e
      WHERE e."createdAt" >= now() - ($1 || ' days')::interval
      GROUP BY 1
      ON CONFLICT (day) DO UPDATE SET
        views = EXCLUDED.views, uv = EXCLUDED.uv,
        clicks = EXCLUDED.clicks, visitors = EXCLUDED.visitors
      `,
      [String(days)],
    );

    const ms = Date.now() - t0;
    this.logger.log(`聚合完成：${days} 天 / ${ms}ms`);
    return { cardRows: cardRows?.length ?? 0, ms };
  }

  /** 用户维度：直接从聚合表读（毫秒级） */
  async userAggregates(userId: string, days = 30) {
    const [totals, daily] = await Promise.all([
      this.ds.query(
        `SELECT COALESCE(SUM(views),0)::int views,
                COALESCE(SUM(clicks),0)::int clicks,
                COALESCE(SUM(dwell_sum),0)::bigint dwell_sum,
                COALESCE(SUM(dwell_count),0)::int dwell_count,
                COUNT(DISTINCT day)::int active_days,
                COUNT(DISTINCT "cardId")::int active_cards
         FROM card_daily_stats
         WHERE "userId" = $1 AND day >= (now() - ($2 || ' days')::interval)::date`,
        [userId, String(days)],
      ),
      this.ds.query(
        `SELECT day::text AS day, SUM(views)::int views, SUM(uv)::int uv, SUM(clicks)::int clicks
         FROM card_daily_stats
         WHERE "userId" = $1 AND day >= (now() - ($2 || ' days')::interval)::date
         GROUP BY day ORDER BY day ASC`,
        [userId, String(days)],
      ),
    ]);
    return { totals: totals[0], daily };
  }

  /** 模板维度 */
  async templateAggregates(days = 30) {
    return this.ds.query(
      `SELECT template_slug AS slug, SUM(views)::int views, SUM(clicks)::int clicks
       FROM template_daily_stats
       WHERE day >= (now() - ($1 || ' days')::interval)::date
       GROUP BY 1 ORDER BY views DESC`,
      [String(days)],
    );
  }

  /** 全站维度 */
  async globalAggregates(days = 30) {
    return this.ds.query(
      `SELECT day::text AS day, views, uv, clicks, visitors
       FROM daily_stats
       WHERE day >= (now() - ($1 || ' days')::interval)::date
       ORDER BY day ASC`,
      [String(days)],
    );
  }

  /** 数据有多少行 / 聚合表是否过期 */
  async status() {
    const r = await this.ds.query(`
      SELECT
        (SELECT COUNT(*)::int FROM events) AS events,
        (SELECT COUNT(*)::int FROM card_daily_stats) AS card_stats,
        (SELECT MAX(day) FROM card_daily_stats) AS last_day,
        (SELECT MAX("createdAt") FROM events) AS last_event
    `);
    return r[0];
  }

  /**
   * 失效短链监控
   * 失效 = 卡片被停用 或 已软删除（用户拿到手的 NFC 卡扫了没内容）
   */
  async invalidLinks(limit = 100) {
    const rows = await this.ds.query(
      `
      SELECT c.code,
             c.profile->>'name' AS name,
             c."templateSlug" AS "templateSlug",
             c.enabled,
             c."deletedAt",
             c."createdAt",
             u.email AS "ownerEmail",
             (SELECT MAX(e."createdAt") FROM events e WHERE e."cardId" = c.id) AS "lastViewAt",
             (SELECT COUNT(*)::int FROM events e WHERE e."cardId" = c.id) AS "totalEvents"
      FROM cards c
      LEFT JOIN users u ON u.id = c."userId"
      WHERE c.enabled = false OR c."deletedAt" IS NOT NULL
      ORDER BY c."deletedAt" DESC NULLS LAST, c."createdAt" DESC
      LIMIT $1
      `,
      [Math.min(Math.max(Number(limit) || 100, 1), 500)],
    );

    const summary = await this.ds.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE enabled = false AND "deletedAt" IS NULL)::int AS disabled,
        COUNT(*) FILTER (WHERE "deletedAt" IS NOT NULL)::int AS deleted,
        COUNT(*)::int AS total
      FROM cards
      WHERE enabled = false OR "deletedAt" IS NOT NULL
      `,
    );

    return {
      summary: {
        disabled: Number(summary[0]?.disabled ?? 0),
        deleted: Number(summary[0]?.deleted ?? 0),
        total: Number(summary[0]?.total ?? 0),
      },
      items: rows.map((r: Record<string, unknown>) => ({
        code: r.code,
        name: r.name ?? '',
        templateSlug: r.templateSlug,
        ownerEmail: r.ownerEmail ?? '',
        reason: r.deletedAt ? '已删除' : '已停用',
        deletedAt: r.deletedAt,
        createdAt: r.createdAt,
        lastViewAt: r.lastViewAt,
        totalEvents: Number(r.totalEvents ?? 0),
        // 有效期提示：短码永久保留，但链接不可用
        link: shortUrlPath(String(r.code)),
      })),
    };
  }}
