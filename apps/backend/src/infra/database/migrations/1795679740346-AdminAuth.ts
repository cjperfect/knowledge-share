import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminAuth1795679740346 implements MigrationInterface {
  name = 'AdminAuth1795679740346';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`admin_users\` (\`id\` char(36) NOT NULL, \`username\` varchar(30) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`role\` varchar(16) NOT NULL, \`status\` varchar(16) NOT NULL DEFAULT 'active', \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE INDEX \`IDX_2873882c38e8c07d98cb64f962\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`admin_invitations\` (\`token_hash\` char(64) NOT NULL, \`expires_at\` int UNSIGNED NOT NULL, \`used_at\` int UNSIGNED NULL, PRIMARY KEY (\`token_hash\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`admin_invitations\``);
    await queryRunner.query(`DROP INDEX \`IDX_2873882c38e8c07d98cb64f962\` ON \`admin_users\``);
    await queryRunner.query(`DROP TABLE \`admin_users\``);
  }
}
