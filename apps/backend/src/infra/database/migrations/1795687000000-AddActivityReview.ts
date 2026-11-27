import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityReview1795687000000 implements MigrationInterface {
  name = 'AddActivityReview1795687000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `activities` ADD `review_source` longtext NULL, ADD `review_document` json NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `activities` DROP COLUMN `review_document`, DROP COLUMN `review_source`',
    );
  }
}
