import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { UserInsightsService } from './user-insights.service.js';
import { ExportController } from './export.controller.js';
import { StatsService } from './stats.service.js';
import { CacheService } from '../common/cache.service.js';
import { AdminGuard } from '../common/guards/admin.guard.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController, ExportController],
  providers: [AdminService, UserInsightsService, StatsService, CacheService, AdminGuard],
})
export class AdminModule {}
