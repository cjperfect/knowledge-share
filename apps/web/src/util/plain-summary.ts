/**
 * 摘要输入框只展示纯文本。去掉模型偶尔带出的 Markdown 标题、列表、
 * 强调、链接和代码标记，并把多余换行压成单个空格。
 */
export function plainSummaryText(value: string) {
  return value
    .replace(/```(?:markdown|md)?/gi, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*>\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^摘要[:：]\s*/, '')
    .trim()
}
