import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AppRuntimeConfig } from '../../config/configuration';

@Injectable()
export class AuthWriteGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'GET' || request.method === 'HEAD') return true;
    const origin = request.get('origin');
    const app = this.config.getOrThrow<AppRuntimeConfig>('app');
    const protocol = app.nodeEnv === 'production' ? 'https' : request.protocol;
    const sameOrigin = origin === `${protocol}://${request.get('host')}`;
    const trustedBody = request.is('application/json') || request.is('multipart/form-data');
    if (
      (request.method !== 'DELETE' && !trustedBody) ||
      (origin && !sameOrigin && !app.corsOrigins.includes(origin))
    ) {
      throw new ForbiddenException('请求来源不受信任。');
    }
    return true;
  }
}
