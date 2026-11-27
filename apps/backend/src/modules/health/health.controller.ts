import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { ApiResponse } from '../../interface/api-response';
import { Result } from '../../util/result';

interface HealthStatus {
  status: 'ok' | 'degraded';
  database: { status: 'up' | 'down'; latencyMs: number };
  uptimeSeconds: number;
  version: string;
  timestamp: string;
}

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async check(): Promise<ApiResponse<HealthStatus>> {
    const startedAt = Date.now();
    const databaseUp = await this.dataSource
      .query('SELECT 1')
      .then(() => true)
      .catch(() => false);

    return Result.ok({
      status: databaseUp ? 'ok' : 'degraded',
      database: {
        status: databaseUp ? 'up' : 'down',
        latencyMs: Date.now() - startedAt,
      },
      uptimeSeconds: Math.round(process.uptime()),
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
    });
  }

  @Get('live')
  live(): ApiResponse<{ status: 'ok'; timestamp: string }> {
    return Result.ok({ status: 'ok', timestamp: new Date().toISOString() });
  }
}
