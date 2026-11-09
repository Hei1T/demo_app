import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CardsService, CardProfile } from './cards.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { RenderService } from '../render/render.service.js';
import { THEMES } from '../templates/catalog.js';
import { PLATFORMS } from '../templates/platforms.js';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator.js';
import { shortUrl } from '../common/short-code.js';

type ReqLike = { headers: Record<string, unknown>; ip?: string; socket?: { remoteAddress?: string } };


const DEMO: CardProfile = {
  name: '夜航',
  role: 'AI 课程主理人',
  org: '夜航 AI',
  phone: '13800001111',
  email: 'hi@nightflight.ai',
  addr: '杭州市西湖区文三路 90 号',
};

@Controller()
export class CardsController {
  constructor(
    private readonly cards: CardsService,
    private readonly analytics: AnalyticsService,
    private readonly render: RenderService,
  ) {}

  /** 作废这张卡（仅所有者）：短链立刻 410 */
  @Post('api/cards/:code/revoke')
  @UseGuards(AuthGuard('jwt'))
  revoke(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.cards.revoke(user.id, code);
  }

  /** 恢复作废的卡（仅所有者） */
  @Post('api/cards/:code/restore')
  @UseGuards(AuthGuard('jwt'))
  restore(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.cards.restore(user.id, code);
  }
  /* ================= 模板 ================= */

  /** 社交平台目录（国内 + 国际，共 40+ 个） */
  @Get('api/platforms')
  platforms() {
    return {
      count: PLATFORMS.length,
      platforms: PLATFORMS,
    };
  }

  @Get('api/templates')
  templates() {
    return {
      count: THEMES.length,
      templates: THEMES.map((t) => ({
        id: t.id,
        name: t.name,
        tier: t.tier,
        layout: t.layout,
        tokens: t.tokens,
      })),
    };
  }

