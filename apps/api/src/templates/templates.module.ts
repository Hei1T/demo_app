import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { TemplatesService } from './templates.service.js';
import { TemplatesAdminController } from './templates.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [TemplatesAdminController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
