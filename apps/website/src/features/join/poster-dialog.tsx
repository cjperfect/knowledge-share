'use client'

import { useEffect, useRef, useState } from 'react'
import { joinApi, JoinApiError } from './api'
import {
  drawActivityPoster,
  posterHeight,
  posterWidth,
} from './activity-poster'
import {
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  LoaderIcon,
  QrCodeIcon,
} from './icons'
import type { ActivityInvite, ActivityPosterQr, PosterTemplate } from './types'
import { usePosterTemplateImage } from './use-poster-template-image'

function copyWithSelection(text: string, trigger: HTMLButtonElement) {
  const field = document.createElement('textarea')
  field.value = text
  field.readOnly = true
  field.className = 'fixed inset-0 size-px opacity-0'
  trigger.parentElement?.append(field)
  field.select()
  try {
    return document.execCommand('copy')
  } finally {
    field.remove()
    trigger.focus()
  }
}

function PosterModal({
  activity,
  inviter,
  receipt,
  onClose,
}: {
  activity: ActivityInvite
  inviter: string
  receipt?: string
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [qr, setQr] = useState<ActivityPosterQr>()
  const [template, setTemplate] = useState<PosterTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'manual'>('idle')
  const [copied, setCopied] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const templateImage = usePosterTemplateImage(template?.image)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    setLoading(true)
    setError('')
    setQr(undefined)

    const payload = {
      id: activity.id,
      name: activity.name,
      date: activity.date,
      sharer: activity.sharer,
      summary: activity.summary,
      price: activity.price,
      inviter,
      receipt,
    }

    void Promise.allSettled([
      joinApi.personalQr(payload, controller.signal),
      joinApi.activeTemplate(controller.signal),
    ]).then(([qrResult, templateResult]) => {
      if (cancelled) return
      if (qrResult.status === 'fulfilled') {
        setQr(qrResult.value)
      } else {
        const failure = qrResult.reason
        if (!(failure instanceof Error && failure.name === 'AbortError')) {
          setError(
            failure instanceof JoinApiError
              ? failure.message
              : '海报二维码生成失败，请重试。'
          )
        }
      }
      if (templateResult.status === 'fulfilled') {
        setTemplate(templateResult.value)
      } else {
        setTemplate(null)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    activity.date,
    activity.id,
    activity.name,
    activity.price,
    activity.sharer,
    activity.summary,
    inviter,
    receipt,
    reloadKey,
  ])

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (!context || loading) return
    drawActivityPoster(
      context,
      {
        name: activity.name,
        summary: activity.summary,
        date: activity.date,
        sharer: activity.sharer,
        price: activity.price,
      },
      qr,
      inviter,
      { image: templateImage }
    )
  }, [activity, inviter, loading, qr, templateImage])

  const joinUrl = qr?.url
  let isLocalAddress = false
  if (joinUrl) {
    try {
      isLocalAddress = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0'].includes(
        new URL(joinUrl).hostname
      )
    } catch {
      isLocalAddress = false
    }
  }

  async function copyLink(trigger: HTMLButtonElement) {
    if (!joinUrl) return
    let copied = false
    if (navigator.clipboard) {
      copied = await navigator.clipboard.writeText(joinUrl).then(
        () => true,
        () => false
      )
    }
    if (!copied) {
      try {
        copied = copyWithSelection(joinUrl, trigger)
      } catch {
        copied = false
      }
    }
    setCopyStatus(copied ? 'idle' : 'manual')
    setCopied(copied)
    if (copied) {
      window.setTimeout(() => setCopied(false), 2200)
    }
  }

  function downloadPoster() {
    if (!qr) return
    const canvas = canvasRef.current
    if (!canvas?.getContext('2d')) {
      setError('当前浏览器无法生成海报。')
      return
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('海报导出失败，请重试。')
        return
      }
      const url = URL.createObjectURL(blob)
      const download = document.createElement('a')
      const title = Array.from(activity.name.replace(/[<>:"/\\|?*]/g, '-'))
        .slice(0, 55)
        .join('')
      download.href = url
      download.download = `${title}-${activity.date}-专属-海报.png`
      document.body.append(download)
      download.click()
      download.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  return (
    <div
      className='fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='invite-poster-title'
        className='flex max-h-[calc(100dvh-0px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[24px]'
      >
        <header className='flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6'>
          <div className='min-w-0'>
            <h2
              id='invite-poster-title'
              className='text-[18px] font-semibold text-ink'
            >
              生成专属海报
            </h2>
            <p className='mt-1 text-[13px] leading-6 text-muted'>
              海报会标注「{inviter} 邀请」，分享给同学扫码即可报名。
            </p>
          </div>
          <button
            ref={closeRef}
            type='button'
            aria-label='关闭'
            className='grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-ink'
            onClick={onClose}
          >
            <CloseIcon className='size-5' />
          </button>
        </header>

        <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6'>
          <figure className='m-0 rounded-2xl border border-line bg-soft p-3 sm:p-4'>
            <figcaption className='mb-3 text-[13px] font-medium text-ink'>
              海报预览
            </figcaption>
            <canvas
              ref={canvasRef}
              width={posterWidth}
              height={posterHeight}
              role='img'
              aria-label={`活动海报：${activity.name}，分享人：${activity.sharer || '未填写'}，活动日期：${activity.date}${activity.summary ? `，活动概要：${activity.summary}` : ''}，专属邀请人：${inviter}${qr ? '' : '，二维码待生成'}`}
              className='mx-auto block h-auto max-h-[58dvh] w-auto max-w-full rounded-md shadow-sm'
            />
          </figure>

          <div className='mt-4 flex flex-wrap gap-2'>
            <button
              type='button'
              className='inline-flex h-11 min-w-[9.5rem] flex-1 items-center justify-center gap-2 rounded-full bg-blue px-5 text-[14px] font-medium text-white transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-55'
              onClick={() => {
                if (qr) downloadPoster()
                else setReloadKey((value) => value + 1)
              }}
              disabled={loading}
            >
              {loading ? (
                <LoaderIcon className='size-4 animate-spin' />
              ) : qr ? (
                <DownloadIcon className='size-4' />
              ) : (
                <QrCodeIcon className='size-4' />
              )}
              {loading ? '正在制作…' : qr ? '下载海报' : '重试生成'}
            </button>
            <button
              type='button'
              className='inline-flex h-11 min-w-[9.5rem] flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white px-5 text-[14px] font-medium text-ink transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-55'
              onClick={(event) => void copyLink(event.currentTarget)}
              disabled={!joinUrl}
            >
              <CopyIcon className='size-4' />
              复制活动链接
            </button>
          </div>

          {copyStatus === 'manual' && joinUrl && (
            <div className='mt-3 space-y-2'>
              <p role='status' className='text-xs leading-5 text-muted'>
                浏览器未开放剪贴板，请选中链接手动复制。
              </p>
              <input
                aria-label='活动报名链接'
                value={joinUrl}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
                className='h-10 w-full rounded-xl border border-line bg-white px-3 text-xs text-ink outline-none'
              />
            </div>
          )}

          {copied && (
            <p role='status' className='mt-3 text-xs text-muted'>
              链接已复制。
            </p>
          )}
          {isLocalAddress && (
            <p className='mt-2 text-xs leading-5 text-muted'>
              当前链接使用本机地址。请从手机可访问的网址打开活动页后再生成海报。
            </p>
          )}
          <p className='mt-2 text-xs text-muted'>
            PNG · {posterWidth} × {posterHeight}
          </p>
          {error && (
            <p role='alert' className='mt-2 text-sm text-red-600'>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function PosterDialog({
  activity,
  inviter,
  receipt,
}: {
  activity: ActivityInvite
  inviter: string
  receipt?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type='button'
        className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-blue px-5 text-[14px] font-medium text-white transition hover:bg-[#0077ed]'
        onClick={() => setOpen(true)}
      >
        <QrCodeIcon className='size-4' />
        生成专属海报
      </button>
      {open && (
        <PosterModal
          activity={activity}
          inviter={inviter}
          receipt={receipt}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
