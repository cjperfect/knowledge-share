import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('admin_invitations')
export class AdminInvitation {
  @PrimaryColumn('char', { length: 64 })
  tokenHash!: string;

  @Column('int', { unsigned: true })
  expiresAt!: number;

  @Column('int', { unsigned: true, nullable: true })
  usedAt!: number | null;
}
