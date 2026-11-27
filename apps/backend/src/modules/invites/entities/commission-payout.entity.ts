import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('commission_payouts')
export class CommissionPayout {
  @PrimaryColumn('varchar', { length: 16 })
  phone!: string;

  @Column('boolean', { default: false })
  paid!: boolean;

  @Column('datetime', { name: 'paid_at', precision: 3, nullable: true })
  paidAt!: Date | null;

  @Column({
    type: 'decimal',
    name: 'rate_bps',
    precision: 5,
    scale: 2,
    unsigned: true,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | number | null) => (value === null ? null : Number(value)),
    },
  })
  ratePercent!: number | null;

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
