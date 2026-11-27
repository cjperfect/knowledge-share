import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActivityReviewToContent1795690000000 implements MigrationInterface {
  name = 'ActivityReviewToContent1795690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('activities', 'content'))) {
      await queryRunner.query('ALTER TABLE `activities` ADD `content` json NULL');
    }

    if (await queryRunner.hasColumn('activities', 'review_document')) {
      await queryRunner.query(
        'UPDATE `activities` SET `content` = `review_document` WHERE `review_document` IS NOT NULL',
      );
    }

    if (await queryRunner.hasColumn('activities', 'review_source')) {
      await queryRunner.query(
        "UPDATE `activities` SET `content` = JSON_ARRAY(JSON_OBJECT('type', 'paragraph', 'content', `review_source`)) WHERE (`content` IS NULL OR JSON_LENGTH(`content`) = 0) AND `review_source` IS NOT NULL AND TRIM(`review_source`) <> ''",
      );
      await queryRunner.query('ALTER TABLE `activities` DROP COLUMN `review_source`');
    }

    if (await queryRunner.hasColumn('activities', 'review_document')) {
      await queryRunner.query('ALTER TABLE `activities` DROP COLUMN `review_document`');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('activities', 'review_source'))) {
      await queryRunner.query('ALTER TABLE `activities` ADD `review_source` longtext NULL');
    }
    if (!(await queryRunner.hasColumn('activities', 'review_document'))) {
      await queryRunner.query('ALTER TABLE `activities` ADD `review_document` json NULL');
    }
    if (await queryRunner.hasColumn('activities', 'content')) {
      await queryRunner.query(
        'UPDATE `activities` SET `review_document` = `content` WHERE `content` IS NOT NULL',
      );
      await queryRunner.query('ALTER TABLE `activities` DROP COLUMN `content`');
    }
  }
}
