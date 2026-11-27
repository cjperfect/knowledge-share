'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { joinApi, JoinApiError } from './api'
import {
  CalendarIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  LoaderIcon,
  TicketIcon,
  UserRoundIcon,
} from './icons'
import { PosterDialog } from './poster-dialog'
import type { ActivityInvite } from './types'

const activityDate = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'full',
  timeZone: 'UTC',
})

const registrationPrefix = 'yantu.activity-registrations.v2.'
const signupReceiptPrefix = 'yantu.activity-signup-receipts.v1.'
const nameMaxLength = 50
const phonePattern = /^1[3-9]\d{9}$/

interface Registration {
  name: string
  phone?: string
  receipt?: string
}

function readRegistration(activityId: string, preview: boolean): Registration {
  if (typeof window === 'undefined') return { name: '' }

  try {
    if (!preview) {
      const saved = localStorage.getItem(signupReceiptPrefix + activityId)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Registration>
        if (
          typeof parsed.name === 'string' &&
          parsed.name.trim() &&
          typeof parsed.receipt === 'string' &&
          parsed.receipt
        ) {
          return {
            name: parsed.name.trim().slice(0, nameMaxLength),
            receipt: parsed.receipt,
          }
        }
      }
      return { name: '' }
    }

    const saved = localStorage.getItem(registrationPrefix + activityId)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<Registration>
      if (
        typeof parsed.name === 'string' &&
        parsed.name.trim() &&
        typeof parsed.phone === 'string' &&
        /^\+?\d{7,15}$/.test(parsed.phone)
      ) {
        return {
          name: parsed.name.trim().slice(0, nameMaxLength),
          phone: parsed.phone,
        }
      }
    }

    const legacy = localStorage.getItem(
      'yantu.activity-registrations.v1.' + activityId
    )
    return {
      name: (legacy ?? '').trim().slice(0, nameMaxLength),
      phone: '',
    }
  } catch {
    return { name: '' }
  }
}

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, '').replace(/^\+86/, '')
}

function celebrateRegistration(form: HTMLFormElement) {
  const bounds = form.getBoundingClientRect()
  const origin = {
    x: (bounds.left + bounds.width / 2) / window.innerWidth,
    y: (bounds.top + bounds.height * 0.65) / window.innerHeight,
  }

  void import('canvas-confetti')
    .then(({ default: confetti }) =>
      confetti({
        particleCount: 90,
        spread: 76,
        startVelocity: 34,
        origin,
        colors: ['#17385c', '#3b82c4', '#dfa749', '#569783', '#f5d49e'],
        zIndex: 30,
        disableForReducedMotion: true,
      })
    )
    .catch(() => {
      // The saved registration stays visible if the animation cannot load.
    })
}

function formatPrice(price: number) {
  return price > 0 ? `¥${price.toFixed(2)}` : '免费'
}

