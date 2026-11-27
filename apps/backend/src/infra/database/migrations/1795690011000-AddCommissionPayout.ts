import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionPayout1795690011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('commission_payouts');
    if (tableExists) return;
    await queryRunner.query(`
      CREATE TABLE commission_payouts (
        phone VARCHAR(16) NOT NULL,
        paid TINYINT(1) NOT NULL DEFAULT 0,
        paid_at DATETIME(3) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('commission_payouts', true);
  }
}
