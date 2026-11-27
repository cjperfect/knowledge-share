import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionAmount1795690009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('commission_amounts');
    if (tableExists) return;
    await queryRunner.query(`
      CREATE TABLE commission_amounts (
        signup_id CHAR(36) NOT NULL,
        base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (signup_id),
        CONSTRAINT fk_commission_amounts_signup_id
          FOREIGN KEY (signup_id) REFERENCES activity_signups (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('commission_amounts', true);
  }
}
