import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AdminRequest } from '../../interface/auth';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (request.admin?.role !== 'super_admin') {
      throw new ForbiddenException('此操作仅限超级管理员。');
    }
    return true;
  }
}
