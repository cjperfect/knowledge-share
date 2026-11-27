import { MigrationInterface, QueryRunner } from 'typeorm';
import { blocksToMarkdown } from '../../../util/markdown';

type ProductRow = {
  id: string;
  document: unknown;
};

export class BackfillProductContentMarkdown1795690004000 implements MigrationInterface {
  name = 'BackfillProductContentMarkdown1795690004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('products', 'content_markdown'))) {
      return;
    }

    const rows = (await queryRunner.query(
      'SELECT `id`, `document` FROM `products` WHERE `content_markdown` IS NULL OR TRIM(`content_markdown`) = ""',
    )) as ProductRow[];

    for (const row of rows) {
      let document = row.document;
      if (typeof document === 'string') {
        try {
          document = JSON.parse(document);
        } catch {
          document = [];
        }
      }

      const markdown = blocksToMarkdown(
        Array.isArray(document) ? (document as Record<string, unknown>[]) : [],
      );
      if (!markdown) continue;

      await queryRunner.query('UPDATE `products` SET `content_markdown` = ? WHERE `id` = ?', [
        markdown,
        row.id,
      ]);
    }
  }

  public async down(): Promise<void> {
    // 回填的是派生缓存，不回滚，避免误删后续人工保存的 Markdown。
  }
}
