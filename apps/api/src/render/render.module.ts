import { Module } from '@nestjs/common';
import { RenderService } from './render.service.js';
import { TemplatesModule } from '../templates/templates.module.js';

@Module({
  imports: [TemplatesModule],
  providers: [RenderService],
  exports: [RenderService],
})
export class RenderModule {}