import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Card } from './entities/card.entity.js';
import { Event } from './entities/event.entity.js';
import { TemplateEntity } from './entities/template.entity.js';

export const ENTITIES = [User, Card, Event, TemplateEntity];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PGHOST ?? '127.0.0.1',
      port: Number(process.env.PGPORT ?? 5432),
      username: process.env.PGUSER ?? 'postgres',
      password: process.env.PGPASSWORD ?? '',
      database: process.env.PGDATABASE ?? 'nfc_saas',
      entities: ENTITIES,
      // events 已按月分区，不能让 ORM 自动改结构 → 默认关闭，需要时 DB_SYNC=true
      synchronize: process.env.DB_SYNC === 'true',
      logging: false,
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
