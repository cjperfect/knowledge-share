import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export function ListSearchForm({
  label,
  children,
  onSearch,
  onReset,
}: {
  label: string
  children: ReactNode
  onSearch: (fields: FormData) => void
  onReset: () => void
}) {
  return (
    <form
      role='search'
      aria-label={label}
      className='flex flex-wrap items-end gap-3 bg-card'
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(new FormData(event.currentTarget))
      }}
      onReset={onReset}
    >
      {children}
      <div className='flex gap-2'>
        <Button type='submit'>搜索</Button>
        <Button type='reset' variant='outline'>
          重置
        </Button>
      </div>
    </form>
  )
}
