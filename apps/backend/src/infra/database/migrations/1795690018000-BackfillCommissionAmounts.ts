import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillCommissionAmounts1795690018000 implements MigrationInterface {
  name = 'BackfillCommissionAmounts1795690018000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('commission_amounts'))) return;
    // 只补齐尚未设置金额的一级邀请，已人工调整过的金额保持不变。
    await queryRunner.query(`
      INSERT INTO commission_amounts (signup_id, base_amount)
      SELECT child.id, activity.price
      FROM activity_signups child
      INNER JOIN activities activity ON activity.id = child.activity_id
      LEFT JOIN commission_amounts amount ON amount.signup_id = child.id
      WHERE child.inviter_id IS NOT NULL AND amount.signup_id IS NULL
    `);
  }

  public async down(): Promise<void> {
    // 回填数据无法区分原有记录，不做删除。
  }
}
