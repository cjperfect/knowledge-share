import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from '../../auth/entities/admin-user.entity';

export type ActivityStatus = 'not_started' | 'ended' | 'pushed';

@Entity('activities')
@Index('idx_activities_deleted_date_id', ['deletedAt', 'eventDate', 'id'])
@Index('idx_activities_status_date_id', ['status', 'eventDate', 'id'])
export class Activity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id!: string;

  @Column('varchar', { length: 80 })
  name!: string;

  @Column('varchar', { length: 50 })
  sharer!: string;

  @Column('date')
  eventDate!: string;

  /** 未开始；管理员填写活动回顾后变为已结束；关联推送发送后变为已推送。 */
  @Column('varchar', { length: 16, default: 'not_started' })
  status!: ActivityStatus;

  @Column('varchar', { length: 500 })
  summary!: string;

  /** 活动价格，单位元；0 表示免费。 */
  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  price!: number;

  @Column('mediumtext', { nullable: true })
  thumbnail!: string | null;

  @Column('json', { nullable: true })
  content!: Record<string, unknown>[] | null;

  @Column('longtext', { nullable: true })
  contentMarkdown!: string | null;

  @Column('char', { length: 36 })
  createdBy!: string;

  @ManyToOne(() => AdminUser, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'fk_activities_created_by' })
  creator!: AdminUser;

  @CreateDateColumn({ type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 3 })
  deletedAt!: Date | null;
}
