import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';

export type JwtPayload = {
  sub: string;
  role: 'user' | 'admin';
  tv: number;
  typ?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.typ === 'refresh') {
      throw new UnauthorizedException('请使用访问令牌');
    }
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('用户不存在');
    // 单设备登录：tokenVersion 不匹配说明在别处登录过，旧令牌立即失效
    if (user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException('账号已在其他设备登录');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };
  }
}
