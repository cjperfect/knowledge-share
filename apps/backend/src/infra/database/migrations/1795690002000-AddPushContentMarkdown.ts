import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPushContentMarkdown1795690002000 implements MigrationInterface {
  name = 'AddPushContentMarkdown1795690002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('content_pushes', 'content_markdown'))) {
      await queryRunner.query('ALTER TABLE `content_pushes` ADD `content_markdown` longtext NULL');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('content_pushes', 'content_markdown')) {
      await queryRunner.query('ALTER TABLE `content_pushes` DROP COLUMN `content_markdown`');
    }
  }
}
