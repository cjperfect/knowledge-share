import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionSetting1795690007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('commission_settings');
    if (!tableExists) {
      await queryRunner.query(`
        CREATE TABLE commission_settings (
          id TINYINT UNSIGNED NOT NULL,
          rate_bps INT UNSIGNED NOT NULL DEFAULT 0,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (id),
          CONSTRAINT chk_commission_settings_rate CHECK (rate_bps <= 10000)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
    }
    await queryRunner.query(`
      INSERT INTO commission_settings (id, rate_bps)
      VALUES (1, 0)
      ON DUPLICATE KEY UPDATE id = id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('commission_settings', true);
  }
}
