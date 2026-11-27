import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DateRange } from '@/interface/home'
import type { CommissionInviter } from '@/interface/invite'
import { getAvatarInitial } from '@/util/utils'
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  HandCoins,
  Send,
  Users,
} from 'lucide-react'
import { homeApi } from '@/api/home'
import {
  commissionSummaryKey,
  inviteGroupsKey,
  invitesApi,
} from '@/api/invites'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DateRangePicker } from '@/components/date-range-picker'
import { Main } from '@/components/layout/main'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { ActivityTrend } from './activity-trend'
import { todayInShanghai, number, trendRows, weekRange } from './report'

type Period = 'current' | 'previous' | 'custom'

const currency = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function CommissionPreview({
  items,
  loading,
  error,
  onRetry,
}: {
  items: CommissionInviter[]
  loading: boolean
  error: Error | null
  onRetry: () => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <Card className='min-w-0 gap-0 overflow-hidden py-0'>
      <CardHeader className='flex flex-row items-center justify-between gap-4 border-b px-4 py-3.5'>
        <CardTitle>佣金结算</CardTitle>
        {!loading && !error && items.length > 0 && (
          <p className='text-xs text-muted-foreground'>
            共 {items.length} 位邀请人 ·{' '}
            {items.reduce((total, inviter) => total + inviter.inviteCount, 0)}{' '}
            位被邀请人
          </p>
        )}
      </CardHeader>
      <CardContent className='overflow-x-auto p-0'>
        {loading ? (
          <p role='status' className='p-5 text-sm text-muted-foreground'>
            正在加载佣金数据…
          </p>
        ) : error ? (
          <div className='flex items-center gap-2 p-5 text-sm'>
            <p role='alert'>{error.message}</p>
            <Button variant='outline' size='sm' onClick={onRetry}>
              重试
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className='grid min-h-40 place-items-center px-6 text-center'>
            <div>
              <HandCoins className='mx-auto size-8 text-muted-foreground/40' />
              <p className='mt-2 text-sm text-muted-foreground'>
                暂无佣金记录。
              </p>
            </div>
          </div>
        ) : (
          <Table className='min-w-[1000px]'>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[30%]'>邀请人 / 被邀请人</TableHead>
                <TableHead className='w-[14%]'>活动</TableHead>
                <TableHead className='w-[14%]'>邀请时间</TableHead>
                <TableHead className='w-[14%] text-right'>金额</TableHead>
                <TableHead className='w-[12%] text-right'>佣金</TableHead>
                <TableHead className='w-[16%]'>发放状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((inviter) => {
                const open = !collapsed.has(inviter.key)
                const activityCount = new Set(
                  inviter.invitees.map((invitee) => invitee.activityName)
                ).size
                return [
                  <TableRow key={inviter.key} className='bg-muted/25'>
                    <TableCell>
                      <div className='flex items-center gap-2.5'>
                        <button
                          type='button'
                          className='grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                          aria-label={`${open ? '收起' : '展开'}${inviter.name}的邀请明细`}
                          aria-expanded={open}
                          onClick={() => toggle(inviter.key)}
                        >
                          {open ? (
                            <ChevronDown className='size-4' />
                          ) : (
                            <ChevronRight className='size-4' />
                          )}
                        </button>
                        <span className='grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-xs font-medium text-background'>
                          {getAvatarInitial(inviter.name)}
                        </span>
                        <div className='min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span className='truncate font-semibold'>
                              {inviter.name}
                            </span>
                            <span className='shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground'>
                              邀请 {inviter.inviteCount} 人
                            </span>
                          </div>
                          <p className='text-xs text-muted-foreground tabular-nums'>
                            {inviter.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {activityCount} 个活动
                    </TableCell>
                    <TableCell className='text-muted-foreground'>—</TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>
                      ¥ {currency.format(inviter.baseAmount)}
                    </TableCell>
                    <TableCell className='text-right font-semibold text-emerald-700 tabular-nums dark:text-emerald-400'>
                      ¥ {currency.format(inviter.commission)}
                    </TableCell>
                    <TableCell>
                      <p
                        className={
                          inviter.paid
                            ? 'text-sm text-emerald-700 dark:text-emerald-400'
                            : 'text-sm text-muted-foreground'
                        }
                      >
                        {inviter.paid
                          ? `已发放 · ${number.format(inviter.ratePercent)}%`
                          : '未发放'}
                      </p>
                      {inviter.paid && inviter.paidAt && (
                        <p className='text-xs text-muted-foreground tabular-nums'>
                          {inviter.paidAt}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>,
                  ...(open
                    ? inviter.invitees.map((invitee) => (
                        <TableRow key={invitee.signupId}>
                          <TableCell>
                            <div className='flex items-center gap-2.5 ps-8'>
                              <span
                                className='h-5 w-4 border-s border-b border-border/70'
                                aria-hidden='true'
                              />
                              <span className='grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground'>
                                {getAvatarInitial(invitee.name)}
                              </span>
                              <div className='min-w-0'>
                                <div className='flex items-center gap-2'>
                                  <span className='truncate text-sm'>
                                    {invitee.name}
                                  </span>
                                  <span className='shrink-0 rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground'>
                                    被邀请人
                                  </span>
                                </div>
                                <p className='text-xs text-muted-foreground'>
                                  一级邀请
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {invitee.activityName}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground tabular-nums'>
                            {invitee.invitedAt}
                          </TableCell>
                          <TableCell className='text-right text-sm tabular-nums'>
                            ¥ {currency.format(invitee.baseAmount)}
                          </TableCell>
                          <TableCell className='text-right text-sm text-emerald-700 tabular-nums dark:text-emerald-400'>
                            ¥ {currency.format(invitee.commission)}
                          </TableCell>
                          <TableCell className='text-muted-foreground'>
                            —
                          </TableCell>
                        </TableRow>
                      ))
                    : []),
                ]
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function ReportOverview() {
  const invites = useQuery({
    queryKey: inviteGroupsKey,
    queryFn: ({ signal }) => invitesApi.list(signal),
  })
  const commission = useQuery({
    queryKey: commissionSummaryKey,
    queryFn: ({ signal }) => invitesApi.commissionSummary(signal),
  })
  const allActivities = invites.data ?? []
  const today = todayInShanghai()
  const [period, setPeriod] = useState<Period>('current')
  const [custom, setCustom] = useState<DateRange>(() => weekRange(today))
  const [customDraft, setCustomDraft] = useState(custom)
  const [activityId, setActivityId] = useState('all')

  const range =
    period === 'custom'
      ? custom
      : weekRange(today, period === 'previous' ? -1 : 0)
  const validRange = Boolean(
    range.start && range.end && range.start <= range.end
  )
  const params = {
    startDate: range.start,
    endDate: range.end,
    activityId: activityId === 'all' ? undefined : activityId,
  }
  const overview = useQuery({
    queryKey: ['home-overview', params],
    queryFn: ({ signal }) => homeApi.overview(params, signal),
    enabled: validRange,
  })
  const metrics = overview.data?.metrics
  const cards = [
    {
      title: '活动次数',
      value: metrics?.activities,
      icon: CalendarDays,
      format: 'number',
    },
    {
      title: '报名人数',
      value: metrics?.registrations,
      icon: Users,
      format: 'number',
    },
    {
      title: '内容推送次数',
      value: metrics?.pushCount,
      icon: Send,
      format: 'number',
    },
    {
      title: '总佣金',
      value: commission.data?.totalCommission,
      icon: HandCoins,
      format: 'currency',
    },
  ] as const
  const datedRows =
    overview.data?.activityTrend.map((row) => ({
      date: row.date,
      signups: row.registrations,
      checkIns: 0,
    })) ?? []

  return (
    <Main className='mx-auto w-full max-w-7xl min-w-0 space-y-6 sm:px-6 lg:px-8'>
      <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-4'>
        <h1 className='shrink-0 text-3xl font-bold tracking-tight'>数据看板</h1>
        <div
          role='group'
          aria-label='数据看板筛选'
          className='flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 xl:justify-end'
        >
          <label className='flex items-center gap-2 text-sm font-medium whitespace-nowrap'>
            统计周期
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as Period)}
            >
              <SelectTrigger aria-label='统计周期' className='min-w-28'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='current'>本周</SelectItem>
                <SelectItem value='previous'>上周</SelectItem>
                <SelectItem value='custom'>自定义日期</SelectItem>
              </SelectContent>
            </Select>
          </label>
          {period === 'custom' && (
            <label className='flex items-center gap-2 text-sm font-medium whitespace-nowrap'>
              日期范围
              <DateRangePicker
                id='dashboard-date-range'
                label='统计日期范围'
                value={customDraft}
                onChange={(next) => {
                  setCustomDraft(next)
                  if (next.end) setCustom(next)
                }}
              />
            </label>
          )}
          <label className='flex min-w-0 items-center gap-2 text-sm font-medium whitespace-nowrap'>
            活动
            <Select value={activityId} onValueChange={setActivityId}>
              <SelectTrigger aria-label='筛选活动' className='w-40 sm:w-56'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部活动</SelectItem>
                {allActivities.map((item) => (
                  <SelectItem key={item.activityId} value={item.activityId}>
                    {item.activityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      {!validRange ? (
        <p role='alert' className='rounded-lg border p-4 text-sm'>
          请选择有效的日期范围，结束日期应等于或晚于开始日期。
        </p>
      ) : overview.isPending ? (
        <p role='status' className='p-4 text-sm text-muted-foreground'>
          正在加载统计…
        </p>
      ) : overview.isError ? (
        <div className='flex items-center gap-2 rounded-lg border p-4 text-sm'>
          <p role='alert'>{overview.error.message}</p>
          <Button variant='outline' onClick={() => overview.refetch()}>
            重试
          </Button>
        </div>
      ) : (
        <>
          <section
            aria-label='核心运营指标'
            className='grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4'
          >
            {cards.map(({ title, value, icon: Icon, format }) => (
              <Card key={title} className='min-w-0 gap-2 px-4 py-4'>
                <div className='flex items-center justify-between gap-2 text-sm font-medium'>
                  {title}
                  <Icon className='size-4 shrink-0 text-muted-foreground' />
                </div>
                <div>
                  <p className='text-3xl font-semibold tracking-tight tabular-nums'>
                    {value === undefined
                      ? '—'
                      : format === 'currency'
                        ? `¥ ${currency.format(value)}`
                        : number.format(value)}
                  </p>
                </div>
              </Card>
            ))}
          </section>

          <ActivityTrend rows={trendRows(datedRows, range, today)} />

          <CommissionPreview
            items={commission.data?.items ?? []}
            loading={commission.isPending}
            error={commission.error}
            onRetry={() => commission.refetch()}
          />
        </>
      )}
    </Main>
  )
}

export function Home() {
  return (
    <OperationsLayout title='运营概览'>
      <ReportOverview />
    </OperationsLayout>
  )
}
