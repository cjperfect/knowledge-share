import type { ReactNode } from 'react'
import { cn } from '@/util/utils'

/** 后台页面统一标题行：左侧标题与内联操作，右侧主操作。 */
export function PageHeader({
  title,
  children,
  actions,
  className,
}: {
  title: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-4',
        className
      )}
    >
      <div className='flex min-w-0 flex-wrap items-center gap-3'>
        <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
        {children}
      </div>
      {actions}
    </div>
  )
}
