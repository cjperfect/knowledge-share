import { useLayoutEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Activity, ActivityPosterQr } from '@/interface/activity'
import { cn } from '@/util/utils'
import { Copy, Download, Loader2, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { activityInvitesApi } from '@/api/activity-invites'
import { posterTemplatesApi } from '@/api/poster-templates'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePosterTemplateImage } from '@/features/poster-templates/use-poster-template-image'
import {
  drawActivityPoster,
  posterHeight,
  posterWidth,
} from './activity-poster'

function copyWithSelection(text: string, trigger: HTMLButtonElement) {
  const field = document.createElement('textarea')
  field.value = text
  field.readOnly = true
  field.className = 'fixed inset-0 size-px opacity-0'
  trigger.parentElement?.append(field)
  field.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
    trigger.focus()
  }
}

interface GeneratedQr {
  key: string
  qr: ActivityPosterQr
}

function PosterEditor({
  activity,
  inviter,
  receipt,
}: {
  activity: Activity
  inviter?: string
  receipt?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')
  const [title, setTitle] = useState(activity.name)
  const [summary, setSummary] = useState(activity.summary)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'manual'>('idle')
  const posterTitle = title.trim() || activity.name
  const posterSummary = summary.trim()
  const [generatedQr, setGeneratedQr] = useState<GeneratedQr>()
  const [makingPoster, setMakingPoster] = useState(false)
  const draftKey = JSON.stringify([
    activity.id,
    activity.name,
    activity.date,
    activity.sharer,
    posterTitle,
    posterSummary,
    inviter,
    activity.price,
  ])
  const { id, name, date, sharer } = activity
  const invite = {
    id,
    name,
    date,
    sharer,
    status: activity.status,
    summary: posterSummary,
    price: activity.price,
    inviter,
    receipt,
  }
  const personalQr = useQuery({
    queryKey: ['activity-poster-qr', invite],
    queryFn: ({ signal }) => activityInvitesApi.qr(invite, signal),
    enabled: Boolean(inviter),
    refetchOnWindowFocus: false,
    retry: false,
  })
  const generating = makingPoster || (Boolean(inviter) && personalQr.isFetching)
  const qr = inviter
    ? personalQr.data
    : generatedQr?.key === draftKey
      ? generatedQr.qr
      : undefined
  const template = useQuery({
    queryKey: ['poster-template-active'],
    queryFn: ({ signal }) => posterTemplatesApi.active(signal),
    refetchOnWindowFocus: false,
    retry: false,
  })
  const posterError = error || (inviter ? personalQr.error?.message : undefined)
  const joinUrl = qr?.url
  const isLocalAddress = [
    'localhost',
    '127.0.0.1',
    '[::1]',
    '0.0.0.0',
  ].includes(joinUrl ? new URL(joinUrl).hostname : '')

  const templateImage = usePosterTemplateImage(template.data?.image)

  useLayoutEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (context) {
      drawActivityPoster(
        context,
        {
          name: posterTitle,
          summary: posterSummary,
          date,
          sharer,
          price: activity.price,
        },
        qr,
        inviter,
        { image: templateImage }
      )
    }
  }, [
    activity.price,
    date,
    inviter,
    posterSummary,
    posterTitle,
    qr,
    sharer,
    templateImage,
  ])

  async function makePoster() {
    if (generating) return

    setError('')
    setMakingPoster(true)
    try {
      const qr = await activityInvitesApi.organizerQr(activity.id)
      setGeneratedQr({ key: draftKey, qr })
      setCopyStatus('idle')
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : '海报制作失败，请重试。'
      )
    } finally {
      setMakingPoster(false)
    }
  }

  async function copyLink(trigger: HTMLButtonElement) {
    if (!joinUrl) return
    const copied = navigator.clipboard
      ? await navigator.clipboard.writeText(joinUrl).then(
          () => true,
          () => false
        )
      : false
    if (copied || copyWithSelection(joinUrl, trigger)) {
      setCopyStatus('idle')
      toast.success('活动链接已复制')
    } else {
      setCopyStatus('manual')
    }
  }

  function downloadPoster() {
    if (!qr) return
    const canvas = canvasRef.current
    if (!canvas?.getContext('2d')) {
      setError('当前浏览器无法生成海报。')
      return
    }

    setError('')
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('海报导出失败，请重试。')
        return
      }
      const url = URL.createObjectURL(blob)
      const download = document.createElement('a')
      const title = Array.from(posterTitle.replace(/[<>:"/\\|?*]/g, '-'))
        .slice(0, 55)
        .join('')
      download.href = url
      download.download = `${title}-${date}${inviter ? '-专属' : ''}-海报.png`
      document.body.append(download)
      download.click()
      download.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  function runPrimaryAction() {
    if (qr) downloadPoster()
    else if (inviter) void personalQr.refetch()
    else void makePoster()
  }

  const details = [
    { label: '分享人', value: activity.sharer || '—' },
    { label: '活动日期', value: activity.date },
    {
      label: '活动价格',
      value: activity.price > 0 ? `¥${activity.price.toFixed(2)}` : '免费',
    },
  ]

  return (
    <div
      className={cn(
        'grid gap-5',
        !inviter && 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-6'
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-col justify-between gap-5',
          inviter && 'order-last'
        )}
      >
        {!inviter && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='poster-title'>海报标题</Label>
              <Input
                id='poster-title'
                maxLength={50}
                value={title}
                disabled={generating}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-2'>
                <Label htmlFor='poster-summary'>活动概要</Label>
                <span className='text-xs text-muted-foreground tabular-nums'>
                  {posterSummary.length}/100 字
                </span>
              </div>
              <Textarea
                id='poster-summary'
                rows={3}
                maxLength={100}
                value={summary}
                disabled={generating}
                onChange={(event) => setSummary(event.target.value)}
              />
              <p className='text-xs text-muted-foreground'>
                仅用于当前海报，不会修改活动概要。
              </p>
            </div>
            <dl className='divide-y rounded-lg border px-4'>
              {details.map(({ label, value }) => (
                <div key={label} className='py-3'>
                  <dt className='text-sm text-muted-foreground'>{label}</dt>
                  <dd className='mt-1 text-sm font-medium wrap-break-word'>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <div className='space-y-2'>
          <div
            className={cn(
              'flex flex-wrap gap-2',
              inviter && 'sm:justify-center'
            )}
          >
            <Button
              type='button'
              className='w-full sm:w-auto'
              onClick={runPrimaryAction}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className='animate-spin' />
              ) : qr ? (
                <Download />
              ) : (
                <QrCode />
              )}
              {generating
                ? '正在制作…'
                : qr
                  ? '下载海报'
                  : inviter
                    ? '重试生成'
                    : '制作海报'}
            </Button>
            <Button
              type='button'
              variant='outline'
              className='w-full sm:w-auto'
              onClick={(event) => void copyLink(event.currentTarget)}
              disabled={!joinUrl}
            >
              <Copy />
              复制活动链接
            </Button>
          </div>
          {copyStatus === 'manual' && joinUrl && (
            <div className='space-y-2'>
              <p role='status' className='text-xs text-muted-foreground'>
                浏览器未开放剪贴板，请选中链接手动复制。
              </p>
              <Input
                aria-label='活动报名链接'
                value={joinUrl}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          )}
          {isLocalAddress && (
            <p className='text-xs leading-relaxed text-muted-foreground'>
              当前链接使用本机地址。请从手机可访问的网址打开活动页后再生成海报。
            </p>
          )}
          {!inviter && (
            <p className='text-xs text-muted-foreground'>
              PNG · {posterWidth} × {posterHeight}
            </p>
          )}
          {posterError && (
            <p role='alert' className='text-sm text-destructive'>
              {posterError}
            </p>
          )}
        </div>
      </div>
      <figure className='min-w-0 rounded-xl border bg-muted/45 p-3 sm:p-4'>
        <figcaption className='mb-3 text-sm font-medium'>海报预览</figcaption>
        <canvas
          ref={canvasRef}
          width={posterWidth}
          height={posterHeight}
          role='img'
          aria-label={`活动海报：${posterTitle}，分享人：${sharer || '未填写'}，活动日期：${date}${posterSummary ? `，活动概要：${posterSummary}` : ''}${inviter ? `，专属邀请人：${inviter}` : ''}${qr ? '' : '，二维码待制作'}`}
          className='mx-auto block h-auto max-h-[65dvh] w-auto max-w-full rounded-sm shadow-sm'
        />
      </figure>
    </div>
  )
}

export function PosterDialog({
  activity,
  inviter,
  receipt,
}: {
  activity: Activity
  inviter?: string
  receipt?: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {inviter ? (
          <Button size='lg' className='w-full rounded-lg'>
            <QrCode />
            生成专属海报
          </Button>
        ) : (
          <button
            type='button'
            className='text-xs font-normal text-muted-foreground transition-colors hover:text-foreground'
          >
            制作海报
          </button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          'flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0',
          inviter ? 'sm:max-w-lg' : 'sm:max-w-3xl'
        )}
      >
        <DialogHeader className='shrink-0 border-b px-6 py-4 pe-12 text-left'>
          <DialogTitle>{inviter ? '生成专属海报' : '制作海报'}</DialogTitle>
          <DialogDescription>
            {inviter
              ? `海报会标注「${inviter} 邀请」并展示活动概要，分享给同学扫码即可报名。`
              : '编辑海报标题和概要，制作后可下载海报或复制活动链接。'}
          </DialogDescription>
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-y-auto p-6'>
          <PosterEditor
            activity={activity}
            inviter={inviter}
            receipt={receipt}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
