import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CardsModule } from './cards/cards.module.js';
import { AdminModule } from './admin/admin.module.js';
import { TemplatesModule } from './templates/templates.module.js';
import { TrackingModule } from './tracking/tracking.module.js';
import { CacheService } from './common/cache.service.js';
import { RobotsMiddleware } from './common/middleware/robots.middleware.js';

@Module({
  imports: [DatabaseModule, AuthModule, CardsModule, AdminModule, TemplatesModule, TrackingModule],
  controllers: [AppController],
  providers: [CacheService, AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 全站生效：所有响应加 noindex 头
    consumer.apply(RobotsMiddleware).forRoutes('*');
  }
}
