import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'node:path';
import type { AppRuntimeConfig, DatabaseConfig } from '../../config/configuration';
import { SnakeNamingStrategy } from './snake-naming.strategy';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const database = config.getOrThrow<DatabaseConfig>('database');
        const app = config.getOrThrow<AppRuntimeConfig>('app');

        return {
          type: 'mysql',
          timezone: '+08:00',
          url: database.url,
          ssl: database.ssl ? { rejectUnauthorized: false } : false,
          // 各业务模块通过 TypeOrmModule.forFeature() 注册实体，此处无需手工列举
          autoLoadEntities: true,
          synchronize: database.synchronize && app.nodeEnv !== 'production',
          logging: database.logging ? ['query', 'error', 'schema'] : ['error'],
          namingStrategy: new SnakeNamingStrategy(),
          migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
          migrationsRun: false,
          extra: {
            max: 20,
            charset: 'utf8mb4',
            // 服务端时区由 docker-compose 的 --default-time-zone=+08:00 固定
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
