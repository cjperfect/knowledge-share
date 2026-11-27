/**
 * 摘要接口只接受纯文本。逐块清理模型可能带出的常见 Markdown 标记，
 * 避免 `#`、`**`、列表符号等直接进入前端的单行摘要输入框。
 */
export function cleanSummaryDelta(value: string) {
  return value
    .replace(/```(?:markdown|md)?/gi, '')
    .replace(/^\s{0,3}(?:#{1,6}|>)\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`~]/g, '');
}
