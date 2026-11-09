import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** 明确告诉所有爬虫：全站禁止抓取 */
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  robots(): string {
    return [
      'User-agent: *',
      'Disallow: /',
      '',
      'User-agent: Baiduspider',
      'Disallow: /',
      '',
      'User-agent: Googlebot',
      'Disallow: /',
      '',
      'User-agent: bingbot',
      'Disallow: /',
      '',
      'User-agent: Sogou web spider',
      'Disallow: /',
      '',
      'User-agent: 360Spider',
      'Disallow: /',
      '',
      'User-agent: Bytespider',
      'Disallow: /',
      '',
    ].join('\n');
  }
}
