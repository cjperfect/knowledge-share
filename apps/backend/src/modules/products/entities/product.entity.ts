import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export const productThemes = ['navy', 'blue', 'amber', 'sage'] as const;

@Entity('products')
export class Product {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column('varchar', { length: 80 })
  name!: string;

  @Column('mediumtext')
  thumbnail!: string;

  @Column('json')
  document!: Record<string, unknown>[];

  @Column('longtext', { nullable: true })
  contentMarkdown!: string | null;

  @Column('varchar', { length: 16 })
  theme!: (typeof productThemes)[number];

  @UpdateDateColumn({
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  updatedAt!: Date;
}
