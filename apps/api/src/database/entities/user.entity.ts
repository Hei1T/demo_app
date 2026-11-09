import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Card } from './card.entity.js';

export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'pro';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 190 })
  email!: string;

  /** bcrypt hash，绝不出现在任何返回里 */
  @Column({ type: 'varchar', length: 100, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'user' })
  role!: UserRole;

  @Column({ type: 'varchar', length: 16, default: 'free' })
  plan!: UserPlan;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  /** 递增即可让该用户所有 refresh token 失效 */
  @Column({ type: 'int', default: 0 })
  tokenVersion!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Card, (card: any) => card.user)
  cards!: any[];

  /** 对外安全的用户对象 */
  toPublic() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      plan: this.plan,
      createdAt: this.createdAt,
    };
  }
}
