import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillPayoutRate1795690013000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE commission_payouts payout
      INNER JOIN commission_settings setting ON setting.id = 1
      SET payout.rate_bps = setting.rate_bps
      WHERE payout.paid = 1 AND payout.rate_bps IS NULL
    `);
  }

  public async down(): Promise<void> {
    // 历史发放快照不可安全回滚，保留已有比例。
  }
}
