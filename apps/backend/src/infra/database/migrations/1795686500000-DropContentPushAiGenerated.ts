import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropContentPushAiGenerated1795686500000 implements MigrationInterface {
  name = 'DropContentPushAiGenerated1795686500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('content_pushes', 'ai_generated')) {
      await queryRunner.query('ALTER TABLE `content_pushes` DROP COLUMN `ai_generated`');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('content_pushes', 'ai_generated'))) {
      await queryRunner.query(
        'ALTER TABLE `content_pushes` ADD COLUMN `ai_generated` tinyint NOT NULL DEFAULT 0 AFTER `prompt`',
      );
    }
  }
}
