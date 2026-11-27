import { useRef, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Activity,
  ActivityInput,
  ActivityStatus,
} from '@/interface/activity'
import type { PushInput } from '@/interface/push'
import { plainSummaryText } from '@/util/plain-summary'
import { ImagePlus, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { activitiesApi } from '@/api/activities'
import { pushesApi } from '@/api/pushes'
import { uploadsApi } from '@/api/uploads'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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
import { Textarea } from '@/components/ui/textarea'
import { aiActionButtonClass } from '@/components/ai-action-button'
import { ListSearchForm } from '@/components/data-table/list-search-form'
import { DatePicker } from '@/components/date-picker'
import { Main } from '@/components/layout/main'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { PageHeader } from '@/components/layout/page-header'
import { PushComposer } from '@/features/content-push/push-composer'
import { defaultActivitySharer, todayInShanghai } from '@/features/home/report'
import { thumbnailFile } from '@/features/products/product-image'
import { activitySummaryLength } from './activity-ai'
import { activityDetailKey, activityListsKey } from './activity-keys'
import { ActivityReviewDialog } from './activity-review-dialog'
import { PosterDialog } from './poster-dialog'

type Selection = { action: 'create' } | { action: 'view' | 'edit'; id: string }

const pageSize = 10

const textActionClass =
  'text-xs font-normal text-muted-foreground transition-colors hover:text-foreground'

function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  if (status === 'pushed') {
    return (
      <Badge
        variant='outline'
        className='border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300'
      >
        已推送
      </Badge>
    )
  }
  return status === 'ended' ? (
    <Badge
      variant='outline'
      className='border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
    >
      已结束
    </Badge>
  ) : (
    <Badge
      variant='outline'
      className='border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
    >
      未开始
    </Badge>
  )
}

function activityPriceLabel(price: number) {
  return price > 0 ? `¥${price.toFixed(2)}` : '免费'
}

