import type { PartialBlock } from '@blocknote/core'
import type { ArticleEditorInstance } from '@/components/article-editor'

export function blockText(block: PartialBlock) {
  const content = (block as { content?: unknown }).content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((item) => {
      if (!item || typeof item !== 'object' || !('text' in item)) return ''
      return String((item as { text?: string }).text ?? '')
    })
    .join('')
}

export function documentText(blocks: PartialBlock[]) {
  return blocks.map(blockText).filter(Boolean).join('\n')
}

export function documentHasContent(blocks: PartialBlock[]) {
  return documentText(blocks).replace(/\s/g, '').length > 0
}

/**
 * 把模型返回的 Markdown 解析成 BlockNote 块。去掉模型偶尔包上的
 * Markdown 代码围栏；半截 Markdown 解析失败时返回空数组，调用方保留原文。
 */
export function markdownToEditorBlocks(
  editor: ArticleEditorInstance,
  markdown: string
): PartialBlock[] {
  const source = markdown
    .trim()
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/\s*```$/, '')
  if (!source) return []
  try {
    return editor.tryParseMarkdownToBlocks(source)
  } catch {
    return []
  }
}
