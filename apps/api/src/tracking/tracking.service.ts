import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import * as geoipNs from 'geoip-lite';

// ESM 下 geoip-lite 的具名导出不存在，实际挂在 default 上
const geoip = (geoipNs as unknown as { default?: typeof geoipNs }).default ?? geoipNs;
import { Event } from '../database/entities/event.entity.js';
import { Card } from '../database/entities/card.entity.js';

type Incoming = {
  t: string;
  at: number;
  dt: number;
  [k: string]: unknown;
};

export type CollectBody = {
  code: string;
  url?: string;
  ref?: string;
  ua?: string;
  lang?: string;
  tz?: string;
  screen?: string;
  events?: Incoming[];
};

const DAY_SALT = process.env.VISITOR_SALT ?? 'nfc-visitor-salt';

function normalizeIp(ip: string): string {
  if (!ip) return '';
  let s = ip.trim();
  if (s.startsWith('::ffff:')) s = s.slice(7);
  if (s === '::1') s = '127.0.0.1';
  return s;
}

function maskIp(ip: string): string {
  const s = normalizeIp(ip);
  if (s.includes(':')) return s.split(':').slice(0, 4).join(':') + ':…';
  const p = s.split('.');
  return p.length === 4 ? `${p[0]}.${p[1]}.x.x` : s;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(Event)
    private readonly events: Repository<Event>,
    @InjectRepository(Card)
    private readonly cards: Repository<Card>,
  ) {}

  /** IP → 城市/省份/国家（离线库，不外发） */
  resolveGeo(rawIp: string) {
    const ip = normalizeIp(rawIp);
    const empty = { city: null as string | null, region: null as string | null, country: null as string | null, timezone: null as string | null, ll: null as number[] | null };
    if (!ip) return empty;
    try {
      const g = geoip.lookup(ip);
      if (!g) return empty;
      return {
        city: g.city || null,
        region: g.region || null,
        country: g.country || null,
        timezone: (g as unknown as { timezone?: string }).timezone || null,
        ll: g.ll || null,
      };
    } catch {
      return empty;
    }
  }

  fingerprint(ip: string, ua: string): string {
    const day = new Date().toISOString().slice(0, 10);
    return createHash('sha256')
      .update(`${normalizeIp(ip)}|${ua}|${day}|${DAY_SALT}`)
      .digest('hex');
  }

  /**
   * 收到一批前端事件。永不抛错（埋点不能影响用户体验）。
   */
  async collect(
    body: CollectBody,
    clientIp: string,
  ): Promise<{ ok: boolean; n?: number }> {
    try {
      const code = String(body?.code ?? '').trim().toUpperCase();
      const list = Array.isArray(body?.events) ? body.events : [];
      if (!code || list.length === 0) return { ok: false };

      const card = await this.cards.findOne({ where: { code } });
      if (!card) return { ok: false };

      const ip = clientIp;
      const geo = this.resolveGeo(ip);
      const ua = String(body.ua ?? '').slice(0, 380);
      const visitorHash = this.fingerprint(ip, ua);
      const ipMasked = maskIp(ip);
      const ref = String(body.ref ?? body.url ?? '').slice(0, 380);

      const rows: Event[] = [];
      for (const e of list.slice(0, 100)) {
        const type = String(e.t ?? '').slice(0, 30);
        if (!type) continue;

        const extra: Record<string, unknown> = {
          lang: body.lang ?? '',
          tz: body.tz ?? '',
          screen: body.screen ?? '',
          geoTime: geo.timezone ?? '',
        };
        if (geo.ll) extra.ll = geo.ll;
        for (const k of ['dpr', 'vw', 'vh', 'x', 'y', 'btn', 'path', 'scroll', 'text'] as const) {
          if (e[k] !== undefined) extra[k] = e[k];
        }
        if (body.url) extra.page = String(body.url).slice(0, 300);

        rows.push(
          this.events.create({
            cardId: card.id,
            userId: card.userId,
            type: type as Event['type'],
            visitorHash,
            ua,
            referer: ref,
            ipMasked,
            city: geo.city,
            region: geo.region,
            country: geo.country,
            duration: typeof e.duration === 'number' ? Math.round(e.duration) : null,
            scrollDepth: typeof e.scroll === 'number' ? Math.round(e.scroll) : null,
            targetTag: e.tag ? String(e.tag).slice(0, 60) : null,
            targetLabel: e.label ? String(e.label).slice(0, 150) : null,
            targetHref: e.href ? String(e.href).slice(0, 190) : null,
            extra,
          }),
        );
      }

      if (rows.length) await this.events.save(rows, { chunk: 50 });
      return { ok: true, n: rows.length };
    } catch (err) {
      this.logger.warn(`collect failed: ${(err as Error).message}`);
      return { ok: false };
    }
  }
}
