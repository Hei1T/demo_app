import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../database/entities/user.entity.js';

const BCRYPT_ROUNDS = 12;
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

export type TokenPair = { accessToken: string; refreshToken: string };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  private normalizeEmail(email: string): string {
    return String(email ?? '').trim().toLowerCase();
  }

  private async signPair(user: User): Promise<TokenPair> {
    const base = { sub: user.id, role: user.role, tv: user.tokenVersion };
    const accessToken = await this.jwt.signAsync(base, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
      expiresIn: ACCESS_TTL,
    });
    const refreshToken = await this.jwt.signAsync(
      { ...base, typ: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
        expiresIn: REFRESH_TTL,
      },
    );
    return { accessToken, refreshToken };
  }

  async register(input: {
    email: string;
    password: string;
    name?: string;
  }): Promise<{ user: ReturnType<User['toPublic']> } & TokenPair> {
    const email = this.normalizeEmail(input.email);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new UnauthorizedException('邮箱格式不正确');
    }
    if (!input.password || input.password.length < 8) {
      throw new UnauthorizedException('密码至少 8 位');
    }

    const exists = await this.users.findOne({ where: { email } });
    if (exists) {
      // 不暴露"邮箱已注册"以外的东西；也不返回用户信息
      throw new ConflictException('该邮箱已注册');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = this.users.create({
      email,
      passwordHash,
      name: input.name?.trim() || null,
      role: 'user',
      plan: 'free',
      tokenVersion: 0,
    });
    await this.users.save(user);

    const tokens = await this.signPair(user);
    return { user: user.toPublic(), ...tokens };
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<{ user: ReturnType<User['toPublic']> } & TokenPair> {
    const email = this.normalizeEmail(input.email);
    // 必须显式带出 passwordHash（实体里 select:false）
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();

    // 统一错误信息，避免枚举邮箱
    const invalid = new UnauthorizedException('邮箱或密码错误');
    if (!user) {
      // 故意做一次等时哈希，抵抗时间差探测
      await bcrypt.compare(input.password ?? '', '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
      throw invalid;
    }
    const ok = await bcrypt.compare(input.password ?? '', user.passwordHash);
    if (!ok) throw invalid;

    // 单设备登录：每次登录递增 tokenVersion，之前所有设备立即失效
    await this.users.increment({ id: user.id }, 'tokenVersion', 1);
    const fresh = await this.users.findOne({ where: { id: user.id } });
    if (!fresh) throw invalid;
    user.tokenVersion = fresh.tokenVersion;

    user.lastLoginAt = new Date();
    await this.users.update(user.id, { lastLoginAt: user.lastLoginAt });

    const tokens = await this.signPair(user);
    return { user: user.toPublic(), ...tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; typ?: string; tv?: number };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    if (payload.typ !== 'refresh') throw new UnauthorizedException('无效的令牌');

    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || user.tokenVersion !== (payload.tv ?? 0)) {
      throw new UnauthorizedException('登录已失效，请重新登录');
    }
    return this.signPair(user);
  }

  /** 撤销所有 refresh token（改密码 / 退出所有设备） */
  async revokeAll(userId: string): Promise<void> {
    await this.users.increment({ id: userId }, 'tokenVersion', 1);
  }

  async me(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    return user.toPublic();
  }
}
