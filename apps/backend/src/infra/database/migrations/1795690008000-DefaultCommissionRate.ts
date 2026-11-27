import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultCommissionRate1795690008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE commission_settings MODIFY rate_bps INT UNSIGNED NOT NULL DEFAULT 500',
    );
    await queryRunner.query('UPDATE commission_settings SET rate_bps = 500 WHERE id = 1');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE commission_settings MODIFY rate_bps INT UNSIGNED NOT NULL DEFAULT 0',
    );
    await queryRunner.query('UPDATE commission_settings SET rate_bps = 0 WHERE id = 1');
  }
}
