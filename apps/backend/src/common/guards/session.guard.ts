import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { AdminRequest } from '../../interface/auth';
import { readBearerToken } from '../../util/auth';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    request.admin = await this.auth.currentUser(readBearerToken(request));
    return true;
  }
}
