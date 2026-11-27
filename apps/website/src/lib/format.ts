const longDate = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

const todayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function validDate(value: string) {
  const date = new Date(`${value}T00:00:00+08:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function todayInShanghai() {
  return todayFormat.format(new Date())
}

export function formatDateLong(value: string) {
  const date = validDate(value)
  return date ? longDate.format(date) : value
}

export function dateParts(value: string) {
  const date = validDate(value)
  if (!date) return { day: value, month: '', year: '' }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  return {
    day: parts.find((part) => part.type === 'day')?.value ?? '',
    month: parts.find((part) => part.type === 'month')?.value ?? '',
    year: parts.find((part) => part.type === 'year')?.value ?? '',
  }
}

export function isToday(value: string) {
  return Boolean(value && value === todayInShanghai())
}

export function isUpcoming(value: string) {
  return Boolean(value && value > todayInShanghai())
}

export function daysUntil(value: string) {
  const target = validDate(value)
  if (!target) return 0
  const today = new Date(`${todayInShanghai()}T00:00:00+08:00`)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}
