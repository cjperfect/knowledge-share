import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityPrice1795690016000 implements MigrationInterface {
  name = 'AddActivityPrice1795690016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('activities', 'price')) return;
    await queryRunner.query(`
      ALTER TABLE activities
      ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER summary
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('activities', 'price'))) return;
    await queryRunner.query('ALTER TABLE activities DROP COLUMN price');
  }
}
