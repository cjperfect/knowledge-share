import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('activity_signups')
@Index('uq_activity_signups_activity_phone', ['activityId', 'phone'], { unique: true })
@Index('idx_activity_signups_activity_inviter', ['activityId', 'inviterId'])
@Index('idx_activity_signups_inviter_id', ['inviterId'])
export class ActivitySignup {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column('bigint', { unsigned: true })
  activityId!: string;

  @ManyToOne(() => Activity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'activity_id', foreignKeyConstraintName: 'fk_activity_signups_activity_id' })
  activity!: Activity;

  @Column('varchar', { length: 50 })
  name!: string;

  @Column('varchar', { length: 16 })
  phone!: string;

  @Column('char', { length: 36, nullable: true })
  inviterId!: string | null;

  @ManyToOne(() => ActivitySignup, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inviter_id', foreignKeyConstraintName: 'fk_activity_signups_inviter_id' })
  inviter!: ActivitySignup | null;

  @CreateDateColumn({ type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date;
}
