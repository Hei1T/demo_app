import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
};

/** 从 JWT 解析出的当前用户，永远不会来自请求参数 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return req.user as AuthUser;
  },
);
