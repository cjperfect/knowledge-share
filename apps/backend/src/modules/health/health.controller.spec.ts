import type { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const createController = (query: () => Promise<unknown>) => {
    const dataSource = { query } as unknown as DataSource;
    return new HealthController(dataSource);
  };

  it('数据库可用时返回 code=200 与 status=ok', async () => {
    const controller = createController(async () => [{ ok: 1 }]);
    const result = await controller.check();

    expect(result.code).toBe(200);
    expect(result.data).toMatchObject({
      status: 'ok',
      database: { status: 'up' },
    });
  });

  it('数据库不可用时 data.status=degraded', async () => {
    const controller = createController(async () => {
      throw new Error('connection refused');
    });
    const result = await controller.check();

    expect(result.data).toMatchObject({
      status: 'degraded',
      database: { status: 'down' },
    });
  });

  it('存活探针不依赖数据库', () => {
    const controller = createController(async () => {
      throw new Error('should not be called');
    });

    expect(controller.live()).toMatchObject({
      code: 200,
      data: { status: 'ok' },
    });
  });
});
