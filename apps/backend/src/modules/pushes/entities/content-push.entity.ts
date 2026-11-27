import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Activity } from '../../activities/entities/activity.entity';

export const pushStatuses = ['draft', 'scheduled', 'sent', 'failed'] as const;
export type PushStatus = (typeof pushStatuses)[number];

@Entity('content_pushes')
@Index('idx_pushes_status_schedule', ['status', 'scheduledAt'])
export class ContentPush {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column('varchar', { length: 60 })
  title!: string;

  @Column('varchar', { length: 200 })
  summary!: string;

  @Column('json')
  document!: Record<string, unknown>[];

  @Column('longtext', { nullable: true })
  contentMarkdown!: string | null;

  @Column('json')
  tags!: string[];

  @Column('varchar', { length: 200 })
  prompt!: string;

  @Column('varchar', { length: 16 })
  status!: PushStatus;

  @Column('datetime', { precision: 3, nullable: true })
  scheduledAt!: Date | null;

  @Column('datetime', { precision: 3, nullable: true })
  sentAt!: Date | null;

  @Column('bigint', { unsigned: true, nullable: true })
  activityId!: string | null;

  @ManyToOne(() => Activity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'activity_id', foreignKeyConstraintName: 'fk_pushes_activity_id' })
  activity?: Activity | null;

  @CreateDateColumn({ type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date;
}
