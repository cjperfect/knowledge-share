import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsAndContentPushes1795685358652 implements MigrationInterface {
  name = 'CreateProductsAndContentPushes1795685358652';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE \`products\` (
                \`id\` char(36) NOT NULL,
                \`name\` varchar(80) NOT NULL,
                \`thumbnail\` mediumtext NOT NULL,
                \`document\` json NOT NULL,
                \`theme\` varchar(16) NOT NULL,
                \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    await queryRunner.query(`
            CREATE TABLE \`content_pushes\` (
                \`id\` char(36) NOT NULL,
                \`title\` varchar(60) NOT NULL,
                \`summary\` varchar(200) NOT NULL,
                \`document\` json NOT NULL,
                \`tags\` json NOT NULL,
                \`prompt\` varchar(200) NOT NULL,
                \`ai_generated\` tinyint NOT NULL DEFAULT 0,
                \`status\` varchar(16) NOT NULL,
                \`scheduled_at\` datetime(3) NULL,
                \`sent_at\` datetime(3) NULL,
                \`activity_id\` bigint UNSIGNED NULL,
                \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                INDEX \`idx_pushes_status_schedule\` (\`status\`, \`scheduled_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    await queryRunner.query(`
            ALTER TABLE \`content_pushes\`
            ADD CONSTRAINT \`fk_pushes_activity_id\` FOREIGN KEY (\`activity_id\`) REFERENCES \`activities\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`content_pushes\` DROP FOREIGN KEY \`fk_pushes_activity_id\`
        `);
    await queryRunner.query(`
            DROP INDEX \`idx_pushes_status_schedule\` ON \`content_pushes\`
        `);
    await queryRunner.query(`
            DROP TABLE \`content_pushes\`
        `);
    await queryRunner.query(`
            DROP TABLE \`products\`
        `);
  }
}
