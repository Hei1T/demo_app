import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service.js';
import { UserInsightsService } from './user-insights.service.js';
import { StatsService } from './stats.service.js';
import { AdminGuard } from '../common/guards/admin.guard.js';

/**
 * 后台接口：全部实时查询，不做缓存。
 * 性能靠 索引 + 并行查询 + 聚合表 + 分表，不靠缓存。
 */
@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly insights: UserInsightsService,
    private readonly stats: StatsService,
  ) {}

  /** 全站总览 */
  @Get('stats')
  overview(@Query('days') days?: string) {
    return this.admin.overview(Number(days ?? 30));
  }

  /** 失效短链监控 */
  @Get('links/invalid')
  invalidLinks(@Query('limit') limit?: string) {
    return this.stats.invalidLinks(Number(limit ?? 100));
  }

  /** 聚合表状态 */
  @Get('stats/status')
  statsStatus() {
    return this.stats.status();
  }

  /** 手动触发聚合（可定时调用） */
  @Post('stats/materialize')
  materialize(@Query('days') days?: string) {
    return this.stats.materialize(Number(days ?? 60));
  }

  /** 漏斗 / 留存 / 环比 / 来源 */
  @Get('funnel')
  funnel(@Query('days') days?: string) {
    return this.insights.funnel(Number(days ?? 30));
  }

  /** 数据分析（模板表现 / Top 名片 / 事件分布 / 时段热力） */
  @Get('analytics')
  analytics(@Query('days') days?: string) {
    return this.admin.analytics(Number(days ?? 30));
  }

  /** 用户列表（支持 q 搜索） */
  @Get('users')
  users(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('q') q?: string,
  ) {
    return this.admin.listUsers(Number(page ?? 1), Number(size ?? 20), q ?? '');
  }

  /** 用户详情页：概览 + 图表 */
  @Get('users/:id/overview')
  userOverview(@Param('id') id: string, @Query('days') days?: string) {
    return this.insights.overviewFast(id, Number(days ?? 30));
  }

  /** 用户详情页：名片分页表 */
  @Get('users/:id/cards')
  userCards(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ) {
    return this.insights.cardsPage(id, Number(page ?? 1), Number(size ?? 20), q ?? '', sort ?? 'views');
  }

  /** 用户详情（简版） */
  @Get('users/:id')
  userDetail(@Param('id') id: string) {
    return this.admin.userDetail(id);
  }

  /** 名片列表（支持 q 搜索 + template 筛选） */
  @Get('cards')
  cards(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('q') q?: string,
    @Query('template') template?: string,
  ) {
    return this.admin.cardsList(
      Number(page ?? 1),
      Number(size ?? 20),
      q ?? '',
      template ?? '',
    );
  }

  /** 名片详情（完整：资料 + 流量 + 趋势 + 城市 + 最近访问） */
  @Get('cards/:code/detail')
  cardDetailFull(@Param('code') code: string, @Query('days') days?: string) {
    return this.insights.cardDetailFull(code, Number(days ?? 30));
  }

  /** 名片详情（简版） */
  @Get('cards/:code')
  cardDetail(@Param('code') code: string) {
    return this.admin.cardDetail(code);
  }
}
