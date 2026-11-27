import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import type { AdminRole, AdminStatus } from '../../../interface/auth';

@Entity('admin_users')
export class AdminUser {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column('varchar', { length: 30, unique: true })
  username!: string;

  @Column('varchar', { length: 255, select: false })
  passwordHash!: string;

  @Column('varchar', { length: 16 })
  role!: AdminRole;

  @Column('varchar', { length: 16, default: 'active' })
  status!: AdminStatus;

  @CreateDateColumn({ type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date;
}
