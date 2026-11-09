import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { createHash } from 'node:crypto';
import { Event, EventType } from '../database/entities/event.entity.js';
import { Card } from '../database/entities/card.entity.js';

type ReqLike = {
  headers?: Record<string, unknown>;
  ip?: string;
  socket?: { remoteAddress?: string };
};

const KNOWN_TYPES = [
  'view',
  'click_phone',
  'click_email',
  'click_map',
  'click_wechat',
  'click_social',
  'save_contact',
];

const VALID_TYPES: EventType[] = [
  'view',
  'click_phone',
  'click_email',
  'click_map',
  'click_wechat',
  'click_social',
  'save_contact',
];

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Event) private readonly events: Repository<Event>,
    @InjectRepository(Card) private readonly cards: Repository<Card>,
  ) {}

  private clientIp(req: ReqLike): string {
    const xf = req.headers?.['x-forwarded-for'];
    const raw = Array.isArray(xf) ? xf[0] : (xf as string | undefined);
    return (
      (raw ? String(raw).split(',')[0].trim() : '') ||
      req.ip ||
      req.socket?.remoteAddress ||
      ''
    );
  }

  private maskIp(ip: string): string {
    if (!ip) return '';
    const v4 = ip.replace(/^::ffff:/, '');
    const parts = v4.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
    return v4.slice(0, 12) + '…';
  }

  /** 访客指纹：不可反推，按天加盐（跨天不串） */
  private visitorHash(ip: string, ua: string): string {
    const day = new Date().toISOString().slice(0, 10);
    const secret = process.env.VISITOR_SALT ?? 'dev-visitor-salt';
    return createHash('sha256').update(`${ip}|${ua}|${day}|${secret}`).digest('hex');
  }

  /** 埋点：绝不 await，失败也不影响页面 */
  track(cardId: string, type: EventType, req: ReqLike, userId?: string): void {
    if (!VALID_TYPES.includes(type)) return;
    const ip = this.clientIp(req);
    const ua = String(req.headers?.['user-agent'] ?? '').slice(0, 380);
    const referer = String(req.headers?.['referer'] ?? '').slice(0, 380);

    const ev = this.events.create({
      cardId,
      type,
      visitorHash: this.visitorHash(ip, ua),
      ua: ua || null,
      referer: referer || null,
      ipMasked: this.maskIp(ip) || null,
    });
    this.events.save(ev).catch((e) => this.logger.warn(`track fail: ${e}`));
  }

  /** 校验卡片归属（避免 AnalyticsModule 依赖 CardsModule 造成循环） */
  async getOwnedCard(userId: string, code: string) {
    const card = await this.cards.findOne({
      where: { code: code.toUpperCase(), userId },
    });
    if (!card) throw new NotFoundException('名片不存在');
    return card;
  }
  private async rangeDays(days: number) {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 3600 * 1000);
    return { from, to };
  }

  /** 单卡统计 */
  async cardStats(cardId: string, days = 30) {
    const { from, to } = await this.rangeDays(days);

    const rows = await this.events
      .createQueryBuilder('e')
      .select('e.type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .addSelect('COUNT(DISTINCT e.visitorHash)::int', 'visitors')
      .where('e.cardId = :cardId', { cardId })
      .andWhere('e.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('e.type')
      .getRawMany<{ type: string; count: number; visitors: number }>();

    const byType: Record<string, number> = {};
    let views = 0;
    let uniqueVisitors = 0;
    for (const r of rows) {
      if (KNOWN_TYPES.includes(r.type)) byType[r.type] = Number(r.count);
      if (r.type === 'view') {
        views = Number(r.count);
        uniqueVisitors = Number(r.visitors);
      }
    }
    const clicks = Object.entries(byType)
      .filter(([k]) => k !== 'view')
      .reduce((s, [, v]) => s + v, 0);

    // 每日趋势
    const daily = await this.events
      .createQueryBuilder('e')
      .select("to_char(date_trunc('day', e.createdAt), 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.cardId = :cardId', { cardId })
      .andWhere('e.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; count: number }>();

    return {
      range: { days, from, to },
      views,
      uniqueVisitors,
      clicks,
      ctr:
        views > 0
          ? Number(Math.min(clicks / views, 1).toFixed(3))
          : 0,
      byType,
      daily: daily.map((d) => ({ day: d.day, count: Number(d.count) })),
    };
  }

  /** 用户维度的汇总（只看自己的卡） */
  async userOverview(userId: string, days = 30) {
    const cards = await this.cards.find({ where: { userId } });
    const cardIds = cards.map((c) => c.id);
    if (cardIds.length === 0) {
      return {
        cards: 0,
        views: 0,
        uniqueVisitors: 0,
        clicks: 0,
        ctr: 0,
        byType: {},
        daily: [],
        topCards: [],
      };
    }
    const { from, to } = await this.rangeDays(days);
    const qb = this.events
      .createQueryBuilder('e')
      .where('e.cardId IN (:...ids)', { ids: cardIds })
      .andWhere('e.createdAt BETWEEN :from AND :to', { from, to });

    const rows = await qb
      .clone()
      .select('e.type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .addSelect('COUNT(DISTINCT e.visitorHash)::int', 'visitors')
      .groupBy('e.type')
      .getRawMany<{ type: string; count: number; visitors: number }>();

    const byType: Record<string, number> = {};
    let views = 0;
    let uniqueVisitors = 0;
    for (const r of rows) {
      if (KNOWN_TYPES.includes(r.type)) byType[r.type] = Number(r.count);
      if (r.type === 'view') {
        views = Number(r.count);
        uniqueVisitors = Number(r.visitors);
      }
    }
    const clicks = Object.entries(byType)
      .filter(([k]) => k !== 'view')
      .reduce((s, [, v]) => s + v, 0);

    const daily = await qb
      .clone()
      .select("to_char(date_trunc('day', e.createdAt), 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; count: number }>();

    const topRaw = await qb
      .clone()
      .select('e.cardId', 'cardId')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('e.cardId')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ cardId: string; count: number }>();

    const topCards = topRaw.map((t) => {
      const c = cards.find((x) => x.id === t.cardId);
      return {
        code: c?.code ?? '',
        name: c?.profile?.name ?? '',
        count: Number(t.count),
      };
    });

    return {
      cards: cards.length,
      views,
      uniqueVisitors,
      clicks,
      ctr:
        views > 0
          ? Number(Math.min(clicks / views, 1).toFixed(3))
          : 0,
      byType,
      daily: daily.map((d) => ({ day: d.day, count: Number(d.count) })),
      topCards,
    };
  }

  /**
   * 用户洞察：只有自己的卡，全部是聚合数据，不含任何他人对比/排名
   */
  async userInsights(userId: string, days = 30) {
    const cards = await this.cards.find({ where: { userId } });
    const cardIds = cards.map((c) => c.id);
    const empty = {
      summary: {
        views: 0, visitors: 0, clicks: 0, ctr: 0,
        avgDwell: 0, avgScroll: 0, cards: 0,
        prevViews: 0, prevVisitors: 0,
      },
      daily: [], byType: {}, cities: [], hours: [],
      devices: [], referers: [], recent: [],
    };
    if (cardIds.length === 0) return empty;

    const { from, to } = await this.rangeDays(days);
    const prevFrom = new Date(from.getTime() - days * 24 * 3600 * 1000);
    const base = () =>
      this.events.createQueryBuilder('e')
        .where('e.cardId IN (:...ids)', { ids: cardIds });

    // 当期明细
    const cur = base().andWhere('e.createdAt BETWEEN :from AND :to', { from, to });

    const byTypeRaw = await cur.clone()
      .select('e.type', 'type').addSelect('COUNT(*)::int', 'count')
      .addSelect('COUNT(DISTINCT e.visitorHash)::int', 'visitors')
      .groupBy('e.type')
      .getRawMany<{ type: string; count: number; visitors: number }>();

    const byType: Record<string, number> = {};
    let views = 0, visitors = 0;
    for (const r of byTypeRaw) {
      if (KNOWN_TYPES.includes(r.type)) byType[r.type] = Number(r.count);
      if (r.type === 'view') { views = Number(r.count); visitors = Number(r.visitors); }
    }
    const clicks = Object.entries(byType)
      .filter(([k]) => k !== 'view').reduce((s, [, v]) => s + v, 0);

    // 停留时长 / 滚动深度
    const dwell = await cur.clone()
      .select('COALESCE(AVG(NULLIF(e.duration,0)),0)::float', 'avgDwell')
      .addSelect('COALESCE(AVG(NULLIF(e.scrollDepth,0)),0)::float', 'avgScroll')
      .getRawOne<{ avgDwell: string; avgScroll: string }>();

    // 上一周期对比
    const prev = await base()
      .andWhere('e.createdAt BETWEEN :prevFrom AND :from', { prevFrom, from })
      .select('e.type', 'type').addSelect('COUNT(*)::int', 'count')
      .addSelect('COUNT(DISTINCT e.visitorHash)::int', 'visitors')
      .groupBy('e.type')
      .getRawMany<{ type: string; count: number; visitors: number }>();
    let prevViews = 0, prevVisitors = 0;
    for (const r of prev) {
      if (r.type === 'view') { prevViews = Number(r.count); prevVisitors = Number(r.visitors); }
    }

    // 趋势
    const daily = await cur.clone()
      .select("to_char(date_trunc('day', e.createdAt), 'YYYY-MM-DD')", 'day')
      .addSelect("COUNT(*) FILTER (WHERE e.type = 'view')::int", 'views')
      .addSelect("COUNT(*) FILTER (WHERE e.type <> 'view')::int", 'clicks')
      .groupBy('day').orderBy('day', 'ASC')
      .getRawMany<{ day: string; views: number; clicks: number }>();

    // 城市
    const cities = await cur.clone()
      .select("COALESCE(NULLIF(e.city,''),'未知')", 'city')
      .addSelect('COUNT(*)::int', 'count')
      .andWhere("e.type = 'view'")
      .groupBy('city').orderBy('count', 'DESC').limit(8)
      .getRawMany<{ city: string; count: number }>();

    // 时段（0-23）
    const hours = await cur.clone()
      .select("EXTRACT(HOUR FROM e.createdAt)::int", 'hour')
      .addSelect('COUNT(*)::int', 'count')
      .andWhere("e.type = 'view'")
      .groupBy('hour').orderBy('hour', 'ASC')
      .getRawMany<{ hour: number; count: number }>();

    // 设备
    const devices = await cur.clone()
      .select(`CASE
          WHEN e.ua ILIKE '%micromessenger%' THEN '微信'
          WHEN e.ua ILIKE '%iphone%' OR e.ua ILIKE '%ipad%' THEN 'iPhone'
          WHEN e.ua ILIKE '%android%' THEN 'Android'
          WHEN e.ua ILIKE '%macintosh%' THEN 'Mac'
          WHEN e.ua ILIKE '%windows%' THEN 'Windows'
          ELSE '其他' END`, 'device')
      .addSelect('COUNT(*)::int', 'count')
      .andWhere("e.type = 'view'")
      .groupBy('device').orderBy('count', 'DESC')
      .getRawMany<{ device: string; count: number }>();

    // 来源
    const referers = await cur.clone()
      .select(`CASE
          WHEN e.referer IS NULL OR e.referer = '' THEN '直接打开'
          WHEN e.referer ILIKE '%weixin%' OR e.referer ILIKE '%wechat%' THEN '微信'
          WHEN e.referer ILIKE '%safari%' THEN 'Safari'
          WHEN e.referer ILIKE '%chrome%' THEN 'Chrome'
          WHEN e.referer ILIKE '%google%' OR e.referer ILIKE '%baidu%' THEN '搜索'
          ELSE '其他' END`, 'source')
      .addSelect('COUNT(*)::int', 'count')
      .andWhere("e.type = 'view'")
      .groupBy('source').orderBy('count', 'DESC').limit(6)
      .getRawMany<{ source: string; count: number }>();

    // 最近访客
    const recent = await cur.clone()
      .select('e.createdAt', 'at')
      .addSelect("COALESCE(NULLIF(e.city,''),'未知')", 'city')
      .addSelect('e.duration', 'duration')
      .addSelect('e.ua', 'ua')
      .andWhere("e.type = 'view'")
      .orderBy('e.createdAt', 'DESC').limit(20)
      .getRawMany<{ at: Date; city: string; duration: number; ua: string }>();

    return {
      summary: {
        cards: cards.length,
        views, visitors, clicks,
        ctr:
        views > 0
          ? Number(Math.min(clicks / views, 1).toFixed(3))
          : 0,
        avgDwell: Math.round(Number(dwell?.avgDwell ?? 0)),
        avgScroll: Math.round(Number(dwell?.avgScroll ?? 0)),
        prevViews, prevVisitors,
      },
      daily: daily.map((d) => ({
        day: d.day, views: Number(d.views), clicks: Number(d.clicks),
      })),
      byType,
      cities: cities.map((c) => ({ city: c.city, count: Number(c.count) })),
      hours: hours.map((h) => ({ hour: Number(h.hour), count: Number(h.count) })),
      devices: devices.map((d) => ({ device: d.device, count: Number(d.count) })),
      referers: referers.map((r) => ({ source: r.source, count: Number(r.count) })),
      recent: recent.map((r) => ({
        at: r.at,
        city: r.city,
        duration: Number(r.duration ?? 0),
        device: /micromessenger/i.test(r.ua ?? '') ? '微信'
          : /iphone|ipad/i.test(r.ua ?? '') ? 'iPhone'
          : /android/i.test(r.ua ?? '') ? 'Android'
          : /macintosh/i.test(r.ua ?? '') ? 'Mac'
          : /windows/i.test(r.ua ?? '') ? 'Windows' : '其他',
      })),
    };
  }

  /**
   * 我名下每张卡的独立数据（分页，支持搜索）
   * 先分页取卡片，再只对这些卡做一次聚合，几千张卡也不会慢
   */
  async userCardsStats(
    userId: string,
    days = 30,
    page = 1,
    size = 20,
    q = '',
  ) {
    const safeSize = Math.min(Math.max(size || 20, 1), 100);
    const safePage = Math.max(page || 1, 1);

    const qb = this.cards
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId });
    if (q.trim()) {
      qb.andWhere('(c.code ILIKE :q OR c.profile->>\'name\' ILIKE :q)', {
        q: `%${q.trim()}%`,
      });
    }

    const total = await qb.clone().getCount();
    const cards = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((safePage - 1) * safeSize)
      .take(safeSize)
      .getMany();

    if (cards.length === 0) {
      return { days, total, page: safePage, size: safeSize, items: [] };
    }

    const { from, to } = await this.rangeDays(days);
    const cardIds = cards.map((c) => c.id);

    const rows = await this.events
      .createQueryBuilder('e')
      .select('e.cardId', 'cardId')
      .addSelect("COUNT(*) FILTER (WHERE e.type = 'view')::int", 'views')
      .addSelect(
        "COUNT(DISTINCT e.visitorHash) FILTER (WHERE e.type = 'view')::int",
        'visitors',
      )
      .addSelect("COUNT(*) FILTER (WHERE e.type <> 'view')::int", 'clicks')
      .addSelect(
        "COUNT(DISTINCT e.visitorHash) FILTER (WHERE e.type <> 'view')::int",
        'engaged',
      )
      .addSelect(
        "COALESCE(AVG(NULLIF(e.duration,0)) FILTER (WHERE e.type = 'view'),0)::float",
        'avgDwell',
      )
      .addSelect("MAX(e.createdAt) FILTER (WHERE e.type = 'view')", 'lastViewAt')
      .where('e.cardId IN (:...ids)', { ids: cardIds })
      .andWhere('e.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('e.cardId')
      .getRawMany<{
        cardId: string;
        views: string;
        visitors: string;
        clicks: string;
        engaged: string;
        avgDwell: string;
        lastViewAt: Date | null;
      }>();

    const map = new Map(rows.map((r) => [r.cardId, r]));

    return {
      days,
      total,
      page: safePage,
      size: safeSize,
      items: cards.map((c) => {
        const r = map.get(c.id);
        const views = Number(r?.views ?? 0);
        const clicks = Number(r?.clicks ?? 0);
        return {
          code: c.code,
          name: c.profile?.name ?? '',
          templateSlug: c.templateSlug,
          revoked: !!c.revokedAt,
          enabled: c.enabled,
          createdAt: c.createdAt,
          views,
          visitors: Number(r?.visitors ?? 0),
          clicks,
          engaged: Number(r?.engaged ?? 0),
          // 互动率 = 产生过互动的访客 / 访客，不会超过 100%
          ctr:
            Number(r?.visitors ?? 0) > 0
              ? Number(
                  (
                    Number(r?.engaged ?? 0) / Number(r?.visitors ?? 1)
                  ).toFixed(3),
                )
              : 0,
          avgDwell: Math.round(Number(r?.avgDwell ?? 0)),
          lastViewAt: r?.lastViewAt ?? null,
        };
      }),
    };
  }

  /** 我的页三个数字：卡片数 / 累计打开 / 使用天数（一次查询，不分时间段） */
  async userSummary(userId: string) {
    const cards = await this.cards.find({ where: { userId } });
    const cardIds = cards.map((c) => c.id);

    let totalViews = 0;
    if (cardIds.length > 0) {
      const row = await this.events
        .createQueryBuilder('e')
        .select("COUNT(*) FILTER (WHERE e.type = 'view')::int", 'views')
        .where('e.cardId IN (:...ids)', { ids: cardIds })
        .getRawOne<{ views: string }>();
      totalViews = Number(row?.views ?? 0);
    }

    // 使用天数：第一条卡片创建至今（没有卡片就是 0）
    let daysUsed = 0;
    if (cards.length > 0) {
      const first = cards.reduce(
        (a, b) => (a.createdAt < b.createdAt ? a : b),
        cards[0],
      );
      daysUsed =
        Math.floor(
          (Date.now() - new Date(first.createdAt).getTime()) / 86400000,
        ) + 1;
    }

    return { cards: cards.length, totalViews, daysUsed };
  }}
