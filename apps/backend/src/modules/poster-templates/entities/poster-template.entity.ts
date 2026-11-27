import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('poster_templates')
@Index('idx_poster_templates_enabled', ['enabled'])
@Index('uq_poster_templates_enabled_key', ['enabledKey'], { unique: true })
export class PosterTemplate {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column('varchar', { length: 80 })
  name!: string;

  /** 1080×1440 的海报背景图，支持 public 路径、远程 URL 或用户上传后的 data URL。 */
  @Column('mediumtext')
  image!: string;

  @Column('boolean', { default: false })
  enabled!: boolean;

  /** 启用时写入 1，停用时写入 NULL；唯一索引保证最多只有一张启用模板。 */
  @Column({ name: 'enabled_key', type: 'tinyint', nullable: true })
  enabledKey!: number | null;

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
