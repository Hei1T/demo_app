import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller.js';
import { CardsService } from './cards.service.js';
import { RenderModule } from '../render/render.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AnalyticsModule } from '../analytics/analytics.module.js';

@Module({
  imports: [DatabaseModule, RenderModule, AnalyticsModule],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
