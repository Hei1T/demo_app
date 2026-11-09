import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Card } from './card.entity.js';

export type EventType =
  | 'view'
  | 'click_phone'
  | 'click_email'
  | 'click_map'
  | 'click_wechat'
  | 'click_social'
  | 'save_contact';

@Entity({ name: 'events' })
@Index(['cardId', 'createdAt'])
@Index(['cardId', 'type'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  cardId!: string;

  @ManyToOne(() => Card, (c) => c.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardId' })
  card!: any;

  @Column({ type: 'varchar', length: 32 })
  type!: EventType;

  /** 冗余的用户 ID：按用户查询走单列索引，避免 cardId IN (300 个) 的全表扫 */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  /** 独立访客指纹：sha256(ip + ua + 每日盐)，不可反推 */
  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  visitorHash!: string | null;

  @Column({ type: 'varchar', length: 400, nullable: true })
  ua!: string | null;

  @Column({ type: 'varchar', length: 400, nullable: true })
  referer!: string | null;

  /** 不存明文 IP，只存脱敏后的前两段 */
  @Column({ type: 'varchar', length: 64, nullable: true })
  ipMasked!: string | null;

  /** 溯源：城市 / 省份 / 国家（服务端由 IP 离线库解析） */
  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  region!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  country!: string | null;

  /** 停留时长（毫秒），dwell 事件才有 */
  @Column({ type: 'int', nullable: true })
  duration!: number | null;

  /** 滚动深度 0-100 */
  @Column({ type: 'int', nullable: true })
  scrollDepth!: number | null;

  /** 点击目标标签 / 文案 */
  @Column({ type: 'varchar', length: 64, nullable: true })
  targetTag!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  targetLabel!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  targetHref!: string | null;

  /** 全量原始信息（screen/lang/tz/path/坐标/origin…） */
  @Column({ type: 'jsonb', default: {} })
  extra!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
