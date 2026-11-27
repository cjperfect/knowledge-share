import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/util/utils'
import { zhCN } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DateRangeValue = { start: string; end: string }

export function DateRangePicker({
  id,
  label,
  value,
  onChange,
  errorId,
  className,
}: {
  id: string
  label: string
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  errorId?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const from = value.start ? parseISO(value.start) : undefined
  const selected = from
    ? { from, to: value.end ? parseISO(value.end) : undefined }
    : undefined

  function selectDate(next: DateRange | undefined, day: Date) {
    if (value.start && !value.end && next?.from && next.to) {
      onChange({
        start: format(next.from, 'yyyy-MM-dd'),
        end: format(next.to, 'yyyy-MM-dd'),
      })
      setOpen(false)
      return
    }
    onChange({ start: format(day, 'yyyy-MM-dd'), end: '' })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          className={cn('justify-start font-normal', className)}
          aria-invalid={Boolean(errorId)}
          aria-describedby={errorId}
        >
          <CalendarDays className='text-muted-foreground' aria-hidden='true' />
          {value.start
            ? `${value.start} 至 ${value.end || '请选择结束日期'}`
            : '请选择日期范围'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        aria-label={label}
        className='w-auto max-w-[calc(100vw-2rem)] p-0'
      >
        <Calendar
          mode='range'
          locale={zhCN}
          defaultMonth={from}
          selected={selected}
          onSelect={selectDate}
          numberOfMonths={isMobile ? 1 : 2}
          showOutsideDays={false}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
