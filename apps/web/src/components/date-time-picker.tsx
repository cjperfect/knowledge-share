import { useState } from 'react'
import { format, isValid, parseISO, startOfToday } from 'date-fns'
import { cn } from '@/util/utils'
import { zhCN } from 'date-fns/locale'
import { CalendarDays, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0')
)
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0')
)

function nextQuarterHour() {
  const now = new Date()
  const addMinutes = 15 - (now.getMinutes() % 15)
  return new Date(now.getTime() + addMinutes * 60_000)
}

function parseValue(value: string) {
  if (!value) return undefined
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

export function DateTimePicker({
  id,
  value,
  onChange,
  ariaLabel = '选择时间',
  invalid = false,
  className,
}: {
  id?: string
  /** 值为 YYYY-MM-DDTHH:mm，空字符串表示立即发送 */
  value: string
  onChange: (value: string) => void
  ariaLabel?: string
  invalid?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [fallback] = useState(nextQuarterHour)
  const selected = parseValue(value)
  const base = selected ?? fallback
  const hour = format(base, 'HH')
  const minute = format(base, 'mm')

  function updateTime(nextHour: string, nextMinute: string) {
    onChange(`${format(base, 'yyyy-MM-dd')}T${nextHour}:${nextMinute}`)
  }

  function selectDate(day: Date | undefined) {
    if (!day) return
    if (value) {
      onChange(`${format(day, 'yyyy-MM-dd')}T${hour}:${minute}`)
      return
    }
    const candidate = new Date(
      `${format(day, 'yyyy-MM-dd')}T${hour}:${minute}:00`
    )
    const next = candidate.getTime() <= Date.now() ? fallback : candidate
    onChange(format(next, "yyyy-MM-dd'T'HH:mm"))
  }

  function clear() {
    onChange('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          aria-label={ariaLabel}
          aria-invalid={invalid}
          className={cn(
            'h-9 w-full justify-start overflow-hidden font-normal',
            !value && 'text-muted-foreground',
            invalid && 'border-destructive',
            className
          )}
        >
          <CalendarDays
            className='shrink-0 text-muted-foreground'
            aria-hidden
          />
          <span className='truncate'>
            {value
              ? format(parseValue(value) ?? fallback, 'yyyy-MM-dd HH:mm')
              : '立即发送（点击设置定时）'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        aria-label='选择发送时间'
        className='w-auto max-w-[calc(100vw-2rem)] gap-0 p-0'
      >
        <Calendar
          mode='single'
          locale={zhCN}
          defaultMonth={selected ?? new Date()}
          selected={selected}
          onSelect={selectDate}
          disabled={{ before: startOfToday() }}
          showOutsideDays={false}
          autoFocus
        />

        <div className='flex items-center justify-between gap-3 border-t px-3 py-2.5'>
          <span className='text-xs font-medium text-muted-foreground'>
            发送时刻
          </span>
          <div className='flex items-center gap-1.5'>
            <Select
              value={hour}
              onValueChange={(nextHour) => updateTime(nextHour, minute)}
            >
              <SelectTrigger className='h-8 w-[68px]' aria-label='小时'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item} 时
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className='text-sm text-muted-foreground'>:</span>
            <Select
              value={minute}
              onValueChange={(nextMinute) => updateTime(hour, nextMinute)}
            >
              <SelectTrigger className='h-8 w-[68px]' aria-label='分钟'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item} 分
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='flex items-center justify-between border-t px-3 py-2'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={clear}
            disabled={!value}
          >
            <X className='size-3.5' />
            清除时间
          </Button>
          <Button type='button' size='sm' onClick={() => setOpen(false)}>
            完成
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
