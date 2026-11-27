import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPosterTemplates1795690015000 implements MigrationInterface {
  name = 'AddPosterTemplates1795690015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('poster_templates')) return;
    await queryRunner.query(`
      CREATE TABLE poster_templates (
        id CHAR(36) NOT NULL,
        name VARCHAR(80) NOT NULL,
        image MEDIUMTEXT NOT NULL,
        theme VARCHAR(8) NOT NULL DEFAULT 'dark',
        show_panel BOOLEAN NOT NULL DEFAULT TRUE,
        enabled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_poster_templates_enabled (enabled)
      ) ENGINE = InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('poster_templates', true);
  }
}
