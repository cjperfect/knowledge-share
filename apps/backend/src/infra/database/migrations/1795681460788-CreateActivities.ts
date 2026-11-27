import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivities1795681460788 implements MigrationInterface {
  name = 'CreateActivities1795681460788';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`activities\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` varchar(80) NOT NULL, \`sharer\` varchar(50) NOT NULL, \`event_date\` date NOT NULL, \`summary\` varchar(500) NOT NULL, \`created_by\` char(36) NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), \`deleted_at\` datetime(3) NULL, INDEX \`idx_activities_deleted_date_id\` (\`deleted_at\`, \`event_date\`, \`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activities\` ADD CONSTRAINT \`fk_activities_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`admin_users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`activities\` DROP FOREIGN KEY \`fk_activities_created_by\``,
    );
    await queryRunner.query(`DROP INDEX \`idx_activities_deleted_date_id\` ON \`activities\``);
    await queryRunner.query(`DROP TABLE \`activities\``);
  }
}
