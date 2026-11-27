import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CommissionInvitee, CommissionInviter } from '@/interface/invite'
import { getAvatarInitial } from '@/util/utils'
import {
  ChevronDown,
  ChevronRight,
  HandCoins,
  RefreshCw,
  UsersRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { commissionSummaryKey, invitesApi } from '@/api/invites'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Main } from '@/components/layout/main'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { PageHeader } from '@/components/layout/page-header'

function formatRate(value?: number) {
  if (value === undefined) return ''
  return Number(value.toFixed(2)).toString()
}

function money(value: number) {
  return value.toFixed(2)
}

function AmountInput({
  invitee,
  disabled,
  onSaved,
}: {
  invitee: CommissionInvitee
  disabled: boolean
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? formatRate(invitee.baseAmount)
  const updateAmount = useMutation({
    mutationFn: (baseAmount: number) =>
      invitesApi.updateCommissionAmount(invitee.signupId, baseAmount),
    onSuccess: (data) => {
      setDraft(formatRate(data.baseAmount))
      onSaved()
      toast.success('金额已更新。')
    },
    onError: (error) => {
      setDraft(null)
      toast.error(error instanceof Error ? error.message : '金额保存失败。')
    },
  })

  function save() {
    if (draft === null || updateAmount.isPending) return
    const raw = value.trim()
    const amount = raw ? Number(raw) : 0
    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 99_999_999.99 ||
      (raw && !/^\d{1,8}(\.\d{1,2})?$/.test(raw))
    ) {
      toast.error('请输入 0–99999999.99 之间的金额，最多两位小数。')
      setDraft(null)
      return
    }
    if (Math.abs(amount - invitee.baseAmount) < 0.001) return
    updateAmount.mutate(amount)
  }

  return (
    <div className='relative mx-auto w-32'>
      <span className='pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-xs text-muted-foreground'>
        ¥
      </span>
      <Input
        aria-label={`${invitee.name}的金额`}
        className='h-8 ps-6 pe-2 text-right tabular-nums'
        type='number'
        min={0}
        max={99_999_999.99}
        step={0.01}
        inputMode='decimal'
        value={value}
        placeholder='0.00'
        disabled={disabled || updateAmount.isPending}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
    </div>
  )
}

function PayoutSwitch({
  inviter,
  onChanged,
}: {
  inviter: CommissionInviter
  onChanged: () => void
}) {
  const updatePayout = useMutation({
    mutationFn: (paid: boolean) =>
      invitesApi.updateCommissionPayout(inviter.phone, paid),
    onSuccess: () => {
      onChanged()
      toast.success(inviter.paid ? '已标记为未发放。' : '已标记为已发放。')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '发放状态更新失败。')
    },
  })

  return (
    <div className='flex items-center gap-2.5'>
      <Switch
        checked={inviter.paid}
        disabled={updatePayout.isPending}
        aria-label={`${inviter.name}的佣金发放状态`}
        onCheckedChange={(checked) => updatePayout.mutate(checked)}
      />
      <div className='min-w-0'>
        <p
          className={
            inviter.paid
              ? 'text-sm text-emerald-700 dark:text-emerald-400'
              : 'text-sm text-muted-foreground'
          }
        >
          {inviter.paid
            ? `已发放 · ${formatRate(inviter.ratePercent)}%`
            : '未发放'}
        </p>
        {inviter.paid && inviter.paidAt && (
          <p className='text-xs text-muted-foreground tabular-nums'>
            {inviter.paidAt}
          </p>
        )}
      </div>
    </div>
  )
}

