import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPosterTemplateEnabledUnique1795690017000 implements MigrationInterface {
  name = 'AddPosterTemplateEnabledUnique1795690017000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('poster_templates', 'enabled_key')) return;

    // 迁移前保留最近更新的一张启用模板，其余全部停用。
    await queryRunner.query(`
      UPDATE poster_templates template
      JOIN (
        SELECT id
        FROM poster_templates
        WHERE enabled = TRUE
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      ) keep_template ON keep_template.id = template.id
      SET template.enabled = FALSE
      WHERE template.enabled = TRUE AND template.id <> keep_template.id
    `);

    await queryRunner.query(`
      ALTER TABLE poster_templates
      ADD COLUMN enabled_key TINYINT NULL DEFAULT NULL AFTER enabled,
      ADD UNIQUE INDEX uq_poster_templates_enabled_key (enabled_key)
    `);

    // 唯一索引允许多个 NULL，但只允许一行写入 1。
    await queryRunner.query(`
      UPDATE poster_templates
      SET enabled_key = 1
      WHERE enabled = TRUE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('poster_templates', 'enabled_key'))) return;
    await queryRunner.query(`
      ALTER TABLE poster_templates
      DROP INDEX uq_poster_templates_enabled_key,
      DROP COLUMN enabled_key
    `);
  }
}
