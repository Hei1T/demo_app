import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';
import { Card } from '../database/entities/card.entity.js';
import { Event } from '../database/entities/event.entity.js';
import { StatsService } from './stats.service.js';
import { DataSource } from 'typeorm';

type DailyRow = { day: string; views: number; uv: number };

/**
 * 用户详情页专用查询（拆出来避免 admin.service 过长）。
 * 依赖与 AdminService 相同的三个 repository，由 AdminModule 注入。
 */
@Injectable()
export class UserInsightsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Card) private readonly cards: Repository<Card>,
    @InjectRepository(Event) private readonly events: Repository<Event>,
    private readonly stats: StatsService,
    private readonly ds: DataSource,
  ) {}

  /** 概览 + 图表数据 */
  async overview(id: string, days = 30) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    const d = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = new Date(Date.now() - d * 86400000);

    const list = await this.cards.find({ where: { userId: id } });
    const cardIds = list.map((c) => c.id);

    const base = {
      range: { days: d, since },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      summary: { cards: list.length, views: 0, uv: 0, clicks: 0, ctr: 0, avgDwell: 0, cities: 0 },
      daily: [] as DailyRow[],
      templates: [] as { slug: string; views: number; cards: number }[],
      cities: [] as { city: string; count: number }[],
      clickTypes: [] as { type: string; count: number }[],
    };
    if (cardIds.length === 0) return base;

    const agg = await this.events
      .createQueryBuilder('e')
      .select('e.type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.userId = :uid', { uid: id })
      .andWhere('e.createdAt >= :s', { s: since })
      .groupBy('e.type')
      .getRawMany<{ type: string; count: number }>();

    let views = 0;
    let clicks = 0;
    const clickTypes: { type: string; count: number }[] = [];
    for (const r of agg) {
      if (r.type === 'view') views = Number(r.count);
      else if (r.type === 'dwell') continue;
      else {
        clicks += Number(r.count);
        clickTypes.push({ type: r.type, count: Number(r.count) });
      }
    }
    clickTypes.sort((a, b) => b.count - a.count);

    const uvRow = await this.events
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e."visitorHash")::int', 'uv')
      .where('e.userId = :uid', { uid: id })
      .andWhere('e.createdAt >= :s', { s: since })
      .andWhere("e.type = 'view'")
      .getRawOne<{ uv: number }>();

    const dwellRow = await this.events
      .createQueryBuilder('e')
      .select('AVG(e.duration)::int', 'avg')
      .where('e.userId = :uid', { uid: id })
      .andWhere("e.type = 'dwell'")
      .andWhere('e.createdAt >= :s', { s: since })
      .getRawOne<{ avg: number | null }>();

    const daily = await this.events
      .createQueryBuilder('e')
      .select("to_char(date_trunc('day', e.createdAt), 'YYYY-MM-DD')", 'day')
      .addSelect("SUM(CASE WHEN e.type='view' THEN 1 ELSE 0 END)::int", 'views')
      .addSelect('COUNT(DISTINCT e."visitorHash")::int', 'uv')
      .where('e.userId = :uid', { uid: id })
      .andWhere('e.createdAt >= :s', { s: since })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; views: number; uv: number }>();

    const tplRows = await this.events
      .createQueryBuilder('e')
      .innerJoin('cards', 'c', 'c.id = e.cardId')
      .select('c."templateSlug"', 'slug')
      .addSelect("SUM(CASE WHEN e.type='view' THEN 1 ELSE 0 END)::int", 'views')
      .where('e.userId = :uid', { uid: id })
      .andWhere('e.createdAt >= :s', { s: since })
      .groupBy('c."templateSlug"')
      .orderBy('views', 'DESC')
      .getRawMany<{ slug: string; views: number }>();

    const tplCards = new Map<string, number>();
    for (const c of list) tplCards.set(c.templateSlug, (tplCards.get(c.templateSlug) ?? 0) + 1);

    const cityRows = await this.events
      .createQueryBuilder('e')
      .select('e.city', 'city')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.userId = :uid', { uid: id })
      .andWhere('e.createdAt >= :s', { s: since })
      .andWhere('e.city IS NOT NULL')
      .groupBy('e.city')
      .orderBy('count', 'DESC')
      .limit(12)
      .getRawMany<{ city: string; count: number }>();

    return {
      ...base,
      summary: {
        cards: list.length,
        views,
        uv: Number(uvRow?.uv ?? 0),
        clicks,
        ctr: views ? Number(((clicks / views) * 100).toFixed(1)) : 0,
        avgDwell: Number(dwellRow?.avg ?? 0),
        cities: cityRows.length,
      },
      daily: daily.map((x) => ({ day: x.day, views: Number(x.views), uv: Number(x.uv) })),
      templates: tplRows.map((x) => ({
        slug: x.slug,
        views: Number(x.views),
        cards: tplCards.get(x.slug) ?? 0,
      })),
      cities: cityRows.map((x) => ({ city: x.city, count: Number(x.count) })),
      clickTypes,
    };
  }

  /** 名片分页表（含单卡使用率/点击率/占比） */
  async cardsPage(id: string, page = 1, size = 20, q = '', sort = 'views') {
    const p = Math.max(Number(page) || 1, 1);
    const s = Math.min(Math.max(Number(size) || 20, 1), 100);
    const kw = String(q ?? '').trim();

    const qb = this.cards.createQueryBuilder('c').where('c.userId = :id', { id });
    const countQb = this.cards.createQueryBuilder('c').where('c.userId = :id', { id });
    if (kw) {
      qb.andWhere("(c.code ILIKE :kw OR c.profile->>'name' ILIKE :kw)", { kw: `%${kw}%` });
      countQb.andWhere("(c.code ILIKE :kw OR c.profile->>'name' ILIKE :kw)", { kw: `%${kw}%` });
    }
    const total = await countQb.getCount();
    const rows = await qb.skip((p - 1) * s).take(s).getMany();
    const ids = rows.map((r) => r.id);

    type Stat = { cardId: string; views: number; uv: number; clicks: number; activeDays: number };
    let stats: Stat[] = [];
    if (ids.length) {
      const raw = await this.events
        .createQueryBuilder('e')
        .select('e.cardId', 'cardId')
        .addSelect("SUM(CASE WHEN e.type='view' THEN 1 ELSE 0 END)::int", 'views')
        .addSelect('COUNT(DISTINCT e."visitorHash")::int', 'uv')
        .addSelect(
          "SUM(CASE WHEN e.type<>'view' AND e.type<>'dwell' THEN 1 ELSE 0 END)::int",
          'clicks',
        )
        .addSelect(
          "COUNT(DISTINCT CASE WHEN e.type='view' AND e.createdAt > now() - interval '30 days' THEN date_trunc('day', e.createdAt) END)::int",
          'activeDays',
        )
        .where('e.cardId IN (:...ids)', { ids })
        .groupBy('e.cardId')
        .getRawMany<Stat>();
      stats = raw.map((r) => ({
        cardId: r.cardId,
        views: Number(r.views),
        uv: Number(r.uv),
        clicks: Number(r.clicks),
        activeDays: Number(r.activeDays),
      }));
    }
    const map = new Map(stats.map((x) => [x.cardId, x]));
    const totalViews = stats.reduce((a, b) => a + b.views, 0);

    const items = rows.map((c) => {
      const st = map.get(c.id);
      const v = st?.views ?? 0;
      const cl = st?.clicks ?? 0;
      return {
        id: c.id,
        code: c.code,
        name: c.profile?.name ?? '',
        templateSlug: c.templateSlug,
        enabled: c.enabled,
        views: v,
        uv: st?.uv ?? 0,
        clicks: cl,
        ctr: v ? Number(((cl / v) * 100).toFixed(1)) : 0,
        usageRate: Math.min(100, Math.round(((st?.activeDays ?? 0) / 30) * 100)),
        activeDays: st?.activeDays ?? 0,
        share: totalViews ? Number(((v / totalViews) * 100).toFixed(1)) : 0,
        createdAt: c.createdAt,
      };
    });

    const key: 'name' | 'createdAt' | 'views' =
      sort === 'name' ? 'name' : sort === 'created' ? 'createdAt' : 'views';
    items.sort((a, b) =>
      key === 'name'
        ? a.name.localeCompare(b.name)
        : key === 'createdAt'
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.views - a.views,
    );

    return { total, page: p, size: s, items };
  }

  /** 漏斗 + 留存 + 环比 + 来源 */
  async funnel(days = 30) {
    const d = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = new Date(Date.now() - d * 86400000);
    const q = (sql: string, params: unknown[]) => this.events.manager.query(sql, params);

    const half = Math.floor(d / 2);
    const mid = new Date(Date.now() - half * 86400000);

    const [f, r, cmp, refs] = await Promise.all([
      q(
        `SELECT
           COUNT(DISTINCT "visitorHash") FILTER (WHERE type='view')::int AS viewed,
           COUNT(DISTINCT "visitorHash") FILTER (WHERE type<>'view' AND type<>'dwell')::int AS clicked,
           COUNT(DISTINCT "visitorHash") FILTER (WHERE type IN ('click_phone','click_wechat'))::int AS contacted
         FROM events WHERE "createdAt" >= $1`,
        [since],
      ),
      q(
        `WITH firsts AS (
           SELECT "visitorHash", MIN(date_trunc('day',"createdAt")) AS d0
           FROM events WHERE type='view' AND "createdAt" >= $1 GROUP BY "visitorHash"
         ), days AS (
           SELECT DISTINCT "visitorHash", date_trunc('day',"createdAt") AS d
           FROM events WHERE type='view' AND "createdAt" >= $1
         )
         SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM days x WHERE x."visitorHash"=firsts."visitorHash" AND x.d = firsts.d0 + interval '1 day'))::int AS d1,
           COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM days x WHERE x."visitorHash"=firsts."visitorHash" AND x.d = firsts.d0 + interval '7 day'))::int AS d7
         FROM firsts`,
        [since],
      ),
      q(
        `SELECT COUNT(*) FILTER (WHERE "createdAt" >= $1)::int AS cur,
                COUNT(*) FILTER (WHERE "createdAt" < $1)::int AS prev
         FROM events WHERE type='view' AND "createdAt" >= $2`,
        [mid, since],
      ),
      q(
        `SELECT CASE
           WHEN referer IS NULL OR referer='' THEN '直接访问'
           WHEN referer ILIKE '%weixin%' OR referer ILIKE '%wechat%' THEN '微信'
           WHEN referer ILIKE '%alipay%' THEN '支付宝'
           WHEN referer ILIKE '%qq%' THEN 'QQ'
           WHEN referer ILIKE '%baidu%' THEN '百度'
           WHEN referer ILIKE '%google%' THEN 'Google'
           ELSE '其他' END AS src,
           COUNT(*)::int AS count
         FROM events WHERE type='view' AND "createdAt" >= $1
         GROUP BY src ORDER BY count DESC`,
        [since],
      ),
    ]);

    const viewed = Number(f[0]?.viewed ?? 0);
    const clicked = Number(f[0]?.clicked ?? 0);
    const contacted = Number(f[0]?.contacted ?? 0);
    const totalVisitors = Number(r[0]?.total ?? 0);
    const d1 = Number(r[0]?.d1 ?? 0);
    const d7 = Number(r[0]?.d7 ?? 0);
    const cur = Number(cmp[0]?.cur ?? 0);
    const prev = Number(cmp[0]?.prev ?? 0);

    return {
      range: { days: d, since },
      funnel: [
        { step: '打开名片', count: viewed },
        { step: '产生点击', count: clicked },
        { step: '拨号/加微', count: contacted },
      ],
      retention: {
        visitors: totalVisitors,
        d1,
        d1Rate: totalVisitors ? Number(((d1 / totalVisitors) * 100).toFixed(1)) : 0,
        d7,
        d7Rate: totalVisitors ? Number(((d7 / totalVisitors) * 100).toFixed(1)) : 0,
      },
      compare: {
        current: cur,
        previous: prev,
        change: prev === 0 ? (cur > 0 ? 100 : 0) : Number((((cur - prev) / prev) * 100).toFixed(1)),
      },
      sources: refs.map((x: { src: string; count: number }) => ({ source: x.src, count: Number(x.count) })),
    };
  }
  /** 快速版概览：走日聚合表 + 单次明细查询 */
  async overviewFast(id: string, days = 30) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    const d = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = new Date(Date.now() - d * 86400000);
    const cardCount = await this.cards.count({ where: { userId: id } });

    const [agg, tplRows, uvRow, extra] = await Promise.all([
      this.stats.userAggregates(id, d),
      this.events.manager.query(
        `SELECT c."templateSlug" AS slug,
                SUM(s.views)::int AS views,
                COUNT(DISTINCT s."cardId")::int AS cards
         FROM card_daily_stats s JOIN cards c ON c.id = s."cardId"
         WHERE s."userId" = $1 AND s.day >= (now() - ($2 || ' days')::interval)::date
         GROUP BY 1 ORDER BY views DESC`,
        [id, String(d)],
      ),
      this.events.manager.query(
        `SELECT COUNT(DISTINCT "visitorHash")::int AS uv
         FROM events WHERE "userId" = $1 AND type = 'view' AND "createdAt" >= $2`,
        [id, since],
      ),
      this.events.manager.query(
        `SELECT type, COUNT(*)::int AS count
         FROM events WHERE "userId" = $1 AND "createdAt" >= $2
         GROUP BY type`,
        [id, since],
      ),
    ]);

    let cities: { city: string; count: number }[] = [];
    try {
      cities = await this.events.manager.query(
        `SELECT city, COUNT(*)::int AS count
         FROM events WHERE "userId" = $1 AND "createdAt" >= $2 AND city IS NOT NULL
         GROUP BY city ORDER BY count DESC LIMIT 12`,
        [id, since],
      );
    } catch {
      cities = [];
    }

    let views = 0;
    let clicks = 0;
    const clickTypes: { type: string; count: number }[] = [];
    for (const r of extra as { type: string; count: number }[]) {
      if (r.type === 'view') views = Number(r.count);
      else if (r.type === 'dwell') continue;
      else {
        clicks += Number(r.count);
        clickTypes.push({ type: r.type, count: Number(r.count) });
      }
    }
    clickTypes.sort((a, b) => b.count - a.count);

    return {
      range: { days: d, since },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      summary: {
        cards: cardCount,
        views,
        uv: Number((uvRow as { uv: number }[])[0]?.uv ?? 0),
        clicks,
        ctr: views ? Number(((clicks / views) * 100).toFixed(1)) : 0,
        avgDwell: Number(agg.totals?.dwell_count)
          ? Number(((Number(agg.totals.dwell_sum) / Number(agg.totals.dwell_count)) / 1).toFixed(0))
          : 0,
        cities: cities.length,
      },
      daily: (agg.daily as { day: string; views: number; uv: number }[]).map((x) => ({
        day: x.day,
        views: Number(x.views),
        uv: Number(x.uv),
      })),
      templates: (tplRows as { slug: string; views: number; cards: number }[]).map((x) => ({
        slug: x.slug,
        views: Number(x.views),
        cards: Number(x.cards),
      })),
      cities: cities.map((c) => ({ city: c.city, count: Number(c.count) })),
      clickTypes,
    };
  }
  /** 单卡详情：资料 + 流量 + 趋势 + 点击类型 + 城市 + 最近访问 */
  async cardDetailFull(code: string, days = 30) {
    const d = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = new Date(Date.now() - d * 86400000);
    const card = await this.cards.findOne({ where: { code: code.toUpperCase() } });
    if (!card) throw new NotFoundException('名片不存在');
    const q = (sql: string, params?: unknown[]) => this.ds.query(sql, params);

    const [summary, byType, daily, cities, hourly, recent, owner] = await Promise.all([
      q(
        `SELECT
           COUNT(*) FILTER (WHERE type='view')::int AS views,
           COUNT(DISTINCT "visitorHash") FILTER (WHERE type='view')::int AS uv,
           COUNT(*) FILTER (WHERE type<>'view' AND type<>'dwell')::int AS clicks,
           COUNT(*) FILTER (WHERE type='dwell')::int AS dwell_count,
           AVG(duration) FILTER (WHERE type='dwell')::int AS avg_dwell,
           AVG("scrollDepth") FILTER (WHERE type='dwell')::int AS avg_scroll
         FROM events WHERE "cardId" = $1 AND "createdAt" >= $2`,
        [card.id, since],
      ),
      q(
        `SELECT type, COUNT(*)::int AS count FROM events
         WHERE "cardId" = $1 AND "createdAt" >= $2 GROUP BY type ORDER BY count DESC`,
        [card.id, since],
      ),
      q(
        `SELECT day::text AS day, views, uv, clicks FROM card_daily_stats
         WHERE "cardId" = $1 AND day >= $2::date ORDER BY day ASC`,
        [card.id, since.toISOString().slice(0, 10)],
      ),
      q(
        `SELECT city, COUNT(*)::int AS count FROM events
         WHERE "cardId" = $1 AND "createdAt" >= $2 AND city IS NOT NULL
         GROUP BY city ORDER BY count DESC LIMIT 12`,
        [card.id, since],
      ),
      q(
        `SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour, COUNT(*)::int AS count
         FROM events WHERE "cardId" = $1 AND "createdAt" >= $2 AND type='view'
         GROUP BY hour ORDER BY hour`,
        [card.id, since],
      ),
      q(
        `SELECT type, city, region, "targetLabel", "targetHref", "ipMasked",
                duration, "scrollDepth", "createdAt"
         FROM events WHERE "cardId" = $1 ORDER BY "createdAt" DESC LIMIT 30`,
        [card.id],
      ),
      this.users.findOne({ where: { id: card.userId } }),
    ]);

    const s = summary[0] ?? {};
    const views = Number(s.views ?? 0);
    const clicks = Number(s.clicks ?? 0);

    return {
      range: { days: d, since },
      card: {
        id: card.id,
        code: card.code,
        profile: card.profile,
        templateSlug: card.templateSlug,
        enabled: card.enabled,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      },
      owner: owner ? { id: owner.id, email: owner.email, name: owner.name } : null,
      summary: {
        views,
        uv: Number(s.uv ?? 0),
        clicks,
        ctr: views ? Number(((clicks / views) * 100).toFixed(1)) : 0,
        avgDwell: Number(s.avg_dwell ?? 0),
        avgScroll: Number(s.avg_scroll ?? 0),
        dwellSamples: Number(s.dwell_count ?? 0),
      },
      byType: (byType as { type: string; count: number }[]).map((x) => ({
        type: x.type,
        count: Number(x.count),
      })),
      daily: (daily as { day: string; views: number; uv: number; clicks: number }[]).map((x) => ({
        day: x.day,
        views: Number(x.views),
        uv: Number(x.uv),
        clicks: Number(x.clicks),
      })),
      cities: (cities as { city: string; count: number }[]).map((x) => ({
        city: x.city,
        count: Number(x.count),
      })),
      hourly: (hourly as { hour: number; count: number }[]).map((x) => ({
        hour: Number(x.hour),
        count: Number(x.count),
      })),
      recent: (recent as Record<string, unknown>[]).map((e) => ({
        type: String(e.type),
        city: e.city ? String(e.city) : null,
        region: e.region ? String(e.region) : null,
        targetLabel: e.targetLabel ? String(e.targetLabel) : null,
        targetHref: e.targetHref ? String(e.targetHref) : null,
        ipMasked: e.ipMasked ? String(e.ipMasked) : null,
        duration: e.duration === null ? null : Number(e.duration),
        scrollDepth: e.scrollDepth === null ? null : Number(e.scrollDepth),
        at: e.createdAt,
      })),
    };
  }}
