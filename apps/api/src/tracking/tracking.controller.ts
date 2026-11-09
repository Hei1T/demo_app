import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TrackingService, type CollectBody } from './tracking.service.js';
import { TRACK_SCRIPT } from './track-script.js';

@Controller()
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  /** 注入到名片页 head 的采集脚本 */
  @Get('t.js')
  script(@Res() res: Response) {
    res
      .setHeader('Content-Type', 'application/javascript; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=300')
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(TRACK_SCRIPT);
  }

  /** 批量接收前端事件（sendBeacon / fetch） */
  @Post('api/collect')
  collect(@Body() body: CollectBody, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      '';
    // 埋点必须立即返回，不阻塞用户
    void this.tracking.collect(body, ip);
    return { ok: true };
  }
}
