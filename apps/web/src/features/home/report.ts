import type { ActivityTrendRow, DateRange } from '@/interface/home'

const locale = 'zh-CN'
export const number = new Intl.NumberFormat(locale)
const shanghaiDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  dateStyle: 'short',
})

export function addDays(day: string, days: number) {
  const date = new Date(day + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function weekRange(day: string, offset = 0): DateRange {
  const weekday = new Date(day + 'T00:00:00Z').getUTCDay()
  const start = addDays(day, -((weekday + 6) % 7) + offset * 7)
  return { start, end: addDays(start, 6) }
}

export function todayInShanghai() {
  return shanghaiDate.format(new Date())
}

export const defaultActivitySharer = '林晓'

export function trendRows(
  rows: ActivityTrendRow[],
  range: DateRange,
  today: string
) {
  const dayCount =
    (Date.parse(range.end) - Date.parse(range.start)) / 86_400_000 + 1
  if (!rows.length || dayCount > 60) return rows

  const byDate = new Map(rows.map((row) => [row.date, row.signups]))
  return Array.from({ length: dayCount }, (_, index) =>
    addDays(range.start, index)
  )
    .filter((date) => date <= today)
    .map((date) => ({ date, signups: byDate.get(date) ?? 0 }))
}