function ActivityForm({
  activity,
  onSave,
  saving,
}: {
  activity?: Activity
  onSave: (activity: ActivityInput) => Promise<void>
  saving: boolean
}) {
  const [error, setError] = useState('')
  const [aiError, setAiError] = useState('')
  const [date, setDate] = useState(activity?.date ?? todayInShanghai())
  const [thumbnail, setThumbnail] = useState(activity?.thumbnail ?? '')
  const [processing, setProcessing] = useState(false)
  const [title, setTitle] = useState(activity?.name ?? '')
  const [sharer, setSharer] = useState(
    activity?.sharer ?? defaultActivitySharer
  )
  const [summary, setSummary] = useState(activity?.summary ?? '')
  const [price, setPrice] = useState(String(activity?.price ?? 0))
  const [generating, setGenerating] = useState(false)
  const summaryLength = activitySummaryLength(summary)
  // AI 优化按钮暂时隐藏，恢复时改为 true；相关代码完整保留。
  const showAiActions = false

  async function handleFile(file: File | undefined) {
    if (!file) return
    setProcessing(true)
    setError('')
    try {
      const uploaded = await uploadsApi.image(await thumbnailFile(file))
      setThumbnail(uploaded.url)
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : '活动缩略图处理失败。'
      )
    } finally {
      setProcessing(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || processing) return
    if (!title.trim() || !sharer.trim()) {
      setError('请填写活动标题和分享人。')
      return
    }
    if (summaryLength === 0) {
      setError('请填写活动概要。')
      return
    }
    if (summaryLength > 100) {
      setError('活动概要最多 100 字。')
      return
    }
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(price.trim())) {
      setError('请填写有效的活动价格，0 表示免费，最多保留两位小数。')
      return
    }
    setError('')
    try {
      await onSave({
        name: title.trim(),
        sharer: sharer.trim(),
        date,
        summary: summary.trim(),
        price: Number(price),
        thumbnail,
      })
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : '活动保存失败，请重试。'
      )
    }
  }

  async function generateSummary() {
    if (!title.trim()) {
      setAiError('请先填写活动标题。')
      return
    }

    const previous = summary
    setAiError('')
    setSummary('')
    setGenerating(true)
    try {
      const draft = await activitiesApi.generateSummaryStream(
        {
          title: title.trim(),
          summary: plainSummaryText(previous).slice(0, 100),
        },
        (_delta, full) => {
          setSummary(plainSummaryText(full).slice(0, 100))
        }
      )
      const finalText = plainSummaryText(draft).slice(0, 100)
      if (!finalText) throw new Error('AI 未返回活动概要，请稍后重试。')
      setSummary(finalText)
      toast.success('活动概要已生成', {
        description: '可以继续手动调整。',
      })
    } catch (failure) {
      setSummary(previous)
      setAiError(
        failure instanceof Error ? failure.message : '生成失败，请稍后重试。'
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <form aria-busy={saving} onSubmit={submit}>
        <fieldset className='space-y-4' disabled={saving || processing}>
          <div className='space-y-2'>
            <Label htmlFor='activity-thumbnail'>活动缩略图</Label>
            <div className='relative aspect-video w-full max-w-[220px] overflow-hidden rounded-xl border bg-muted/40'>
              {thumbnail ? (
                <>
                  <img
                    src={thumbnail}
                    alt='活动缩略图预览'
                    className='size-full object-cover'
                  />
                  <div className='absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/55 to-transparent p-2'>
                    <button
                      type='button'
                      className='rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-900'
                      onClick={() =>
                        document.getElementById('activity-thumbnail')?.click()
                      }
                    >
                      更换
                    </button>
                  </div>
                  <button
                    type='button'
                    aria-label='移除活动缩略图'
                    onClick={() => setThumbnail('')}
                    className='absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-black/55 text-white'
                  >
                    <X className='size-3.5' />
                  </button>
                </>
              ) : (
                <label
                  htmlFor='activity-thumbnail'
                  className='flex size-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground'
                >
                  <ImagePlus className='size-6' />
                  <span className='text-xs'>点击上传 16:9 图片</span>
                  <span className='text-[11px]'>JPG / PNG，不超过 8MB</span>
                </label>
              )}
              {processing && (
                <div className='absolute inset-0 grid place-items-center bg-background/70'>
                  <Loader2 className='size-5 animate-spin text-muted-foreground' />
                </div>
              )}
            </div>
            <input
              id='activity-thumbnail'
              type='file'
              accept='image/*'
              className='sr-only'
              onChange={(event) => {
                void handleFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <p className='text-[11px] leading-4 text-muted-foreground'>
              不上传时，官网活动卡片和详情会自动使用统一占位图。
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='activity-name'>活动标题</Label>
            <Input
              id='activity-name'
              name='name'
              required
              maxLength={50}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder='例如：保研面试经验分享'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='activity-sharer'>分享人</Label>
            <Input
              id='activity-sharer'
              name='sharer'
              required
              maxLength={50}
              value={sharer}
              onChange={(event) => setSharer(event.target.value)}
              placeholder='输入分享人姓名'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='activity-date'>活动日期</Label>
            <DatePicker id='activity-date' value={date} onChange={setDate} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='activity-price'>活动价格</Label>
            <div className='relative'>
              <Input
                id='activity-price'
                name='price'
                type='number'
                min={0}
                max={999999.99}
                step={0.01}
                inputMode='decimal'
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className='pe-9'
              />
              <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground'>
                元
              </span>
            </div>
            <p className='text-xs leading-5 text-muted-foreground'>
              0 表示免费，最多保留两位小数。
            </p>
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between gap-3'>
              <Label htmlFor='activity-summary' className='shrink-0'>
                活动概要
              </Label>
              {showAiActions && (
                <Button
                  type='button'
                  size='sm'
                  className={`${aiActionButtonClass} shrink-0`}
                  onClick={() => void generateSummary()}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className='size-3.5 animate-spin' />
                  ) : (
                    <Sparkles className='size-3.5' />
                  )}
                  {generating ? '正在生成…' : 'AI 生成摘要'}
                </Button>
              )}
            </div>
            {aiError && (
              <p role='alert' className='text-xs text-destructive'>
                {aiError}
              </p>
            )}
            <Textarea
              id='activity-summary'
              name='summary'
              aria-required='true'
              rows={4}
              value={summary}
              disabled={generating}
              onChange={(event) => setSummary(event.target.value)}
              placeholder='请输入活动概要，最多 100 字。'
            />
            <p
              className={`text-right text-xs ${
                summaryLength > 100
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {summaryLength}/100 字
            </p>
          </div>
          {error && (
            <p role='alert' className='text-sm text-destructive'>
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type='button' variant='outline'>
                取消
              </Button>
            </DialogClose>
            <Button type='submit' disabled={saving || processing || generating}>
              {processing ? '正在处理图片…' : saving ? '正在保存…' : '保存活动'}
            </Button>
          </DialogFooter>
        </fieldset>
      </form>
    </>
  )
}

function ActivityDetails({ activity }: { activity: Activity }) {
  return (
    <dl className='divide-y rounded-lg border px-4'>
      {[
        { label: '活动标题', value: activity.name },
        { label: '活动概要', value: activity.summary || '—' },
        { label: '分享人', value: activity.sharer || '—' },
        { label: '活动日期', value: activity.date },
        { label: '活动价格', value: activityPriceLabel(activity.price) },
        {
          label: '活动缩略图',
          value: activity.thumbnail ? '已上传' : '使用默认占位图',
        },
        { label: '活动内容', value: activity.hasContent ? '已录入' : '未录入' },
      ].map(({ label, value }) => (
        <div key={label} className='py-3'>
          <dt className='text-sm text-muted-foreground'>{label}</dt>
          <dd className='mt-1 text-sm font-medium wrap-break-word'>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ExistingActivityContent({
  id,
  action,
  onSave,
  saving,
}: {
  id: string
  action: 'view' | 'edit'
  onSave: (input: ActivityInput) => Promise<void>
  saving: boolean
}) {
  const detail = useQuery({
    queryKey: activityDetailKey(id),
    queryFn: ({ signal }) => activitiesApi.detail(id, signal),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  if (detail.isPending || (!detail.isFetchedAfterMount && detail.isFetching)) {
    return (
      <p role='status' className='text-sm text-muted-foreground'>
        正在加载活动…
      </p>
    )
  }
  if (detail.isError) {
    return (
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p role='alert' className='text-sm text-destructive'>
          {detail.error.message}
        </p>
        <Button variant='outline' size='sm' onClick={() => detail.refetch()}>
          重试
        </Button>
      </div>
    )
  }

  return action === 'view' ? (
    <ActivityDetails activity={detail.data} />
  ) : (
    <ActivityForm activity={detail.data} onSave={onSave} saving={saving} />
  )
}

function DeleteActivityButton({
  activity,
  onDelete,
}: {
  activity: Activity
  onDelete: (activity: Activity) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await onDelete(activity)
      setOpen(false)
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : '活动删除失败，请重试。'
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!deleting) setOpen(next)
      }}
    >
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
        aria-label='删除活动确认'
        onInteractOutside={(event) => event.preventDefault()}
        className='space-y-4'
      >
        <div className='space-y-1.5'>
          <p className='font-medium'>删除活动？</p>
          <p className='text-sm wrap-break-word text-muted-foreground'>
            「{activity.name}」将从活动列表中移除。
          </p>
        </div>
        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            size='sm'
            variant='outline'
            disabled={deleting}
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            type='button'
            size='sm'
            variant='destructive'
            disabled={deleting}
            onClick={confirmDelete}
          >
            {deleting ? '正在删除…' : '确认删除'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const emptyFilters = { name: '', sharer: '', date: '' }

export function Activities() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [reviewing, setReviewing] = useState<Activity | null>(null)
  const [pushing, setPushing] = useState<Activity | null>(null)
  const [loadingPushId, setLoadingPushId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState(emptyFilters)
  const [searchDate, setSearchDate] = useState('')
  const addButton = useRef<HTMLButtonElement>(null)
  const actionButton = useRef<HTMLElement | null>(null)

  const params = {
    page,
    pageSize,
    keyword: filters.name || undefined,
    sharer: filters.sharer || undefined,
    date: filters.date || undefined,
  }
  const list = useQuery({
    queryKey: [...activityListsKey, params],
    queryFn: ({ signal }) => activitiesApi.list(params, signal),
  })
  const activities = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  async function persistActivity(input: ActivityInput) {
    if (saving || !selection || selection.action === 'view') return
    const id = selection.action === 'edit' ? selection.id : undefined
    setSaving(true)
    try {
      const saved = id
        ? await activitiesApi.update(id, input)
        : await activitiesApi.create(input)

      queryClient.setQueryData(activityDetailKey(saved.id), saved)
      void queryClient.invalidateQueries({ queryKey: activityListsKey })
      setSelection(null)
      toast.success(id ? '活动已更新' : '活动已添加', {
        description: saved.name,
      })
    } finally {
      setSaving(false)
    }
  }

  function closeReview() {
    setReviewing(null)
    window.setTimeout(() => {
      if (actionButton.current?.isConnected) actionButton.current.focus()
      else addButton.current?.focus()
    }, 0)
  }

  function reviewSaved(saved: Activity) {
    queryClient.setQueryData(activityDetailKey(saved.id), saved)
    void queryClient.invalidateQueries({ queryKey: activityListsKey })
    closeReview()
    toast.success('活动回顾已保存', { description: saved.name })
  }

  async function openPush(activity: Activity) {
    if (loadingPushId) return
    setLoadingPushId(activity.id)
    try {
      const detail = await activitiesApi.detail(activity.id)
      if (!detail.hasContent) {
        toast.error('请先填写活动回顾，再创建推送。')
        return
      }
      setPushing(detail)
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : '活动回顾加载失败。'
      )
    } finally {
      setLoadingPushId(null)
    }
  }

  function closePush() {
    setPushing(null)
    window.setTimeout(() => {
      if (actionButton.current?.isConnected) actionButton.current.focus()
      else addButton.current?.focus()
    }, 0)
  }

  async function savePush(input: PushInput) {
    const saved = await pushesApi.create(input)
    if (saved.activityId) {
      queryClient.removeQueries({
        queryKey: activityDetailKey(saved.activityId),
      })
    }
    await queryClient.invalidateQueries({ queryKey: activityListsKey })
    closePush()
    return saved
  }

  async function removeActivity(activity: Activity) {
    await activitiesApi.remove(activity.id)
    queryClient.removeQueries({ queryKey: activityDetailKey(activity.id) })
    const lastPage = Math.max(1, Math.ceil((total - 1) / pageSize))
    if (page > lastPage) setPage(lastPage)
    await queryClient.invalidateQueries({ queryKey: activityListsKey })
    toast.success('活动已删除', { description: activity.name })
    addButton.current?.focus()
  }

  function restoreFocus(event: Event) {
    event.preventDefault()
    if (actionButton.current?.isConnected) actionButton.current.focus()
    else addButton.current?.focus()
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <OperationsLayout title='活动'>
      <Main className='mx-auto w-full max-w-7xl min-w-0 space-y-6 sm:px-6 lg:px-8'>
        <PageHeader
          title='活动'
          actions={
            <Button
              ref={addButton}
              onClick={() => {
                actionButton.current = addButton.current
                setSelection({ action: 'create' })
              }}
            >
              <Plus />
              新增活动
            </Button>
          }
        />

        <ListSearchForm
          label='查询活动'
          onSearch={(fields) => {
            setPage(1)
            setFilters({
              name: String(fields.get('name') ?? '').trim(),
              sharer: String(fields.get('sharer') ?? '').trim(),
              date: searchDate,
            })
          }}
          onReset={() => {
            setPage(1)
            setFilters(emptyFilters)
            setSearchDate('')
          }}
        >
          <div className='grid w-full gap-1.5 sm:w-48'>
            <Label htmlFor='search-activity-title'>活动标题</Label>
            <Input
              id='search-activity-title'
              name='name'
              maxLength={50}
              placeholder='输入活动标题'
            />
          </div>
          <div className='grid w-full gap-1.5 sm:w-40'>
            <Label htmlFor='search-activity-sharer'>分享人</Label>
            <Input
              id='search-activity-sharer'
              name='sharer'
              placeholder='输入分享人姓名'
            />
          </div>
          <div className='grid w-full gap-1.5 sm:w-48'>
            <Label htmlFor='search-activity-date'>活动日期</Label>
            <DatePicker
              id='search-activity-date'
              value={searchDate}
              onChange={setSearchDate}
            />
          </div>
        </ListSearchForm>

        <Card className='min-w-0 gap-0 py-0'>
          <CardContent className='px-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='ps-5'>活动标题</TableHead>
                  <TableHead className='hidden sm:table-cell'>分享人</TableHead>
                  <TableHead className='hidden sm:table-cell'>
                    活动日期
                  </TableHead>
                  <TableHead className='hidden md:table-cell'>价格</TableHead>
                  <TableHead className='whitespace-nowrap'>状态</TableHead>
                  <TableHead className='text-end whitespace-nowrap'>
                    <span className='sm:hidden'>报名人数</span>
                    <span className='hidden sm:inline'>活动报名（人数）</span>
                  </TableHead>
                  <TableHead className='pe-5 text-end'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className='max-w-80 py-3.5 ps-5'>
                      <Button
                        type='button'
                        variant='link'
                        className='h-auto p-0 text-start font-medium wrap-break-word whitespace-normal'
                        onClick={(event) => {
                          actionButton.current = event.currentTarget
                          setSelection({ action: 'view', id: activity.id })
                        }}
                      >
                        {activity.name}
                      </Button>
                      <span className='mt-1 block text-xs font-normal text-muted-foreground sm:hidden'>
                        {activity.sharer || '—'} · {activity.date} ·{' '}
                        {activityPriceLabel(activity.price)}
                      </span>
                    </TableCell>
                    <TableCell className='hidden sm:table-cell'>
                      {activity.sharer || '—'}
                    </TableCell>
                    <TableCell className='hidden text-muted-foreground tabular-nums sm:table-cell'>
                      {activity.date}
                    </TableCell>
                    <TableCell className='hidden whitespace-nowrap tabular-nums md:table-cell'>
                      {activityPriceLabel(activity.price)}
                    </TableCell>
                    <TableCell>
                      <ActivityStatusBadge status={activity.status} />
                    </TableCell>
                    <TableCell className='text-end tabular-nums'>
                      <span aria-label='活动报名人数'>
                        {activity.signupCount ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className='pe-5'>
                      <div className='flex flex-wrap justify-end gap-x-3 gap-y-1'>
                        {activity.status === 'not_started' && (
                          <PosterDialog activity={activity} />
                        )}
                        {activity.status !== 'pushed' && (
                          <button
                            type='button'
                            className={textActionClass}
                            onClick={(event) => {
                              actionButton.current = event.currentTarget
                              setReviewing(activity)
                            }}
                          >
                            {activity.hasContent ? '编辑回顾' : '写回顾'}
                          </button>
                        )}
                        {activity.hasContent &&
                          activity.status !== 'pushed' && (
                            <button
                              type='button'
                              className={`${textActionClass} disabled:cursor-wait disabled:opacity-60`}
                              disabled={loadingPushId === activity.id}
                              onClick={(event) => {
                                actionButton.current = event.currentTarget
                                void openPush(activity)
                              }}
                            >
                              {loadingPushId === activity.id
                                ? '推送中…'
                                : '推送'}
                            </button>
                          )}
                        {activity.status === 'not_started' && (
                          <button
                            type='button'
                            className={textActionClass}
                            onClick={(event) => {
                              actionButton.current = event.currentTarget
                              setSelection({ action: 'edit', id: activity.id })
                            }}
                          >
                            编辑
                          </button>
                        )}
                        <DeleteActivityButton
                          activity={activity}
                          onDelete={removeActivity}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!activities.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='h-20 text-center text-muted-foreground'
                    >
                      {list.isPending ? (
                        <span role='status'>正在加载活动…</span>
                      ) : list.isError ? (
                        <>
                          <span role='alert'>{list.error.message}</span>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => list.refetch()}
                          >
                            重试
                          </Button>
                        </>
                      ) : hasFilters ? (
                        '未找到符合条件的活动'
                      ) : (
                        '暂无活动'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {(total > 0 || page > 1) && (
            <CardFooter className='flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3'>
              <p className='text-xs text-muted-foreground tabular-nums'>
                共 {total} 条活动
              </p>
              <Pagination
                className='mx-0 w-auto justify-end'
                aria-label='活动分页'
              >
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      disabled={page === 1 || list.isPending}
                      onClick={() => setPage(page - 1)}
                    />
                  </PaginationItem>
                  <PaginationItem
                    aria-current='page'
                    className='px-2 text-sm tabular-nums'
                  >
                    第 {page} 页
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      disabled={page >= pageCount || list.isPending}
                      onClick={() => setPage(page + 1)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardFooter>
          )}
        </Card>
      </Main>
      <Dialog
        open={selection !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setSelection(null)
        }}
      >
        <DialogContent
          className='flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg'
          onCloseAutoFocus={restoreFocus}
          showCloseButton={!saving}
        >
          <DialogHeader className='shrink-0 border-b px-6 py-4 pe-12 text-left'>
            <DialogTitle>
              {selection?.action === 'view'
                ? '活动详情'
                : selection?.action === 'edit'
                  ? '编辑活动'
                  : '新增活动'}
            </DialogTitle>
          </DialogHeader>
          <div className='min-h-0 flex-1 overflow-y-auto p-6'>
            {selection?.action === 'create' && (
              <ActivityForm onSave={persistActivity} saving={saving} />
            )}
            {selection && selection.action !== 'create' && (
              <ExistingActivityContent
                key={selection.id}
                id={selection.id}
                action={selection.action}
                onSave={persistActivity}
                saving={saving}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      {reviewing && (
        <ActivityReviewDialog
          activity={reviewing}
          onClose={closeReview}
          onSaved={reviewSaved}
        />
      )}
      {pushing && (
        <PushComposer
          initial={null}
          preset={{
            title: pushing.name,
            summary: pushing.summary,
            document: pushing.content,
            contentMarkdown: pushing.contentMarkdown,
            activityId: pushing.id,
          }}
          onClose={closePush}
          onSave={savePush}
        />
      )}
    </OperationsLayout>
  )
}
