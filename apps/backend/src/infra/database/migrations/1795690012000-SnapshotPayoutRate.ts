import { MigrationInterface, QueryRunner } from 'typeorm';

export class SnapshotPayoutRate1795690012000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('commission_payouts', 'rate_bps')) return;
    await queryRunner.query(`
      ALTER TABLE commission_payouts
      ADD COLUMN rate_bps INT NULL AFTER paid_at
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('commission_payouts', 'rate_bps'))) return;
    await queryRunner.query(`
      ALTER TABLE commission_payouts
      DROP COLUMN rate_bps
    `);
  }
}
