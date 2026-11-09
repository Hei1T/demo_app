import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { DataSource } from 'typeorm';
import { AdminGuard } from '../common/guards/admin.guard.js';

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: unknown[][]): string {
  const head = headers.map(csvCell).join(',');
  const body = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  return '\uFEFF' + head + '\n' + body + '\n'; // BOM 让 Excel 正确识别 UTF-8
}

@Controller('admin/export')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class ExportController {
  constructor(private readonly ds: DataSource) {}

  @Get('users.csv')
  async users(@Res() res: Response) {
    const rows = await this.ds.query(`
      SELECT u.email, u.name, u.role, u.plan, u."createdAt", u."lastLoginAt",
             COUNT(c.id)::int AS cards
      FROM users u LEFT JOIN cards c ON c."userId" = u.id AND c."deletedAt" IS NULL
      GROUP BY u.id ORDER BY u."createdAt" DESC
    `);
    this.send(
      res,
      'users.csv',
      toCsv(
        ['邮箱', '姓名', '角色', '套餐', '注册时间', '最近登录', '名片数'],
        rows.map((r: Record<string, unknown>) => [
          r.email, r.name, r.role, r.plan, r.createdAt, r.lastLoginAt, r.cards,
        ]),
      ),
    );
  }

  @Get('cards.csv')
  async cards(@Res() res: Response) {
    const rows = await this.ds.query(`
      SELECT c.code, c.profile->>'name' AS name, c.profile->>'role' AS role,
             c.profile->>'org' AS org, c.profile->>'phone' AS phone, c.profile->>'email' AS email,
             c."templateSlug", c.enabled, c."createdAt", u.email AS owner,
             COUNT(e.id) FILTER (WHERE e.type='view')::int AS views,
             COUNT(DISTINCT e."visitorHash") FILTER (WHERE e.type='view')::int AS uv,
             COUNT(e.id) FILTER (WHERE e.type<>'view' AND e.type<>'dwell')::int AS clicks
      FROM cards c
      LEFT JOIN users u ON u.id = c."userId"
      LEFT JOIN events e ON e."cardId" = c.id
      WHERE c."deletedAt" IS NULL
      GROUP BY c.id, u.email ORDER BY c."createdAt" DESC
    `);
    this.send(
      res,
      'cards.csv',
      toCsv(
        ['短码', '姓名', '职位', '公司', '电话', '邮箱', '模板', '启用', '创建时间', '所有者', '打开量', '独立访客', '点击量'],
        rows.map((r: Record<string, unknown>) => [
          r.code, r.name, r.role, r.org, r.phone, r.email, r.templateSlug,
          r.enabled ? '是' : '否', r.createdAt, r.owner, r.views, r.uv, r.clicks,
        ]),
      ),
    );
  }

  @Get('events.csv')
  async events(@Res() res: Response, @Query('days') days?: string) {
    const d = Math.min(Math.max(Number(days) || 30, 1), 365);
    const rows = await this.ds.query(
      `
      SELECT e."createdAt", c.code, c.profile->>'name' AS card_name,
             e.type, e.city, e.region, e.country, e.duration, e."scrollDepth",
             e."targetTag", e."targetLabel", e."targetHref", e.referer, e."ipMasked"
      FROM events e JOIN cards c ON c.id = e."cardId"
      WHERE e."createdAt" > now() - ($1 || ' days')::interval
      ORDER BY e."createdAt" DESC
      LIMIT 200000
    `,
      [String(d)],
    );
    this.send(
      res,
      `events-${d}d.csv`,
      toCsv(
        ['时间', '短码', '名片', '类型', '城市', '省份', '国家', '停留ms', '滚动%', '标签', '文案', '链接', '来源', 'IP段'],
        rows.map((r: Record<string, unknown>) => [
          r.createdAt, r.code, r.card_name, r.type, r.city, r.region, r.country,
          r.duration, r.scrollDepth, r.targetTag, r.targetLabel, r.targetHref,
          r.referer, r.ipMasked,
        ]),
      ),
    );
  }

  private send(res: Response, filename: string, csv: string) {
    res
      .setHeader('Content-Type', 'text/csv; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  }
}
