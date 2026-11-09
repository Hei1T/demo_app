import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity.js';
import { Event } from './event.entity.js';

export type SocialLink = {
  platform: string;
  value: string;
  label?: string;
};

export type CardProfile = {
  name: string;
  role?: string;
  org?: string;
  bio?: string;
  phone?: string;
  email?: string;
  addr?: string;
  website?: string;
  wechat?: string;
  wechatQr?: string;
  avatar?: string;
  languages?: string[];
  links?: SocialLink[];
  linksLegacy?: { label: string; url: string }[];
};

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 对外短码：10 位 base32，不可猜测、不可枚举 */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 24 })
  code!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (u: any) => u.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: any;

  @Column({ type: 'jsonb' })
  profile!: CardProfile;

  @Column({ type: 'varchar', length: 40, default: 'noir' })
  templateSlug!: string;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @OneToMany(() => Event, (e: any) => e.card)
  events!: any[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  /** 作废时间：作废后短链返回 410，只有所有者能作废/恢复 */
  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
