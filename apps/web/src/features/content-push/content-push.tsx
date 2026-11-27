import { lazy, Suspense, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { PushInput, PushRecord, PushStatus } from '@/interface/push'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { pushesApi } from '@/api/pushes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/date-range-picker'
import { Main } from '@/components/layout/main'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { PageHeader } from '@/components/layout/page-header'
import { PushTable } from './push-table'

const PushComposer = lazy(() =>
  import('./push-composer').then((module) => ({ default: module.PushComposer }))
)
type StatusFilter = 'all' | PushStatus

type Filters = {
  keyword: string
  status: StatusFilter
  start: string
  end: string
}

const emptyFilters: Filters = {
  keyword: '',
  status: 'all',
  start: '',
  end: '',
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'sent', label: '已发送' },
  { value: 'scheduled', label: '定时发送' },
  { value: 'failed', label: '发送失败' },
  { value: 'draft', label: '草稿' },
]

const PAGE_SIZE = 5

function paginationItems(currentPage: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', pageCount] as const
  }
  if (currentPage >= pageCount - 2) {
    return [
      1,
      'ellipsis',
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ] as const
  }
  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    pageCount,
  ] as const
}

function LoadingDialog({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Dialog open>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className='flex min-h-24 items-center justify-center gap-2 text-sm text-muted-foreground'>
          <Loader2 className='size-4 animate-spin' />
          正在加载…
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ContentPush() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [filterError, setFilterError] = useState('')
  const [page, setPage] = useState(1)
  const [composing, setComposing] = useState<{
    record: PushRecord | null
  } | null>(null)

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      (draft.start && !draft.end) ||
      (!draft.start && draft.end) ||
      (draft.start && draft.end && draft.start > draft.end)
    ) {
      setFilterError('请选择完整的日期范围，且结束日期不早于开始日期。')
      return
    }
    setFilterError('')
    setFilters(draft)
    setPage(1)
  }

  function resetFilters() {
    setDraft(emptyFilters)
    setFilters(emptyFilters)
    setFilterError('')
    setPage(1)
  }

  const query = {
    page,
    pageSize: PAGE_SIZE,
    keyword: filters.keyword.trim() || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    startDate: filters.start || undefined,
    endDate: filters.end || undefined,
  }
  const pushes = useQuery({
    queryKey: ['pushes', query],
    queryFn: ({ signal }) => pushesApi.list(query, signal),
  })
  const total = pushes.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = page
  const pageRows = pushes.data?.items ?? []
  const firstRow = total ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const lastRow = Math.min(currentPage * PAGE_SIZE, total)
  const pageItems = paginationItems(currentPage, pageCount)

  async function retryPush(row: PushRecord) {
    try {
      await pushesApi.retry(row.id)
      void queryClient.invalidateQueries({ queryKey: ['pushes'] })
      toast.success('已重新发送')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '重新发送失败。')
    }
  }

  async function deletePush(row: PushRecord) {
    try {
      await pushesApi.remove(row.id)
      setPage(Math.min(page, Math.max(1, Math.ceil((total - 1) / PAGE_SIZE))))
      void queryClient.invalidateQueries({ queryKey: ['pushes'] })
      toast.success('推送已删除', { description: row.title })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除推送失败。')
    }
  }

  async function saveComposed(input: PushInput) {
    const id = composing?.record?.id
    const result = id
      ? await pushesApi.update(id, input)
      : await pushesApi.create(input)
    if (!id) setPage(1)
    void queryClient.invalidateQueries({ queryKey: ['pushes'] })
    setComposing(null)
    return result
  }

  return (
    <OperationsLayout title='内容推送'>
      <Main className='mx-auto w-full max-w-7xl min-w-0 space-y-6 sm:px-6 lg:px-8'>
        <PageHeader
          title='内容推送'
          className='gap-3'
          actions={
            <Button onClick={() => setComposing({ record: null })}>
              <Plus className='size-4' />
              AI 创作推送
            </Button>
          }
        />

        <div className='space-y-2'>
          <form
            role='search'
            aria-label='筛选推送记录'
            onSubmit={applyFilters}
            className='flex flex-wrap items-end gap-3 bg-card'
          >
            <div className='grid w-full gap-1.5 sm:w-56'>
              <Label htmlFor='push-keyword'>关键词</Label>
              <Input
                id='push-keyword'
                value={draft.keyword}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, keyword: event.target.value }))
                }
                placeholder='搜索标题或摘要'
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='push-status'>状态</Label>
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    status: value as StatusFilter,
                  }))
                }
              >
                <SelectTrigger id='push-status' className='w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='push-date-range'>发送日期</Label>
              <DateRangePicker
                id='push-date-range'
                label='发送日期范围'
                value={{ start: draft.start, end: draft.end }}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    start: next.start,
                    end: next.end,
                  }))
                }
                className='w-60'
              />
            </div>
            <div className='flex gap-2'>
              <Button type='submit'>搜索</Button>
              <Button type='button' variant='outline' onClick={resetFilters}>
                重置
              </Button>
            </div>
          </form>
          {filterError && (
            <p role='alert' className='text-sm text-destructive'>
              {filterError}
            </p>
          )}
        </div>

        <Card className='min-w-0 gap-0 overflow-hidden py-0'>
          <CardContent className='p-0'>
            {pushes.isPending ? (
              <p role='status' className='p-5 text-sm text-muted-foreground'>
                正在加载推送…
              </p>
            ) : pushes.isError ? (
              <div className='flex items-center gap-2 p-5 text-sm'>
                <p role='alert'>{pushes.error.message}</p>
                <Button variant='outline' onClick={() => pushes.refetch()}>
                  重试
                </Button>
              </div>
            ) : (
              <PushTable
                rows={pageRows}
                onEdit={(row) => setComposing({ record: row })}
                onRetry={retryPush}
                onDelete={deletePush}
                onCreate={() => setComposing({ record: null })}
              />
            )}
          </CardContent>

          {(total > 0 || page > 1) && (
            <CardFooter className='flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3'>
              <p className='text-xs text-muted-foreground tabular-nums'>
                第 {firstRow}-{lastRow} 条，共 {total} 条
              </p>
              <Pagination className='mx-0 w-auto justify-end'>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    />
                  </PaginationItem>
                  {pageItems.map((item, index) =>
                    item === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          isActive={item === currentPage}
                          aria-label={`第 ${item} 页`}
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      disabled={currentPage >= pageCount}
                      onClick={() => setPage(currentPage + 1)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardFooter>
          )}
        </Card>
      </Main>

      {composing && (
        <Suspense
          fallback={
            <LoadingDialog
              title='内容推送'
              description='正在加载 BlockNote 编辑器…'
            />
          }
        >
          <PushComposer
            initial={composing.record}
            onClose={() => setComposing(null)}
            onSave={saveComposed}
          />
        </Suspense>
      )}
    </OperationsLayout>
  )
}
