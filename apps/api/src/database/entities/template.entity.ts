import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TemplateTier = 'free' | 'pro';
export type TemplateLayout = 'classic' | 'banner' | 'minimal';

/**
 * 模板存两处：
 *  - 源文件：src/templates/store/<slug>/{theme.json,layout.html}
 *  - 数据库：本表（运行时以 DB 为准，支持后台在线编辑、热更新）
 */
@Entity({ name: 'templates' })
export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  slug!: string;

  @Column({ type: 'varchar', length: 60 })
  name!: string;

  @Column({ type: 'varchar', length: 10, default: 'free' })
  tier!: TemplateTier;

  @Column({ type: 'varchar', length: 20, default: 'classic' })
  layout!: TemplateLayout;

  /** 配色/圆角等 tokens（内置模板用；自定义 HTML 模板可留空） */
  @Column({ type: 'jsonb', default: {} })
  tokens!: Record<string, string | number>;

  /**
   * 自定义模板：<body> 内的 HTML 片段（只存 body 内容）
   * 为空则走内置渲染器（靠 tokens 生成）
   */
  @Column({ type: 'text', default: '' })
  bodyHtml!: string;

  /** 自定义模板的 CSS（后端会塞进 <head> 的 <style>） */
  @Column({ type: 'text', default: '' })
  cssText!: string;

  /** <head> 附加配置：title 模板、theme-color 等 */
  @Column({ type: 'jsonb', default: {} })
  headConfig!: {
    title?: string;
    themeColor?: string;
    extraMeta?: { name: string; content: string }[];
  };

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
