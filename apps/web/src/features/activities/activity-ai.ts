export function activitySummaryLength(summary: string) {
  return Array.from(summary.trim()).length
}

/** 把语音识别结果追加到已有素材；中文之间用逗号衔接，保留用户已有标点。 */
export function appendSpeechText(current: string, addition: string) {
  const next = addition.trim()
  if (!next) return current
  const base = current.trimEnd()
  if (!base) return next
  const separator = /[，。！？；：、,.!?;:\u2026]$/.test(base) ? '' : '，'
  return `${base}${separator}${next}`
}
