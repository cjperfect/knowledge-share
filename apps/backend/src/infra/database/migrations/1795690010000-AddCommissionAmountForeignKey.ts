import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionAmountForeignKey1795690010000 implements MigrationInterface {
  private async hasForeignKey(queryRunner: QueryRunner) {
    const rows = await queryRunner.query(
      "SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'commission_amounts' AND constraint_name = 'fk_commission_amounts_signup_id' LIMIT 1",
    );
    return Array.isArray(rows) && rows.length > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await this.hasForeignKey(queryRunner)) return;
    await queryRunner.query(`
      ALTER TABLE commission_amounts
      ADD CONSTRAINT fk_commission_amounts_signup_id
      FOREIGN KEY (signup_id) REFERENCES activity_signups (id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await this.hasForeignKey(queryRunner))) return;
    await queryRunner.query(
      'ALTER TABLE commission_amounts DROP FOREIGN KEY fk_commission_amounts_signup_id',
    );
  }
}
