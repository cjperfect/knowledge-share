import type { Request } from 'express';

export function readBearerToken(request: Request): string | undefined {
  return request.get('authorization')?.match(/^Bearer +([A-Za-z0-9_.-]+)$/i)?.[1];
}
