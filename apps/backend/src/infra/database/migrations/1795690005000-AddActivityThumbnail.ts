import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityThumbnail1795690005000 implements MigrationInterface {
  name = 'AddActivityThumbnail1795690005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('activities', 'thumbnail'))) {
      await queryRunner.query('ALTER TABLE `activities` ADD `thumbnail` mediumtext NULL');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('activities', 'thumbnail')) {
      await queryRunner.query('ALTER TABLE `activities` DROP COLUMN `thumbnail`');
    }
  }
}
