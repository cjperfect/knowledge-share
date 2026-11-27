import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductContentMarkdown1795690003000 implements MigrationInterface {
  name = 'AddProductContentMarkdown1795690003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('products', 'content_markdown'))) {
      await queryRunner.query('ALTER TABLE `products` ADD `content_markdown` longtext NULL');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('products', 'content_markdown')) {
      await queryRunner.query('ALTER TABLE `products` DROP COLUMN `content_markdown`');
    }
  }
}
