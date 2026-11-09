import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * 全站防索引 + 基础安全响应头。
 * 名片页包含个人联系方式，绝不能被搜索引擎抓取。
 */
@Injectable()
export class RobotsMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction) {
    // 所有响应都禁止索引/归档/快照
    res.setHeader(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate',
    );
    // 不被缓存为可公开索引的页面
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    // 允许同源 iframe（模板预览需要），禁止外部嵌入
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    next();
  }
}
