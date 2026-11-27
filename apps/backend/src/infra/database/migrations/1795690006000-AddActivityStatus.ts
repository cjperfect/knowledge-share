import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityStatus1795690006000 implements MigrationInterface {
  name = 'AddActivityStatus1795690006000';

  private async hasStatusIndex(queryRunner: QueryRunner) {
    const rows = await queryRunner.query(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'activities' AND index_name = 'idx_activities_status_date_id' LIMIT 1",
    );
    return Array.isArray(rows) && rows.length > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('activities', 'status'))) {
      await queryRunner.query(
        "ALTER TABLE `activities` ADD `status` varchar(16) NOT NULL DEFAULT 'not_started' AFTER `event_date`",
      );
    }
    if (!(await this.hasStatusIndex(queryRunner))) {
      await queryRunner.query(
        'CREATE INDEX `idx_activities_status_date_id` ON `activities` (`status`, `event_date`, `id`)',
      );
    }

    // 已有回顾内容的活动视为已结束，其余保持未开始。
    await queryRunner.query(
      `UPDATE \`activities\`
       SET \`status\` = CASE
         WHEN \`content\` IS NOT NULL AND JSON_LENGTH(\`content\`) > 0 THEN 'ended'
         ELSE 'not_started'
       END`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await this.hasStatusIndex(queryRunner)) {
      await queryRunner.query('DROP INDEX `idx_activities_status_date_id` ON `activities`');
    }
    if (await queryRunner.hasColumn('activities', 'status')) {
      await queryRunner.query('ALTER TABLE `activities` DROP COLUMN `status`');
    }
  }
}
