import { type CanActivate, type ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class LoginThrottle implements CanActivate {
  private attempts = new Map<string, number>();
  private resetAt = 0;

  canActivate(context: ExecutionContext) {
    const ip = context.switchToHttp().getRequest<Request>().ip ?? '';
    const now = Date.now();
    if (now >= this.resetAt) {
      this.attempts.clear();
      this.resetAt = now + 60_000;
    }
    const count = this.attempts.get(ip) ?? 0;
    if (count >= 20 || (count === 0 && this.attempts.size >= 10_000)) {
      throw new HttpException('尝试次数过多，请稍后再试。', 429);
    }
    this.attempts.set(ip, count + 1);
    return true;
  }
}
