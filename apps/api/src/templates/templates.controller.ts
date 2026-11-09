import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { TemplatesService } from './templates.service.js';

type TokensInput = Record<string, string | number>;

@Controller('admin/templates')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class TemplatesAdminController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  async list() {
    return { templates: await this.templates.list() };
  }

  /** 新建模板（支持自定义 HTML：bodyHtml + cssText） */
  @Post()
  async create(
    @Body()
    body: {
      slug: string;
      name: string;
      tier?: 'free' | 'pro';
      layout?: 'classic';
      tokens?: TokensInput;
      sortOrder?: number;
      bodyHtml?: string;
      cssText?: string;
      headConfig?: { title?: string; themeColor?: string };
    },
  ) {
    const isCustom = !!(body.bodyHtml && body.bodyHtml.trim());
    return this.templates.create({
      slug: body.slug,
      name: body.name,
      tier: body.tier,
      layout: body.layout,
      tokens: body.tokens ?? (isCustom ? { custom: 1 } : {}),
      sortOrder: body.sortOrder,
      bodyHtml: body.bodyHtml,
      cssText: body.cssText,
      headConfig: body.headConfig,
    });
  }

  /** 自定义 HTML 预览（不保存，用示例资料渲染） */
  @Post('preview')
  preview(
    @Body() body: { slug?: string; bodyHtml: string; cssText?: string; title?: string; themeColor?: string },
  ) {
    return this.templates.previewCustom(body);
  }

  /** 复制模板 */
  @Post(':slug/duplicate')
  async duplicate(@Param('slug') slug: string, @Body() body: { slug?: string; name?: string }) {
    return this.templates.duplicate(slug, body?.slug, body?.name);
  }

  @Patch(':slug')
  async update(
    @Param('slug') slug: string,
    @Body()
    body: {
      name?: string;
      tier?: 'free' | 'pro';
      enabled?: boolean;
      tokens?: TokensInput;
      sortOrder?: number;
    },
  ) {
    return this.templates.update(slug, body ?? {});
  }

  /** 删除模板（有使用量时拒绝） */
  @Delete(':slug')
  async remove(@Param('slug') slug: string) {
    return this.templates.remove(slug);
  }
}
