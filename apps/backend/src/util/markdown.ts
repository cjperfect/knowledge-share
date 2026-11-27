type InlineNode = {
  type?: string;
  text?: string;
  href?: string;
  content?: unknown;
  styles?: Record<string, boolean>;
};

type ContentBlock = {
  type?: string;
  content?: unknown;
  children?: unknown;
  props?: Record<string, unknown>;
};

function asInlineNodes(value: unknown): InlineNode[] {
  if (!value) return [];
  if (typeof value === 'string') return [{ text: value }];
  if (Array.isArray(value)) {
    return value.flatMap((item) => asInlineNodes(item));
  }
  if (typeof value === 'object') return [value as InlineNode];
  return [];
}

function inlineText(value: unknown): string {
  return asInlineNodes(value)
    .map((node) => node.text ?? inlineText(node.content))
    .join('');
}

function inlineMarkdown(value: unknown): string {
  return asInlineNodes(value)
    .map((node) => {
      const body = node.content !== undefined ? inlineMarkdown(node.content) : (node.text ?? '');
      if (!body) return '';

      if (node.type === 'link' && node.href) {
        return `[${body}](${node.href})`;
      }

      let text = body;
      if (node.styles?.code) text = `\`${text}\``;
      if (node.styles?.bold) text = `**${text}**`;
      if (node.styles?.italic) text = `*${text}*`;
      if (node.styles?.strike) text = `~~${text}~~`;
      if (node.styles?.underline) text = `<u>${text}</u>`;
      return text;
    })
    .join('');
}

function childBlocks(value: unknown): ContentBlock[] {
  return Array.isArray(value) ? (value as ContentBlock[]) : [];
}

function indentBlock(value: string, depth: number) {
  const prefix = '  '.repeat(depth);
  return value
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function renderBlocks(blocks: ContentBlock[], depth: number): string[] {
  let numbered = 0;
  return blocks
    .map((block) => {
      if (block.type === 'numberedListItem') {
        numbered += 1;
      } else {
        numbered = 0;
      }
      return blockMarkdown(block, numbered, depth);
    })
    .filter((value) => value.trim().length > 0);
}

function blockMarkdown(block: ContentBlock, ordinal: number, depth: number): string {
  const type = block.type ?? 'paragraph';
  const props = block.props ?? {};
  const content = inlineMarkdown(block.content);
  const children = renderBlocks(childBlocks(block.children), depth + 1).join('\n\n');
  const nested = children ? `\n${children}` : '';

  switch (type) {
    case 'heading': {
      const level = Number(props.level ?? 1);
      const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6));
      return `${hashes} ${content}${nested}`.trim();
    }
    case 'bulletListItem':
      return `${'  '.repeat(depth)}- ${content}${nested}`.trimEnd();
    case 'numberedListItem':
      return `${'  '.repeat(depth)}${ordinal}. ${content}${nested}`.trimEnd();
    case 'quote':
      return `${'  '.repeat(depth)}> ${content}${nested}`.trimEnd();
    case 'divider':
      return `${'  '.repeat(depth)}---`;
    case 'codeBlock': {
      const language = typeof props.language === 'string' ? props.language : '';
      return `${'  '.repeat(depth)}\`\`\`${language}\n${inlineText(block.content)}\n${'  '.repeat(depth)}\`\`\``;
    }
    case 'image': {
      const url = typeof props.url === 'string' ? props.url : '';
      if (!url) return children;
      const alt = typeof props.caption === 'string' ? props.caption : '';
      return `${'  '.repeat(depth)}![${alt}](${url})${nested}`;
    }
    default:
      return content ? `${indentBlock(content, depth)}${nested}` : children;
  }
}

export function blocksToMarkdown(blocks: Record<string, unknown>[]): string {
  return renderBlocks(blocks as ContentBlock[], 0)
    .join('\n\n')
    .trim();
}
