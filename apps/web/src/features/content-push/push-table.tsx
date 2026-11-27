import { useState } from 'react'
import type { PushRecord, PushStatus } from '@/interface/push'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusMeta: Record<PushStatus, { label: string; className: string }> = {
  sent: {
    label: '已发送',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  scheduled: {
    label: '定时发送',
    className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  },
  failed: {
    label: '发送失败',
    className: 'bg-destructive/10 text-destructive',
  },
  draft: {
    label: '草稿',
    className: 'bg-muted text-muted-foreground',
  },
}

export function StatusBadge({ status }: { status: PushStatus }) {
  const meta = statusMeta[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
    >
      <span className='size-1.5 rounded-full bg-current' />
      {meta.label}
    </span>
  )
}

function formatSendTime(row: PushRecord) {
  return `${row.date.slice(5).replace('-', '/')} ${row.time}`
}

function TableAction({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      className='text-xs font-normal text-muted-foreground transition-colors hover:text-foreground'
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function DeletePushButton({
  row,
  onDelete,
}: {
  row: PushRecord
  onDelete: (row: PushRecord) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='text-xs font-normal text-destructive transition-colors hover:text-destructive/80'
        >
          删除
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        aria-label='删除推送确认'
        onInteractOutside={(event) => event.preventDefault()}
        className='w-72 space-y-3'
      >
        <div className='space-y-1.5'>
          <p className='font-medium'>删除推送？</p>
          <p className='text-sm wrap-break-word text-muted-foreground'>
            「{row.title}」将从推送列表移除，删除后无法恢复。
          </p>
        </div>
        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            type='button'
            size='sm'
            variant='destructive'
            onClick={() => {
              setOpen(false)
              onDelete(row)
            }}
          >
            确认删除
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function PushActions({
  row,
  onEdit,
  onRetry,
  onDelete,
}: {
  row: PushRecord
  onEdit: (row: PushRecord) => void
  onRetry: (row: PushRecord) => void
  onDelete: (row: PushRecord) => void
}) {
  return (
    <div className='flex flex-wrap items-center justify-end gap-x-3 gap-y-1'>
      <TableAction
        label={row.status === 'sent' ? '查看详情' : '编辑正文'}
        onClick={() => onEdit(row)}
      />
      {row.status === 'failed' && (
        <TableAction label='重新发送' onClick={() => onRetry(row)} />
      )}
      <DeletePushButton row={row} onDelete={onDelete} />
    </div>
  )
}

function EmptyPushState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className='flex min-h-56 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-muted-foreground'>
      <span className='grid size-12 place-items-center rounded-full bg-muted'>
        <Send className='size-5 opacity-60' />
      </span>
      <p className='font-medium text-foreground'>没有匹配的推送记录</p>
      <p className='text-xs'>调整筛选条件，或新建一条推送。</p>
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='mt-2'
        onClick={onCreate}
      >
        新建推送
      </Button>
    </div>
  )
}

function PushCardList({
  rows,
  onEdit,
  onRetry,
  onDelete,
  onCreate,
}: {
  rows: PushRecord[]
  onEdit: (row: PushRecord) => void
  onRetry: (row: PushRecord) => void
  onDelete: (row: PushRecord) => void
  onCreate: () => void
}) {
  if (!rows.length)
    return (
      <div className='md:hidden'>
        <EmptyPushState onCreate={onCreate} />
      </div>
    )

  return (
    <div className='divide-y divide-border md:hidden'>
      {rows.map((row) => (
        <article key={row.id} className='space-y-3 p-4'>
          <div className='flex items-start justify-between gap-3'>
            <h3 className='min-w-0 font-medium wrap-break-word'>{row.title}</h3>
            <div className='shrink-0'>
              <StatusBadge status={row.status} />
            </div>
          </div>
          <p className='line-clamp-2 text-xs leading-5 text-muted-foreground'>
            {row.summary || '暂无摘要'}
          </p>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <span className='text-xs text-muted-foreground tabular-nums'>
              {formatSendTime(row)}
            </span>
            <PushActions
              row={row}
              onEdit={onEdit}
              onRetry={onRetry}
              onDelete={onDelete}
            />
          </div>
        </article>
      ))}
    </div>
  )
}

export function PushTable({
  rows,
  onEdit,
  onRetry,
  onDelete,
  onCreate,
}: {
  rows: PushRecord[]
  onEdit: (row: PushRecord) => void
  onRetry: (row: PushRecord) => void
  onDelete: (row: PushRecord) => void
  onCreate: () => void
}) {
  return (
    <>
      <PushCardList
        rows={rows}
        onEdit={onEdit}
        onRetry={onRetry}
        onDelete={onDelete}
        onCreate={onCreate}
      />
      <div className='hidden md:block'>
        <Table className='min-w-[820px] table-fixed'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[42%] pl-5'>推送内容</TableHead>
              <TableHead className='w-[18%] whitespace-nowrap'>
                发送时间
              </TableHead>
              <TableHead className='w-[16%]'>状态</TableHead>
              <TableHead className='w-[24%] pr-5 text-right'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='min-w-0 py-4 pl-5 align-top'>
                  <div className='min-w-0'>
                    <span className='line-clamp-1 font-medium'>
                      {row.title}
                    </span>
                    <span className='mt-1 line-clamp-1 block text-xs font-normal text-muted-foreground'>
                      {row.summary || '暂无摘要'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className='align-top text-sm text-muted-foreground tabular-nums'>
                  {formatSendTime(row)}
                </TableCell>
                <TableCell className='align-top'>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className='py-4 pr-5 text-right align-top'>
                  <PushActions
                    row={row}
                    onEdit={onEdit}
                    onRetry={onRetry}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))}

            {!rows.length && (
              <TableRow>
                <TableCell colSpan={4} className='p-0'>
                  <EmptyPushState onCreate={onCreate} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
