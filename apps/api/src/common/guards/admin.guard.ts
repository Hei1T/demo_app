import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** 只放行 admin 角色；未登录由 JwtAuthGuard 先拦 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    if (!req.user) throw new ForbiddenException('未登录');
    if (req.user.role !== 'admin') throw new ForbiddenException('无权访问');
    return true;
  }
}
