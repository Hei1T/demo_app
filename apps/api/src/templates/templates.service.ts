import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateEntity } from '../database/entities/template.entity.js';
import { Card } from '../database/entities/card.entity.js';
import { THEMES, findTheme, type Template } from './catalog.js';
import { sanitizeTemplateHtml, renderPlaceholders, assembleDocument } from './custom-render.js';

/**
 * 模板服务：数据库为唯一真相源，启动时从 catalog 种子同步。
 * 内存缓存一份，渲染时同步读取（不阻塞 SSR）。
 */
@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);
  private cache = new Map<string, TemplateEntity>();

  constructor(
    @InjectRepository(TemplateEntity)
    private readonly repo: Repository<TemplateEntity>,
    @InjectRepository(Card)
    private readonly cards: Repository<Card>,
  ) {}

  async onModuleInit() {
    await this.seed();
    await this.reload();
  }

  /** 把 catalog 里内置模板同步进数据库（不覆盖后台已改过的） */
  async seed() {
    for (let i = 0; i < THEMES.length; i++) {
      const t = THEMES[i];
      const exists = await this.repo.findOne({ where: { slug: t.id } });
      if (exists) {
        // 只补空字段，不覆盖后台编辑
        let changed = false;
        if (!exists.tokens || Object.keys(exists.tokens).length === 0) {
          exists.tokens = t.tokens as unknown as Record<string, string | number>;
          changed = true;
        }
        if (!exists.layout) {
          exists.layout = t.layout;
          changed = true;
        }
        if (changed) await this.repo.save(exists);
        continue;
      }
      await this.repo.save(
        this.repo.create({
          slug: t.id,
          name: t.name,
          tier: t.tier,
          layout: t.layout,
          tokens: t.tokens as unknown as Record<string, string | number>,
          enabled: true,
          sortOrder: i,
          version: 1,
        }),
      );
    }
    this.logger.log(`模板种子同步完成，共 ${THEMES.length} 套`);
  }

  async reload() {
    const rows = await this.repo.find({ order: { sortOrder: 'ASC' } });
    this.cache = new Map(rows.map((r) => [r.slug, r]));
  }

  /** 渲染用：同步取原始实体（含自定义 HTML） */
  getCachedEntity(slug: string): TemplateEntity | undefined {
    return this.cache.get(slug);
  }

  /** 渲染用：同步取模板（DB 优先，回退内置） */
  getForRender(slug: string): Template {
    const row = this.cache.get(slug);
    if (row && row.enabled) {
      return {
        id: row.slug,
        name: row.name,
        tier: row.tier,
        layout: row.layout,
        tokens: row.tokens as unknown as Template['tokens'],
      };
    }
    return findTheme(slug);
  }

  async list() {
    const rows = await this.repo.find({ order: { sortOrder: 'ASC' } });
    const usageRaw = await this.cards
      .createQueryBuilder('c')
      .select('c.templateSlug', 'slug')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('c.templateSlug')
      .getRawMany<{ slug: string; count: number }>();
    const usageMap = new Map(usageRaw.map((u) => [u.slug, Number(u.count)]));
    return rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      tier: r.tier,
      layout: r.layout,
      enabled: r.enabled,
      version: r.version,
      tokens: r.tokens,
      usage: usageMap.get(r.slug) ?? 0,
      hasCustomHtml: !!(r.bodyHtml && r.bodyHtml.trim()),
      bodyHtml: r.bodyHtml ?? '',
      cssText: r.cssText ?? '',
      headConfig: r.headConfig ?? {},
      updatedAt: r.updatedAt,
    }));
  }

  async entity(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  async setEnabled(slug: string, enabled: boolean) {
    await this.repo.update({ slug }, { enabled });
    await this.reload();
    return { ok: true, slug, enabled };
  }

  /** 新建模板 */
  async create(input: {
    slug: string;
    name: string;
    tier?: 'free' | 'pro';
    layout?: TemplateEntity['layout'];
    tokens: Record<string, string | number>;
    sortOrder?: number;
    bodyHtml?: string;
    cssText?: string;
    headConfig?: { title?: string; themeColor?: string };
  }) {
    const slug = String(input.slug ?? '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]{1,30}$/.test(slug)) {
      throw new BadRequestException('slug 只能用小写字母/数字/短横线，2-31 位');
    }
    if (!input.name?.trim()) throw new BadRequestException('名称必填');
    if (!input.tokens || Object.keys(input.tokens).length === 0) {
      throw new BadRequestException('缺少配色 tokens');
    }
    const exists = await this.repo.findOne({ where: { slug } });
    if (exists) throw new BadRequestException('该 slug 已存在');

    const maxSort = await this.repo
      .createQueryBuilder('t')
      .select('MAX(t.sortOrder)', 'm')
      .getRawOne<{ m: number | null }>();

    const row = this.repo.create({
      slug,
      name: input.name.trim(),
      tier: input.tier ?? 'free',
      layout: input.layout ?? 'classic',
      tokens: input.tokens ?? {},
      bodyHtml: sanitizeTemplateHtml(input.bodyHtml ?? '').html,
      cssText: input.cssText ?? '',
      headConfig: input.headConfig ?? {},
      enabled: true,
      sortOrder: input.sortOrder ?? (Number(maxSort?.m ?? 0) + 1),
      version: 1,
    });
    await this.repo.save(row);
    await this.reload();
    return { ok: true, slug };
  }

  /** 复制模板 */
  async duplicate(sourceSlug: string, newSlug?: string, newName?: string) {
    const src = await this.entity(sourceSlug);
    if (!src) throw new BadRequestException('源模板不存在');
    const base = newSlug?.trim().toLowerCase() || `${src.slug}-copy`;
    let slug = base;
    let i = 2;
    while (await this.repo.findOne({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return this.create({
      slug,
      name: newName?.trim() || `${src.name} 副本`,
      tier: src.tier,
      layout: src.layout,
      tokens: src.tokens as Record<string, string | number>,
      sortOrder: src.sortOrder + 1,
      bodyHtml: src.bodyHtml,
      cssText: src.cssText,
      headConfig: src.headConfig,
    });
  }

  /** 更新模板 */
  async update(
    slug: string,
    patch: {
      name?: string;
      tier?: 'free' | 'pro';
      enabled?: boolean;
      tokens?: Record<string, string | number>;
      sortOrder?: number;
      bodyHtml?: string;
      cssText?: string;
      headConfig?: { title?: string; themeColor?: string };
    },
  ) {
    const row = await this.entity(slug);
    if (!row) throw new BadRequestException('模板不存在');
    if (patch.name !== undefined) row.name = patch.name.trim();
    if (patch.tier) row.tier = patch.tier;
    if (typeof patch.enabled === 'boolean') row.enabled = patch.enabled;
    if (patch.sortOrder !== undefined) row.sortOrder = patch.sortOrder;
    if (patch.tokens) {
      row.tokens = { ...row.tokens, ...patch.tokens };
      row.version += 1;
    }
    if (patch.bodyHtml !== undefined) {
      row.bodyHtml = sanitizeTemplateHtml(patch.bodyHtml).html;
      row.version += 1;
    }
    if (patch.cssText !== undefined) row.cssText = patch.cssText;
    if (patch.headConfig) row.headConfig = { ...row.headConfig, ...patch.headConfig };
    await this.repo.save(row);
    await this.reload();
    return { ok: true, slug, version: row.version };
  }


  /** 预览自定义 HTML（用示例资料，不落库） */
  previewCustom(input: {
    slug?: string;
    bodyHtml: string;
    cssText?: string;
    title?: string;
    themeColor?: string;
  }) {
    const demo = {
      name: '夜航',
      role: 'AI 课程主理人',
      org: '夜航 AI',
      bio: '帮 10 万人用上 AI',
      phone: '13800001111',
      email: 'hi@nightflight.ai',
      addr: '杭州市西湖区文三路 90 号',
      website: 'https://nightflight.ai',
      links: [
        { platform: 'wechat', value: 'nightflight_ai' },
        { platform: 'linkedin', value: 'nightflight' },
        { platform: 'instagram', value: 'nightflight.ai' },
        { platform: 'x', value: 'nightflight_ai' },
        { platform: 'douyin', value: 'https://www.douyin.com/user/nightflight' },
        { platform: 'github', value: 'nightflight' },
      ],
    };
    const { html: safe, warnings } = sanitizeTemplateHtml(input.bodyHtml ?? '');
    const body = renderPlaceholders(safe, demo, 'PREVIEW');
    const doc = assembleDocument({
      bodyHtml: body,
      cssText: input.cssText ?? '',
      title: (input.title || '{{name}} · 数字名片').replace(/\{\{\s*name\s*\}\}/g, demo.name),
      themeColor: input.themeColor,
    });
    return { ok: true, html: doc, warnings };
  }
  /** 删除（有使用量时拒绝） */
  async remove(slug: string) {
    const used = await this.cards.count({ withDeleted: true, where: { templateSlug: slug } });
    if (used > 0) {
      throw new BadRequestException(`该模板已被 ${used} 张名片使用，不能删除（可改为停用）`);
    }
    await this.repo.delete({ slug });
    await this.reload();
    return { ok: true, slug };
  }


}
