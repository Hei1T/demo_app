import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Card } from '../database/entities/card.entity.js';
import { generateCode, shortUrl } from '../common/short-code.js';

export type SocialLink = {
  platform: string;
  value: string;
  label?: string;
};

export type CardProfile = {
  name: string;
  role?: string;
  org?: string;
  /** 一句话介绍 */
  bio?: string;
  phone?: string;
  email?: string;
  addr?: string;
  /** 个人网站 */
  website?: string;
  wechat?: string;
  wechatQr?: string;
  avatar?: string;
  /** 语言，如 zh-CN, en */
  languages?: string[];
  /** 社交平台（国内 + 国际） */
  links?: SocialLink[];
  /** 兼容旧数据 */
  linksLegacy?: { label: string; url: string }[];
};

@Injectable()
export class CardsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Card) private readonly repo: Repository<Card>,
  ) {}

  /** 创建：卡永远归属当前登录用户 */
  async create(
    userId: string,
    profile: CardProfile,
    templateSlug: string,
  ): Promise<Card> {
    if (!profile?.name?.trim()) throw new ForbiddenException('姓名必填');

    // 短码永不复用：连已软删除的卡也算，避免旧 NFC 卡扫到别人的新名片
    let code = generateCode();
    for (let i = 0; i < 20; i++) {
      const taken = await this.repo
        .createQueryBuilder('c')
        .withDeleted()
        .where('c.code = :code', { code })
        .getCount();
      if (taken === 0) break;
      code = generateCode();
    }

    const card = this.repo.create({
      code,
      userId,
      profile: { ...profile, name: profile.name.trim() },
      templateSlug: templateSlug || 'noir',
      enabled: true,
    });
    return this.repo.save(card);
  }

  /** 我的卡列表（严格按 userId 过滤） */
  /** 我的卡片列表：分页，避免几千张卡一次性下发 */
  async listMine(userId: string, page = 1, size = 20, lite = false) {
    const safeSize = Math.min(Math.max(size || 20, 1), 100);
    const safePage = Math.max(page || 1, 1);
    const [rows, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeSize,
      take: safeSize,
    });
    const items = rows.map((c) =>
      lite
        ? {
            code: c.code,
            name: c.profile?.name ?? '',
            templateSlug: c.templateSlug,
            revokedAt: c.revokedAt,
            createdAt: c.createdAt,
          }
        : this.toPublic(c),
    );
    return { items, total, page: safePage, size: safeSize };
  }

  /** 批量更新所有卡片的资料和模板（一次 SQL，几千张也不怕） */
  async bulkUpdateProfile(
    userId: string,
    profile: Record<string, unknown>,
    templateSlug?: string,
  ) {
    const patch: Record<string, unknown> = { profile };
    if (templateSlug) patch.templateSlug = templateSlug;
    const r = await this.repo.update({ userId }, patch);

    // 同步用户表的显示名，否则导航栏/问候语还是旧名字
    const displayName = (profile?.name ?? '') as string;
    if (displayName.trim()) {
      await this.dataSource
        .query('UPDATE users SET name = $1 WHERE id = $2', [
          displayName.trim(),
          userId,
        ])
        .catch(() => undefined);
    }

    return { ok: true, updated: r.affected ?? 0 };
  }

  /** 取自己的卡；不是自己的 → 一律 404（不暴露存在性） */
  async getOwned(userId: string, code: string): Promise<Card> {
    const card = await this.repo.findOne({
      where: { code: code.toUpperCase(), userId },
    });
    if (!card) throw new NotFoundException('名片不存在');
    return card;
  }

  /** 公开读取（贴卡访问用），不校验归属 */
  async getPublic(code: string): Promise<Card | null> {
    return this.repo.findOne({
      where: { code: code.toUpperCase(), enabled: true },
    });
  }

  /** 含停用状态的查询：用于给用户手里已写入的卡一个友好页面 */
  async getByCodeAnyState(code: string): Promise<Card | null> {
    return this.repo.findOne({ where: { code: code.toUpperCase() } });
  }

  /** 改资料 / 换模板 */
  async update(
    userId: string,
    code: string,
    patch: {
      profile?: Partial<CardProfile>;
      templateSlug?: string;
      enabled?: boolean;
    },
  ): Promise<Card> {
    const card = await this.getOwned(userId, code);
    if (patch.profile) {
      card.profile = { ...card.profile, ...patch.profile };
      if (!card.profile.name?.trim()) throw new ForbiddenException('姓名不能为空');
    }
    if (patch.templateSlug) card.templateSlug = patch.templateSlug;
    if (typeof patch.enabled === 'boolean') card.enabled = patch.enabled;
    return this.repo.save(card);
  }

  async remove(userId: string, code: string) {
    const card = await this.getOwned(userId, code);
    await this.repo.softRemove(card);
    return { ok: true };
  }

  toPublic(c: Card) {
    return {
      code: c.code,
      url: shortUrl(c.code),
      profile: c.profile,
      templateSlug: c.templateSlug,
      enabled: c.enabled,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  /** 作废这张卡：只有所有者能操作，作废后短链立刻失效 */
  async revoke(userId: string, code: string) {
    const card = await this.repo.findOne({
      where: { code: code.toUpperCase(), userId },
    });
    // 不是自己的卡：返回 404，不暴露存在性
    if (!card) throw new NotFoundException('名片不存在');
    if (card.revokedAt) return { ok: true, code: card.code, revokedAt: card.revokedAt };
    card.revokedAt = new Date();
    await this.repo.save(card);
    return { ok: true, code: card.code, revokedAt: card.revokedAt };
  }

  /** 恢复已作废的卡（如果 NFC 标签没被物理锁死，可以继续用） */
  async restore(userId: string, code: string) {
    const card = await this.repo.findOne({
      where: { code: code.toUpperCase(), userId },
    });
    if (!card) throw new NotFoundException('名片不存在');
    card.revokedAt = null;
    await this.repo.save(card);
    return { ok: true, code: card.code };
  }}