  /** 预览页允许后台 iframe 嵌入（同机不同端口） */
  private allowEmbed(res: Response) {
    res.removeHeader('X-Frame-Options');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' http://localhost:5173 http://127.0.0.1:5173 http://192.168.1.2:5173",
    );
  }
  @Get('preview/:slug')
  previewOne(@Param('slug') slug: string, @Res() res: Response) {
    if (!THEMES.some((t) => t.id === slug)) {
      res.status(404).type('html').send(this.render.renderNotFound());
      return;
    }
    this.allowEmbed(res);
    res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'no-store')
      .send(
        this.render.renderCard({
          code: 'PREVIEW',
          profile: DEMO,
          templateSlug: slug,
        }),
      );
  }

  @Get('preview')
  previewIndex(@Res() res: Response) {
    this.allowEmbed(res);
    const items = THEMES.map(
      (t) => `
      <a class="item" href="/preview/${t.id}" target="_blank" rel="noopener noreferrer">
        <div class="frame"><iframe src="/preview/${t.id}" loading="lazy" scrolling="no"></iframe></div>
        <div class="meta"><b>${t.name}</b>
          <span class="tag ${t.tier}">${t.tier === 'pro' ? 'PRO' : '免费'}</span></div>
        <div class="slug">${t.id} · layout ${t.layout}</div>
      </a>`,
    ).join('');
    res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'no-store')
      .send(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>模板预览</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#07080b;color:#eef1f6;
font-family:-apple-system,"PingFang SC",sans-serif;padding:28px}
h1{font-size:20px;margin:0 0 6px}.sub{font-size:12.5px;color:#8b93a7;margin-bottom:24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px}
.item{text-decoration:none;color:inherit;display:block}
.frame{width:100%;overflow:hidden;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:#0b0d12;position:relative}
.frame iframe{width:390px;height:680px;border:0;position:absolute;top:0;left:0;transform-origin:top left}
.meta{display:flex;align-items:center;gap:8px;margin-top:10px}
.meta b{font-size:14px}
.tag{font-size:9.5px;padding:2px 7px;border-radius:8px;font-weight:700}
.tag.free{background:rgba(74,222,128,.15);color:#4ade80}
.tag.pro{background:rgba(232,200,106,.15);color:#e8c86a}
.slug{font-size:10.5px;color:#5b6478;margin-top:3px}
</style></head><body><h1>模板预览 · ${THEMES.length} 套</h1>
<div class="sub">点任意一套新窗口打开 · GET /preview/:slug</div>
<div class="grid">${items}</div>
<script>
function fit(){document.querySelectorAll('.frame').forEach(f=>{const s=f.clientWidth/390;
const fr=f.querySelector('iframe');if(fr)fr.style.transform='scale('+s+')';f.style.height=(680*s)+'px';});}
addEventListener('resize',fit);fit();
</script></body></html>`);
  }

  /* ================= 名片（需登录） ================= */

  @UseGuards(AuthGuard('jwt'))
  @Post('api/cards')
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: { profile: CardProfile; templateSlug?: string },
  ) {
    const card = await this.cards.create(
      user.id,
      body?.profile ?? ({} as CardProfile),
      body?.templateSlug ?? 'noir',
    );
    return { ok: true, ...this.cards.toPublic(card) };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('api/cards')
  async list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('lite') lite?: string,
  ) {
    const r = await this.cards.listMine(
      user.id,
      Number(page ?? 1) || 1,
      Number(size ?? 20) || 20,
      lite === '1',
    );
    return {
      count: r.total,
      total: r.total,
      page: r.page,
      size: r.size,
      cards: r.items,
    };
  }

  /** 批量更新我的所有卡片（资料 + 模板），一次 SQL */
  @Patch('api/cards/bulk')
  @UseGuards(AuthGuard('jwt'))
  async bulkUpdate(
    @CurrentUser() user: AuthUser,
    @Body() body: { profile?: Record<string, unknown>; templateSlug?: string },
  ) {
    return this.cards.bulkUpdateProfile(
      user.id,
      body.profile ?? {},
      body.templateSlug,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('api/cards/:code')
  async getOne(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    const card = await this.cards.getOwned(user.id, code);
    return { ok: true, ...this.cards.toPublic(card) };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('api/cards/:code')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Body() body: { profile?: Partial<CardProfile>; templateSlug?: string; enabled?: boolean },
  ) {
    const card = await this.cards.update(user.id, code, body ?? {});
    return { ok: true, ...this.cards.toPublic(card) };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('api/cards/:code')
  async remove(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.cards.remove(user.id, code);
  }

  /* ================= 公开短链（贴卡访问） ================= */

  /**
   * 根路径短链：nfc.life/6RZ2BJPW9F
   * NFC 写入这个最短地址，统计按卡唯一归因
   * 来源参数 s=nfc|qr|link 会记入 event.extra
   */
  @Get(':code')
  async shortLink(
    @Param('code') code: string,
    @Query('s') source: string,
    @Req() req: ReqLike,
    @Res() res: Response,
  ) {
    // 只接受 10 位 base32 短码，其余交给 NotFound
    if (!/^[A-HJ-NP-Z2-9]{10}$/i.test(code)) {
      res.status(404).type('html').send(this.render.renderNotFound());
      return;
    }
    this.allowEmbed(res);
    const anyCard = await this.cards.getByCodeAnyState(code.toUpperCase());
    if (anyCard?.revokedAt) {
      res
        .status(410)
        .type('html')
        .setHeader('X-Card-Revoked', '1')
        .send(this.render.renderRevoked(anyCard.profile?.name ?? ''));
      return;
    }
    let card = await this.cards.getPublic(code.toUpperCase());
    if (!card) {
      // 卡可能被停用：用户手里的 NFC 卡仍然要能看到「已停用」而不是 404
      const any = await this.cards.getByCodeAnyState(code.toUpperCase());
      if (any && !any.enabled) {
        res
          .status(410)
          .type('html')
          .send(this.render.renderDisabled(any.profile?.name ?? ''));
        return;
      }
      res.status(404).type('html').send(this.render.renderNotFound());
      return;
    }
    this.analytics.track(card.id, 'view', req, card.userId);
    res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('X-Short-Code', card.code)
      .setHeader('X-Track-Source', source || 'direct')
      .setHeader('Cache-Control', 'no-store')
      .send(
        this.render.renderCard({
          code: card.code,
          profile: card.profile,
          templateSlug: card.templateSlug,
        }),
      );
  }

  @Get('u/:code')
  async page(@Param('code') code: string, @Req() req: ReqLike, @Res() res: Response) {
    this.allowEmbed(res);
    const anyCard = await this.cards.getByCodeAnyState(code);
    if (anyCard?.revokedAt) {
      res.status(410).type('html').send(this.render.renderRevoked(anyCard.profile?.name ?? ''));
      return;
    }
    const card = await this.cards.getPublic(code);
    if (!card) {
      res.status(404).type('html').send(this.render.renderNotFound());
      return;
    }
    // 埋点不阻塞渲染
    this.analytics.track(card.id, 'view', req, card.userId);

    res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'no-store')
      .send(
        this.render.renderCard({
          code: card.code,
          profile: card.profile,
          templateSlug: card.templateSlug,
        }),
      );
  }

  @Get('u/:code/vcf')
  async vcf(@Param('code') code: string, @Res() res: Response) {
    const card = await this.cards.getPublic(code);
    if (!card) {
      res.status(404).send('not found');
      return;
    }
    res
      .setHeader('Content-Type', 'text/vcard; charset=utf-8')
      .setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(card.profile.name)}.vcf"`,
      )
      .send(
        this.render.renderVcf({
          code: card.code,
          profile: card.profile,
          templateSlug: card.templateSlug,
        }),
      );
  }

  /** 点击埋点（sendBeacon 上报，不阻塞跳转） */
  @Post('api/track/:code')
  async track(
    @Param('code') code: string,
    @Body() body: { type?: string },
    @Req() req: ReqLike,
  ) {
    const card = await this.cards.getPublic(code);
    if (!card) return { ok: false };
    this.analytics.track(card.id, (body?.type ?? 'view') as never, req, card.userId);
    return { ok: true };
  }
}