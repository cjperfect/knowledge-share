import { describe, expect, it } from 'vitest';
import { blocksToMarkdown } from './markdown';

describe('blocksToMarkdown', () => {
  it('serializes headings, paragraphs and inline styles', () => {
    expect(
      blocksToMarkdown([
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '普通文本，', styles: {} },
            { type: 'text', text: '加粗', styles: { bold: true } },
          ],
        },
        { type: 'heading', props: { level: 2 }, content: '小标题' },
      ]),
    ).toBe('普通文本，**加粗**\n\n## 小标题');
  });

  it('numbers ordered list items from one within each list', () => {
    expect(
      blocksToMarkdown([
        { type: 'paragraph', content: '引言' },
        { type: 'numberedListItem', content: '第一点' },
        { type: 'numberedListItem', content: '第二点' },
        { type: 'numberedListItem', content: '第三点' },
      ]),
    ).toBe('引言\n\n1. 第一点\n\n2. 第二点\n\n3. 第三点');
  });

  it('supports bullets, quotes and dividers', () => {
    expect(
      blocksToMarkdown([
        { type: 'bulletListItem', content: '要点' },
        { type: 'quote', content: '引用' },
        { type: 'divider' },
      ]),
    ).toBe('- 要点\n\n> 引用\n\n---');
  });
});
