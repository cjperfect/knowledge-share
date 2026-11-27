import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('commission_settings')
export class CommissionSetting {
  @PrimaryColumn('tinyint', { unsigned: true })
  id!: number;

  @Column({
    type: 'decimal',
    name: 'rate_bps',
    precision: 5,
    scale: 2,
    unsigned: true,
    default: 5,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  ratePercent!: number;

  @CreateDateColumn({
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  updatedAt!: Date;
}
