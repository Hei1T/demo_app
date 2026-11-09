import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';
import { Card } from '../database/entities/card.entity.js';
import { Event } from '../database/entities/event.entity.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Card) private readonly cards: Repository<Card>,
    @InjectRepository(Event) private readonly events: Repository<Event>,
    private readonly ds: DataSource,
  ) {}

  /** 全站总览 */
  /** 全站总览（全部并行 + 单次扫描聚合） */
  async overview(days = 30) {
    const d = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = new Date(Date.now() - d * 24 * 3600 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const q = (sql: string, params?: unknown[]) => this.ds.query(sql, params);
    const [users, cards, ev, tpl, dailyUser, agg] = await Promise.all([
      q(`SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE "createdAt" >= $1)::int AS today
         FROM users`, [todayStart]),
      q(`SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE "createdAt" >= $1)::int AS today
         FROM cards WHERE "deletedAt" IS NULL`, [todayStart]),
      q(`SELECT
           COUNT(*) FILTER (WHERE type='view')::int AS views_total,
           COUNT(*) FILTER (WHERE type='view' AND "createdAt" >= $1)::int AS views_today,
           COUNT(DISTINCT "visitorHash") FILTER (WHERE type='view' AND "createdAt" >= $1)::int AS visitors_today,
           COUNT(*) FILTER (WHERE type<>'view' AND type<>'dwell')::int AS clicks_total
         FROM events`, [todayStart]),
      q(`SELECT "templateSlug" AS slug, COUNT(*)::int AS count
         FROM cards WHERE "deletedAt" IS NULL
         GROUP BY 1 ORDER BY count DESC`),
      q(`SELECT to_char(date_trunc('day',"createdAt"),'YYYY-MM-DD') AS day, COUNT(*)::int AS count
         FROM users WHERE "createdAt" >= $1 GROUP BY 1 ORDER BY 1`, [since]),
      q(`SELECT day::text AS day, SUM(views)::int AS count
         FROM card_daily_stats WHERE day >= $1::date GROUP BY 1 ORDER BY 1`,
        [since.toISOString().slice(0, 10)]),
    ]);

    let dailyViews = (agg as { day: string; count: number }[]).map((x) => ({
      day: String(x.day),
      count: Number(x.count),
    }));
    if (dailyViews.length === 0) {
      dailyViews = (await q(
        `SELECT to_char(date_trunc('day',"createdAt"),'YYYY-MM-DD') AS day, COUNT(*)::int AS count
         FROM events WHERE type='view' AND "createdAt" >= $1 GROUP BY 1 ORDER BY 1`,
        [since],
      )) as { day: string; count: number }[];
    }

    return {
      range: { days: d, since },
      users: { total: Number(users[0].total), today: Number(users[0].today) },
      cards: { total: Number(cards[0].total), today: Number(cards[0].today) },
      traffic: {
        viewsTotal: Number(ev[0].views_total),
        viewsToday: Number(ev[0].views_today),
        visitorsToday: Number(ev[0].visitors_today),
        clicksTotal: Number(ev[0].clicks_total),
      },
      templateUsage: tpl as { slug: string; count: number }[],
      daily: { views: dailyViews, users: dailyUser as { day: string; count: number }[] },
    };
  }

  /** 用户列表（含名片数，支持搜索） */
  async listUsers(page = 1, size = 20, q = '') {
    const p = Math.max(Number(page) || 1, 1);
    const s = Math.min(Math.max(Number(size) || 20, 1), 100);
    const kw = String(q ?? '').trim();

    const qb = this.users.createQueryBuilder('u').orderBy('u.createdAt', 'DESC');
    if (kw) {
      qb.where('u.email ILIKE :kw OR u.name ILIKE :kw', { kw: `%${kw}%` });
    }
    const [rows, total] = await qb
      .skip((p - 1) * s)
      .take(s)
      .getManyAndCount();

    const counts = await this.cards
      .createQueryBuilder('c')
      .select('c.userId', 'userId')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('c.userId')
      .getRawMany<{ userId: string; count: number }>();
    const map = new Map(counts.map((c) => [c.userId, Number(c.count)]));

    return {
      total,
      page: p,
      size: s,
      items: rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        plan: u.plan,
        cards: map.get(u.id) ?? 0,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
    };
  }

  /** 名片列表（含打开量，支持搜索/模板筛选） */
  async cardsList(page = 1, size = 20, q = '', template = '') {
    const p = Math.max(Number(page) || 1, 1);
    const s = Math.min(Math.max(Number(size) || 20, 1), 100);
    const kw = String(q ?? '').trim();
    const tpl = String(template ?? '').trim();

    const qb = this.cards
      .createQueryBuilder('c')
      .leftJoin('users', 'u', 'u.id = c.userId')
      .select([
        'c.id AS id',
        'c.code AS code',
        'c.templateSlug AS "templateSlug"',
        'c.createdAt AS "createdAt"',
        'c.profile AS profile',
        'u.email AS "ownerEmail"',
      ])
      .where('c.deletedAt IS NULL')
      .orderBy('c.createdAt', 'DESC')
      .offset((p - 1) * s)
      .limit(s);

    const countQb = this.cards
      .createQueryBuilder('c')
      .where('c.deletedAt IS NULL');

    if (kw) {
      qb.andWhere(
        '(c.code ILIKE :kw OR c.profile->>\'name\' ILIKE :kw OR u.email ILIKE :kw)',
        { kw: `%${kw}%` },
      );
      countQb
        .leftJoin('users', 'u2', 'u2.id = c.userId')
        .andWhere(
          '(c.code ILIKE :kw OR c.profile->>\'name\' ILIKE :kw OR u2.email ILIKE :kw)',
          { kw: `%${kw}%` },
        );
    }
    if (tpl) {
      qb.andWhere('c.templateSlug = :tpl', { tpl });
      countQb.andWhere('c.templateSlug = :tpl', { tpl });
    }

    const items = await qb.getRawMany<{
      id: string;
      code: string;
      templateSlug: string;
      createdAt: Date;
      profile: { name?: string };
      ownerEmail: string;
    }>();

    const total = await countQb.getCount();

    const ids = items.map((i) => i.id);
    const stats =
      ids.length === 0
        ? []
        : await this.events
            .createQueryBuilder('e')
            .select('e.cardId', 'cardId')
            .addSelect('COUNT(*)::int', 'count')
            .where('e.cardId IN (:...ids)', { ids })
            .groupBy('e.cardId')
            .getRawMany<{ cardId: string; count: number }>();
    const map = new Map(stats.map((x) => [x.cardId, Number(x.count)]));

    return {
      total,
      page: p,
      size: s,
      items: items.map((i) => ({
        id: i.id,
        code: i.code,
        name: i.profile?.name ?? '',
        templateSlug: i.templateSlug,
        ownerEmail: i.ownerEmail,
        opens: map.get(i.id) ?? 0,
        createdAt: i.createdAt,
      })),
    };
  }

  /** 用户详情：资料 + 名下名片 + 流量汇总 */
  async userDetail(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    const cards = await this.cards.find({
      where: { userId: id },
      order: { createdAt: 'DESC' },
    });

    const cardIds = cards.map((c) => c.id);
    let views = 0;
    let clicks = 0;
    let perCard: { cardId: string; count: number }[] = [];
    if (cardIds.length) {
      const agg = await this.events
        .createQueryBuilder('e')
        .select('e.type', 'type')
        .addSelect('COUNT(*)::int', 'count')
        .where('e.cardId IN (:...ids)', { ids: cardIds })
        .groupBy('e.type')
        .getRawMany<{ type: string; count: number }>();
      for (const r of agg) {
        if (r.type === 'view') views = Number(r.count);
        else clicks += Number(r.count);
      }
      perCard = await this.events
        .createQueryBuilder('e')
        .select('e.cardId', 'cardId')
        .addSelect('COUNT(*)::int', 'count')
        .where('e.cardId IN (:...ids)', { ids: cardIds })
        .andWhere('e.type = :t', { t: 'view' })
        .groupBy('e.cardId')
        .getRawMany<{ cardId: string; count: number }>();
    }
    const perMap = new Map(perCard.map((x) => [x.cardId, Number(x.count)]));

    // 单卡：近 30 天活跃天数 + 点击量（算使用率 / 点击率）
    let cardAgg: {
      cardId: string;
      views: number;
      clicks: number;
      activeDays: number;
    }[] = [];
    if (cardIds.length) {
      const rows = await this.events
        .createQueryBuilder('e')
        .select('e.cardId', 'cardId')
        .addSelect(
          "SUM(CASE WHEN e.type = 'view' THEN 1 ELSE 0 END)::int",
          'views',
        )
        .addSelect(
          "SUM(CASE WHEN e.type <> 'view' THEN 1 ELSE 0 END)::int",
          'clicks',
        )
        .addSelect(
          "COUNT(DISTINCT CASE WHEN e.type = 'view' AND e.createdAt > now() - interval '30 days' THEN date_trunc('day', e.createdAt) END)::int",
          'activeDays',
        )
        .where('e.cardId IN (:...ids)', { ids: cardIds })
        .groupBy('e.cardId')
        .getRawMany<{ cardId: string; views: number; clicks: number; activeDays: number }>();
      cardAgg = rows.map((r) => ({
        cardId: r.cardId,
        views: Number(r.views),
        clicks: Number(r.clicks),
        activeDays: Number(r.activeDays),
      }));
    }
    const aggMap = new Map(cardAgg.map((x) => [x.cardId, x]));
    const totalViews = cardAgg.reduce((s, x) => s + x.views, 0);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      traffic: { views, clicks, ctr: views ? Number((clicks / views).toFixed(2)) : 0 },
      cards: cards.map((c) => {
        const a = aggMap.get(c.id);
        const cv = a?.views ?? 0;
        const cc = a?.clicks ?? 0;
        return {
          id: c.id,
          code: c.code,
          name: c.profile?.name ?? '',
          templateSlug: c.templateSlug,
          enabled: c.enabled,
          opens: perMap.get(c.id) ?? 0,
          /** 近 30 天活跃天数（满分 30）→ 使用率 */
          activeDays: a?.activeDays ?? 0,
          usageRate: Math.round(((a?.activeDays ?? 0) / 30) * 100),
          /** 点击率 */
          ctr: cv ? Number(((cc / cv) * 100).toFixed(1)) : 0,
          /** 占该用户总打开量比例 */
          share: totalViews ? Number(((cv / totalViews) * 100).toFixed(1)) : 0,
          createdAt: c.createdAt,
        };
      }),
    };
  }

  /** 名片详情：资料 + 流量 + 最近事件 */
  async cardDetail(code: string) {
    const card = await this.cards.findOne({ where: { code: code.toUpperCase() } });
    if (!card) throw new NotFoundException('名片不存在');

    const typeAgg = await this.events
      .createQueryBuilder('e')
      .select('e.type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.cardId = :id', { id: card.id })
      .groupBy('e.type')
      .getRawMany<{ type: string; count: number }>();

    const byType: Record<string, number> = {};
    for (const r of typeAgg) byType[r.type] = Number(r.count);

    const daily = await this.events
      .createQueryBuilder('e')
      .select("to_char(date_trunc('day', e.createdAt), 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.cardId = :id', { id: card.id })
      .andWhere("e.type = 'view'")
      .andWhere("e.createdAt > now() - interval '30 days'")
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; count: number }>();

    const recent = await this.events.find({
      where: { cardId: card.id },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const owner = await this.users.findOne({ where: { id: card.userId } });

    return {
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
      byType,
      daily: daily.map((d) => ({ day: d.day, count: Number(d.count) })),
      recent: recent.map((e) => ({
        type: e.type,
        ua: e.ua,
        referer: e.referer,
        ipMasked: e.ipMasked,
        at: e.createdAt,
      })),
    };
  }

  /**
   * 数据分析：模板表现 + Top 名片 + 事件分布 + 时段热力
   * 全部走 PG（暂不引入 ClickHouse）
   */
  async analytics(days = 30) {
    const d = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = new Date(Date.now() - d * 86400000);

    // 模板表现：名片数 / 打开量 / 点击量
    const templatePerf = await this.cards
      .createQueryBuilder('c')
      .select('c.templateSlug', 'slug')
      .addSelect('COUNT(DISTINCT c.id)::int', 'cards')
      .where('c.deletedAt IS NULL')
      .groupBy('c.templateSlug')
      .getRawMany<{ slug: string; cards: number }>();

    const tplEvents = await this.events
      .createQueryBuilder('e')
      .innerJoin('cards', 'c', 'c.id = e.cardId AND c.deletedAt IS NULL')
      .select('c.templateSlug', 'slug')
      .addSelect(
        "SUM(CASE WHEN e.type = 'view' THEN 1 ELSE 0 END)::int",
        'views',
      )
      .addSelect(
        "SUM(CASE WHEN e.type <> 'view' THEN 1 ELSE 0 END)::int",
        'clicks',
      )
      .where('e.createdAt >= :s', { s: since })
      .groupBy('c.templateSlug')
      .getRawMany<{ slug: string; views: number; clicks: number }>();

    const tplMap = new Map(
      templatePerf.map((t) => [t.slug, { cards: Number(t.cards), views: 0, clicks: 0 }]),
    );
    for (const e of tplEvents) {
      const cur = tplMap.get(e.slug) ?? { cards: 0, views: 0, clicks: 0 };
      cur.views = Number(e.views);
      cur.clicks = Number(e.clicks);
      tplMap.set(e.slug, cur);
    }
    const templates = Array.from(tplMap.entries())
      .map(([slug, v]) => ({
        slug,
        cards: v.cards,
        views: v.views,
        clicks: v.clicks,
        ctr: v.views ? Number(((v.clicks / v.views) * 100).toFixed(1)) : 0,
        viewsPerCard: v.cards ? Number((v.views / v.cards).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    // Top 名片
    const topCards = await this.events
      .createQueryBuilder('e')
      .select('e.cardId', 'cardId')
      .addSelect("SUM(CASE WHEN e.type = 'view' THEN 1 ELSE 0 END)::int", 'views')
      .addSelect('COUNT(DISTINCT e."visitorHash")::int', 'uv')
      .addSelect(
        "SUM(CASE WHEN e.type <> 'view' THEN 1 ELSE 0 END)::int",
        'clicks',
      )
      .where('e.createdAt >= :s', { s: since })
      .groupBy('e.cardId')
      .orderBy('views', 'DESC')
      .limit(10)
      .getRawMany<{ cardId: string; views: number; uv: number; clicks: number }>();

    const cardsInfo = topCards.length
      ? await this.cards
          .createQueryBuilder('c')
          .leftJoin('users', 'u', 'u.id = c.userId')
          .select(['c.id AS id', 'c.code AS code', 'c.templateSlug AS "templateSlug"', 'c.profile AS profile', 'u.email AS "ownerEmail"'])
          .where('c.id IN (:...ids)', { ids: topCards.map((t) => t.cardId) })
          .getRawMany<{
            id: string;
            code: string;
            templateSlug: string;
            profile: { name?: string };
            ownerEmail: string;
          }>()
      : [];
    const infoMap = new Map(cardsInfo.map((c) => [c.id, c]));

    // 事件类型分布
    const typeDist = await this.events
      .createQueryBuilder('e')
      .select('e.type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.createdAt >= :s', { s: since })
      .groupBy('e.type')
      .orderBy('count', 'DESC')
      .getRawMany<{ type: string; count: number }>();

    // 时段热力（0-23 时）
    const hourly = await this.events
      .createQueryBuilder('e')
      .select("EXTRACT(HOUR FROM e.createdAt)::int", 'hour')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.createdAt >= :s', { s: since })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany<{ hour: number; count: number }>();

    // 城市分布（溯源核心）
    const cityRows = await this.events
      .createQueryBuilder('e')
      .select('e.city', 'city')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.createdAt >= :s', { s: since })
      .andWhere('e.city IS NOT NULL')
      .groupBy('e.city')
      .orderBy('count', 'DESC')
      .limit(12)
      .getRawMany<{ city: string; count: number }>();

    // 省份分布
    const regionRows = await this.events
      .createQueryBuilder('e')
      .select('e.region', 'region')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.createdAt >= :s', { s: since })
      .andWhere('e.region IS NOT NULL')
      .groupBy('e.region')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ region: string; count: number }>();

    // 平均停留时长
    const dwellAgg = await this.events
      .createQueryBuilder('e')
      .select('AVG(e.duration)::int', 'avg')
      .addSelect('COUNT(*)::int', 'n')
      .where('e.createdAt >= :s', { s: since })
      .andWhere('e.type = :t', { t: 'dwell' })
      .getRawOne<{ avg: number | null; n: number }>();
    return {
      range: { days: d, since },
      cities: cityRows.map((c) => ({ city: c.city, count: Number(c.count) })),
      regions: regionRows.map((r) => ({ region: r.region, count: Number(r.count) })),
      avgDwell: Number(dwellAgg?.avg ?? 0),
      dwellSamples: Number(dwellAgg?.n ?? 0),
      templates,
      topCards: topCards.map((t) => ({
        code: infoMap.get(t.cardId)?.code ?? '',
        name: infoMap.get(t.cardId)?.profile?.name ?? '',
        templateSlug: infoMap.get(t.cardId)?.templateSlug ?? '',
        ownerEmail: infoMap.get(t.cardId)?.ownerEmail ?? '',
        views: Number(t.views),
        uv: Number(t.uv),
        clicks: Number(t.clicks),
        ctr: Number(t.views)
          ? Number(((Number(t.clicks) / Number(t.views)) * 100).toFixed(1))
          : 0,
      })),
      typeDist: typeDist.map((t) => ({ type: t.type, count: Number(t.count) })),
      hourly: hourly.map((h) => ({ hour: Number(h.hour), count: Number(h.count) })),
    };
  }
}
