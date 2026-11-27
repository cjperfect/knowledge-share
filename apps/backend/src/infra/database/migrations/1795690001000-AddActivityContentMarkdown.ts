import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityContentMarkdown1795690001000 implements MigrationInterface {
  name = 'AddActivityContentMarkdown1795690001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('activities', 'content_markdown'))) {
      await queryRunner.query('ALTER TABLE `activities` ADD `content_markdown` longtext NULL');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('activities', 'content_markdown')) {
      await queryRunner.query('ALTER TABLE `activities` DROP COLUMN `content_markdown`');
    }
  }
}
