import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { mkdirSync } from 'node:fs';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { AppRuntimeConfig } from './config/configuration';
import { uploadRoot } from './util/uploads';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser('json', { limit: '2mb' });
  const config = app.get(ConfigService);
  const appConfig = config.getOrThrow<AppRuntimeConfig>('app');
  const logger = new Logger('Bootstrap');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  mkdirSync(uploadRoot, { recursive: true });
  app.useStaticAssets(uploadRoot, {
    prefix: '/uploads/',
    maxAge: 31_536_000_000,
    immutable: true,
    index: false,
    redirect: false,
  });
  app.enableCors({
    origin: appConfig.corsOrigins.length > 0 ? appConfig.corsOrigins : true,
    credentials: true,
  });
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(appConfig.port, '0.0.0.0');
  logger.log(`服务已启动: http://localhost:${appConfig.port}`);
  logger.log(`局域网监听: 0.0.0.0:${appConfig.port}`);
}

/** 进程级兜底：避免异步错误静默丢失 */
function registerProcessErrorHandlers(): void {
  const logger = new Logger('Process');

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason instanceof Error ? reason.stack : String(reason));
  });

  process.on('uncaughtException', (error) => {
    logger.fatal(`Uncaught exception: ${error.message}`, error.stack);
    process.exit(1);
  });
}

registerProcessErrorHandlers();

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').fatal(
    error instanceof Error ? `启动失败: ${error.message}` : String(error),
  );
  process.exit(1);
});