function ActivityHero({ activity }: { activity: ActivityInvite | null }) {
  return (
    <section className='relative isolate flex min-h-[72svh] flex-col justify-between gap-9 overflow-hidden bg-slate-950 px-6 py-6 text-slate-50 sm:px-10 sm:py-8 lg:min-h-svh lg:px-12 lg:py-10 xl:px-16'>
      <img
        src='/images/activity-signup-campus.webp'
        alt=''
        fetchPriority='high'
        width={1536}
        height={1024}
        className='absolute inset-0 -z-20 size-full object-cover object-[65%_45%]'
      />
      <div
        className='join-hero-shade absolute inset-0 -z-10'
        aria-hidden='true'
      />

      <header className='flex items-center gap-3'>
        <span className='grid size-9 place-items-center rounded-lg border border-white/25 bg-white/10'>
          <GraduationCapIcon className='size-5' />
        </span>
        <span className='text-base font-semibold tracking-wide'>研途</span>
      </header>

      {activity && (
        <div className='max-w-3xl space-y-4 pb-1 sm:space-y-6 lg:pb-8'>
          <p className='inline-flex items-center gap-2 text-sm font-medium text-blue-100'>
            <span className='h-px w-6 bg-blue-200/80' aria-hidden='true' />
            保研知识分享
          </p>
          <h1 className='join-event-title text-[clamp(1.875rem,4.1vw,4.25rem)] leading-[1.16] font-bold break-words'>
            {activity.name}
          </h1>
          {activity.summary && (
            <p className='max-w-2xl text-sm leading-relaxed text-blue-50/90 sm:text-base'>
              {activity.summary}
            </p>
          )}
          <dl className='flex flex-wrap gap-x-6 gap-y-3 border-t border-white/25 pt-4 text-sm leading-relaxed text-slate-100 sm:pt-5'>
            <div className='min-w-0'>
              <dt className='sr-only'>活动日期</dt>
              <dd className='flex items-start gap-2'>
                <CalendarIcon className='mt-0.5 size-4 shrink-0 text-blue-200' />
                <time dateTime={activity.date}>
                  {activityDate.format(new Date(activity.date + 'T00:00:00Z'))}
                </time>
              </dd>
            </div>
            <div className='flex min-w-0 items-start gap-2'>
              <dt className='flex shrink-0 items-start gap-2'>
                <TicketIcon className='mt-0.5 size-4 shrink-0 text-blue-200' />
                价格
              </dt>
              <dd className='min-w-0 break-words'>
                {formatPrice(activity.price)}
              </dd>
            </div>
            {activity.sharer && (
              <div className='flex min-w-0 items-start gap-2'>
                <dt className='flex shrink-0 items-start gap-2'>
                  <UserRoundIcon className='mt-0.5 size-4 shrink-0 text-blue-200' />
                  分享人
                </dt>
                <dd className='min-w-0 break-words'>{activity.sharer}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </section>
  )
}

function Signup({
  activity,
  token,
}: {
  activity: ActivityInvite
  token: string
}) {
  const preview = activity.registrationMode === 'preview'
  const legacy = activity.registrationMode === 'legacy'
  const [registration, setRegistration] = useState<Registration>({ name: '' })
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const registered = Boolean(
    registration.receipt || (preview && registration.phone)
  )

  useEffect(() => {
    const saved = readRegistration(activity.id, preview)
    setRegistration(saved)
    setName(saved.name)
    setPhone(saved.phone ?? '')
  }, [activity.id, preview])

  function validatePhone(value: string) {
    const normalized = normalizePhone(value)
    const valid = phonePattern.test(normalized)
    setPhoneError(
      valid ? '' : normalized ? '请输入有效的 11 位手机号。' : '请输入手机号。'
    )
    return valid
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || legacy) return

    const form = event.currentTarget
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('请输入你的姓名。')
      return
    }
    if (Array.from(trimmedName).length > nameMaxLength) {
      setError(`姓名不能超过 ${nameMaxLength} 个字。`)
      return
    }
    const normalizedPhone = normalizePhone(phone)
    if (!validatePhone(phone)) return

    setError('')
    setSubmitting(true)
    try {
      if (preview) {
        const entry = { name: trimmedName, phone: normalizedPhone }
        try {
          localStorage.setItem(
            registrationPrefix + activity.id,
            JSON.stringify(entry)
          )
        } catch {
          // The current page can still show success after local storage is unavailable.
        }
        setRegistration(entry)
      } else {
        const saved = await joinApi.signup(token, {
          name: trimmedName,
          phone: normalizedPhone,
        })
        const receipt = { name: saved.name, receipt: saved.receipt }
        setRegistration(receipt)
        try {
          localStorage.setItem(
            signupReceiptPrefix + activity.id,
            JSON.stringify(receipt)
          )
        } catch {
          // The current page can still use the receipt after the server has saved the signup.
        }
      }
      setName(trimmedName)
      celebrateRegistration(form)
    } catch (failure) {
      setError(
        preview
          ? '报名保存失败，请检查浏览器设置后重试。'
          : failure instanceof Error
            ? failure.message
            : '报名失败，请重试。'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='w-full max-w-md min-w-0 rounded-[24px] bg-white p-6 shadow-[0_18px_50px_rgba(16,24,40,0.08)] sm:p-8'>
      <div className='space-y-2'>
        {activity.inviter && (
          <p className='text-sm break-words text-blue-700'>
            邀请人：
            <strong className='font-semibold'>{activity.inviter}</strong>
          </p>
        )}
        <h2 className='text-2xl font-semibold tracking-tight text-ink sm:text-3xl'>
          {registered ? '报名成功' : '报名参加'}
        </h2>
        {!registered && (
          <p className='text-sm leading-6 text-muted'>
            {legacy
              ? '请向邀请人获取新报名链接。'
              : '填写姓名和手机号，提交本次活动报名。'}
          </p>
        )}
      </div>

      {registered ? (
        <div className='mt-6 space-y-4'>
          <p
            role='status'
            className='flex items-start gap-3 rounded-2xl border border-line bg-soft p-4 text-sm leading-relaxed break-words'
          >
            <CheckCircleIcon className='mt-0.5 size-5 shrink-0 text-emerald-700' />
            {registration.name}，
            {preview ? '报名已保存在当前浏览器。' : '你已成功报名本场活动。'}
          </p>
          <div className='space-y-3 rounded-2xl border border-line bg-white p-4'>
            <div className='space-y-1'>
              <p className='font-medium text-ink'>邀请同学一起参加</p>
              <p className='text-xs leading-relaxed text-muted'>
                海报会带上你的名字，分享给同学扫码即可报名。
              </p>
            </div>
            <PosterDialog
              activity={activity}
              inviter={registration.name}
              receipt={registration.receipt}
            />
          </div>
        </div>
      ) : legacy ? null : (
        <form
          className='mt-6 space-y-5'
          aria-busy={submitting}
          onSubmit={submit}
        >
          <div className='space-y-2'>
            <label
              htmlFor='signup-name'
              className='text-sm font-medium text-ink'
            >
              姓名
            </label>
            <input
              id='signup-name'
              className='h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15'
              name='name'
              disabled={submitting}
              required
              maxLength={nameMaxLength}
              autoComplete='name'
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <label
              htmlFor='signup-phone'
              className='text-sm font-medium text-ink'
            >
              手机号
            </label>
            <input
              id='signup-phone'
              className='h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15'
              name='phone'
              type='tel'
              disabled={submitting}
              required
              maxLength={25}
              autoComplete='tel'
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? 'signup-phone-error' : undefined}
              value={phone}
              onBlur={(event) => validatePhone(event.target.value)}
              onChange={(event) => {
                setPhone(event.target.value)
                if (phoneError) validatePhone(event.target.value)
              }}
            />
            {phoneError && (
              <p
                id='signup-phone-error'
                role='alert'
                className='text-sm text-red-600'
              >
                {phoneError}
              </p>
            )}
          </div>
          {error && (
            <p role='alert' className='text-sm text-red-600'>
              {error}
            </p>
          )}
          <button
            type='submit'
            className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-blue px-5 text-[14px] font-medium text-white transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-55'
            disabled={submitting}
          >
            {submitting && <LoaderIcon className='size-4 animate-spin' />}
            {submitting ? '正在提交…' : '提交报名'}
          </button>
          {preview && (
            <p className='text-xs leading-5 text-muted'>
              当前为本地报名演示，记录保存在此浏览器。
            </p>
          )}
        </form>
      )}
    </div>
  )
}

export function ActivityJoin({ token }: { token: string }) {
  const [activity, setActivity] = useState<ActivityInvite | null>(null)
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'invalid' | 'error'
  >(token ? 'loading' : 'invalid')
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    const controller = new AbortController()
    let cancelled = false
    setStatus('loading')
    setError('')

    joinApi
      .resolve(token, controller.signal)
      .then((resolved) => {
        if (cancelled) return
        setActivity(resolved)
        setStatus('ready')
      })
      .catch((failure: unknown) => {
        if (cancelled) return
        if (failure instanceof Error && failure.name === 'AbortError') return
        if (
          failure instanceof JoinApiError &&
          (failure.status === 400 || failure.status === 404)
        ) {
          setStatus('invalid')
          return
        }
        setStatus('error')
        setError(
          failure instanceof Error
            ? failure.message
            : '活动加载失败，请稍后重试。'
        )
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [retryKey, token])

  const loading = status === 'loading'

  return (
    <main className='grid min-h-svh min-w-0 bg-[#f8f6f0] lg:grid-cols-[1.2fr_1fr]'>
      <ActivityHero activity={activity} />
      <section
        aria-label='活动报名'
        className='flex min-w-0 items-center justify-center px-4 py-7 sm:px-8 sm:py-10'
      >
        {activity ? (
          <Signup
            key={`${activity.id}:${activity.registrationMode}`}
            activity={activity}
            token={token}
          />
        ) : (
          <div className='w-full max-w-md min-w-0 rounded-[24px] bg-white p-6 shadow-[0_18px_50px_rgba(16,24,40,0.08)] sm:p-8'>
            <h1 className='text-2xl font-semibold text-ink'>
              {loading
                ? '正在加载活动…'
                : status === 'error'
                  ? '活动加载失败'
                  : '活动链接无效'}
            </h1>
            {!loading && (
              <p className='mt-2 text-sm leading-6 text-muted'>
                {status === 'error'
                  ? error
                  : '请向活动分享人获取最新的报名链接。'}
              </p>
            )}
            {status === 'error' && (
              <button
                type='button'
                className='mt-5 inline-flex h-11 items-center justify-center rounded-full border border-line bg-white px-5 text-[14px] font-medium text-ink transition hover:bg-soft'
                onClick={() => setRetryKey((value) => value + 1)}
              >
                重试
              </button>
            )}
            {loading && (
              <div className='mt-6 flex items-center gap-2 text-sm text-muted'>
                <LoaderIcon className='size-4 animate-spin' />
                正在获取活动信息
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
