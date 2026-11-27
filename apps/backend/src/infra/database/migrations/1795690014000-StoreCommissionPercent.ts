import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreCommissionPercent1795690014000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(
        'ALTER TABLE commission_settings DROP CHECK chk_commission_settings_rate',
      );
    } catch {
      // 约束不存在时忽略。
    }
    await queryRunner.query(`
      ALTER TABLE commission_settings
      MODIFY rate_bps DECIMAL(5,2) UNSIGNED NOT NULL DEFAULT 5.00
    `);
    await queryRunner.query(`
      UPDATE commission_settings
      SET rate_bps = ROUND(rate_bps / 100, 2)
      WHERE id = 1
    `);
    await queryRunner.query(`
      ALTER TABLE commission_settings
      ADD CONSTRAINT chk_commission_settings_rate CHECK (rate_bps <= 100)
    `);

    await queryRunner.query(`
      ALTER TABLE commission_payouts
      MODIFY rate_bps DECIMAL(5,2) UNSIGNED NULL
    `);
    await queryRunner.query(`
      UPDATE commission_payouts
      SET rate_bps = ROUND(rate_bps / 100, 2)
      WHERE rate_bps IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(
        'ALTER TABLE commission_settings DROP CHECK chk_commission_settings_rate',
      );
    } catch {
      // 约束不存在时忽略。
    }
    await queryRunner.query(`
      ALTER TABLE commission_settings
      MODIFY rate_bps INT UNSIGNED NOT NULL DEFAULT 500
    `);
    await queryRunner.query(`
      UPDATE commission_settings
      SET rate_bps = ROUND(rate_bps * 100)
      WHERE id = 1
    `);
    await queryRunner.query(`
      ALTER TABLE commission_settings
      ADD CONSTRAINT chk_commission_settings_rate CHECK (rate_bps <= 10000)
    `);
    await queryRunner.query(`
      ALTER TABLE commission_payouts
      MODIFY rate_bps INT UNSIGNED NULL
    `);
    await queryRunner.query(`
      UPDATE commission_payouts
      SET rate_bps = ROUND(rate_bps * 100)
      WHERE rate_bps IS NOT NULL
    `);
  }
}
