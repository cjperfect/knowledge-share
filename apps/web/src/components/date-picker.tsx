import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function DatePicker({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          data-empty={!value}
          className='w-full justify-start font-normal data-[empty=true]:text-muted-foreground'
        >
          <CalendarDays className='text-muted-foreground' aria-hidden='true' />
          {value || '请选择日期'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        aria-label='选择活动日期'
        className='w-auto p-0'
      >
        <Calendar
          mode='single'
          locale={zhCN}
          defaultMonth={selected}
          selected={selected}
          onSelect={(day) => {
            if (!day) return
            onChange(format(day, 'yyyy-MM-dd'))
            setOpen(false)
          }}
          showOutsideDays={false}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
