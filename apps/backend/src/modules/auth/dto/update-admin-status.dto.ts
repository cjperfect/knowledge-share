import { IsIn } from 'class-validator';
import type { AdminStatus } from '../../../interface/auth';

export class UpdateAdminStatusDto {
  @IsIn(['active', 'disabled'])
  status!: AdminStatus;
}