function CommissionTree({
  items,
  loading,
  onSaved,
}: {
  items: CommissionInviter[]
  loading: boolean
  onSaved: () => void
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
    <div className='overflow-x-auto'>
      <Table className='min-w-[1040px]'>
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
                  ¥ {money(inviter.baseAmount)}
                </TableCell>
                <TableCell className='text-right font-semibold text-emerald-700 tabular-nums dark:text-emerald-400'>
                  ¥ {money(inviter.commission)}
                </TableCell>
                <TableCell>
                  <PayoutSwitch inviter={inviter} onChanged={onSaved} />
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
                              一级邀请 · 计入佣金
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
                      <TableCell>
                        <AmountInput
                          invitee={invitee}
                          disabled={loading || inviter.paid}
                          onSaved={onSaved}
                        />
                      </TableCell>
                      <TableCell className='text-right text-sm text-emerald-700 tabular-nums dark:text-emerald-400'>
                        ¥ {money(invitee.commission)}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>—</TableCell>
                    </TableRow>
                  ))
                : []),
            ]
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function Commissions() {
  const queryClient = useQueryClient()
  const [rateDraft, setRateDraft] = useState<string | null>(null)
  const summary = useQuery({
    queryKey: commissionSummaryKey,
    queryFn: ({ signal }) => invitesApi.commissionSummary(signal),
  })
  const items = summary.data?.items ?? []
  const rateValue = rateDraft ?? formatRate(summary.data?.ratePercent)
  const updateRate = useMutation({
    mutationFn: invitesApi.updateCommissionRate,
    onSuccess: () => {
      setRateDraft(null)
      queryClient.invalidateQueries({ queryKey: commissionSummaryKey })
      toast.success('佣金比例已更新，已发放记录保持原比例。')
    },
    onError: (error) => {
      setRateDraft(null)
      toast.error(error instanceof Error ? error.message : '佣金比例保存失败。')
    },
  })

  function saveRate() {
    if (rateDraft === null) return
    const raw = rateValue.trim()
    const value = Number(raw)
    if (
      !raw ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100 ||
      !/^\d{1,3}(\.\d{1,2})?$/.test(raw)
    ) {
      toast.error('请输入 0–100 之间的比例，最多两位小数。')
      setRateDraft(null)
      return
    }
    if (Math.abs(value - (summary.data?.ratePercent ?? 0)) < 0.001) {
      setRateDraft(null)
      return
    }
    updateRate.mutate(value)
  }

  return (
    <OperationsLayout title='佣金结算'>
      <Main className='mx-auto w-full max-w-7xl min-w-0 space-y-5 sm:px-6 lg:px-8'>
        <PageHeader
          title='佣金结算'
          className='items-center gap-3'
          actions={
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => summary.refetch()}
              disabled={summary.isFetching}
            >
              <RefreshCw
                className={`size-4 ${summary.isFetching ? 'animate-spin' : ''}`}
                aria-hidden='true'
              />
              刷新
            </Button>
          }
        >
          <div className='flex items-center gap-2'>
            <Label
              htmlFor='commission-rate'
              className='text-sm font-normal text-muted-foreground'
            >
              佣金比例
            </Label>
            <div className='relative'>
              <Input
                id='commission-rate'
                aria-label='佣金比例'
                className='h-9 w-24 pe-7 text-right tabular-nums'
                type='number'
                min={0}
                max={100}
                step={0.01}
                inputMode='decimal'
                value={rateValue}
                disabled={summary.isPending || updateRate.isPending}
                onChange={(event) => setRateDraft(event.target.value)}
                onBlur={saveRate}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                }}
              />
              <span className='pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-xs text-muted-foreground'>
                %
              </span>
            </div>
          </div>
        </PageHeader>

        <Card className='min-w-0 gap-0 overflow-hidden py-0'>
          <div className='flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5'>
            <div className='flex items-center gap-2'>
              <HandCoins className='size-4 text-muted-foreground' />
              <h2 className='text-sm font-medium'>结算明细</h2>
            </div>
            <p className='text-xs text-muted-foreground'>
              共 {summary.data?.inviterCount ?? 0} 位邀请人 ·{' '}
              {summary.data?.inviteeCount ?? 0} 位被邀请人
            </p>
          </div>

          {summary.isPending ? (
            <p role='status' className='p-5 text-sm text-muted-foreground'>
              正在加载佣金结算数据…
            </p>
          ) : summary.isError ? (
            <div className='flex items-center gap-2 p-5 text-sm'>
              <p role='alert'>{summary.error.message}</p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => summary.refetch()}
              >
                重试
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className='grid min-h-56 place-items-center px-6 text-center'>
              <div>
                <UsersRound className='mx-auto size-8 text-muted-foreground/40' />
                <p className='mt-3 font-medium'>还没有邀请记录</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  邀请 0 人的用户不会出现在结算表中。
                </p>
              </div>
            </div>
          ) : (
            <CommissionTree
              items={items}
              loading={summary.isFetching}
              onSaved={() =>
                queryClient.invalidateQueries({
                  queryKey: commissionSummaryKey,
                })
              }
            />
          )}
        </Card>
      </Main>
    </OperationsLayout>
  )
}
