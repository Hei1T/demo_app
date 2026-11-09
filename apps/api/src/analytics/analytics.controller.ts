import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';

@Controller('api/stats')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** 我的页三个数字：卡片数 / 累计打开 / 使用天数 */
  @Get('summary')
  async summary(@CurrentUser() user: AuthUser) {
    return this.analytics.userSummary(user.id);
  }

  /** 我的总览：只看自己名下的卡 */
  @Get('me')
  async me(@CurrentUser() user: AuthUser, @Query('days') days?: string) {
    const d = Math.min(Math.max(Number(days ?? 30) || 30, 1), 365);
    return this.analytics.userOverview(user.id, d);
  }

  /** 我的洞察：城市/设备/时段/来源/停留时长，全是自己的数据 */
  @Get('insights')
  async insights(@CurrentUser() user: AuthUser, @Query('days') days?: string) {
    const d = Math.min(Math.max(Number(days ?? 30) || 30, 1), 365);
    return this.analytics.userInsights(user.id, d);
  }

  /** 我名下每张卡的独立数据（分页 + 搜索） */
  @Get('cards')
  async cards(
    @CurrentUser() user: AuthUser,
    @Query('days') days?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('q') q?: string,
  ) {
    const d = Math.min(Math.max(Number(days ?? 30) || 30, 1), 365);
    return this.analytics.userCardsStats(
      user.id,
      d,
      Number(page ?? 1) || 1,
      Number(size ?? 20) || 20,
      q ?? '',
    );
  }

  /** 单张卡的明细（先校验归属） */
  @Get('cards/:code')
  async card(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Query('days') days?: string,
  ) {
    const d = Math.min(Math.max(Number(days ?? 30) || 30, 1), 365);
    const card = await this.analytics.getOwnedCard(user.id, code);
    const stats = await this.analytics.cardStats(card.id, d);
    return {
      code: card.code,
      name: card.profile.name,
      templateSlug: card.templateSlug,
      ...stats,
    };
  }
}
