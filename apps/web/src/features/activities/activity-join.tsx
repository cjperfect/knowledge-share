import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import type { Activity, ActivityInvite } from '@/interface/activity'
import { ApiError } from '@/util/request'
import {
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Ticket,
  UserRound,
} from 'lucide-react'
import { activityInvitesApi } from '@/api/activity-invites'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import './activity-join.css'
import { PosterDialog } from './poster-dialog'

const activityDate = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'full',
  timeZone: 'UTC',
})

const registrationPrefix = 'yantu.activity-registrations.v2.'
const signupReceiptPrefix = 'yantu.activity-signup-receipts.v1.'
const nameSchema = z.string().trim().min(1).max(50)
const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/)
const previewPhoneSchema = z.string().regex(/^\+?\d{7,15}$/)
const registrationSchema = z.object({
  name: nameSchema,
  phone: previewPhoneSchema,
})

const signupReceiptSchema = z.object({
  name: nameSchema,
  receipt: z.string().min(1),
})

interface Registration {
  name: string
  phone?: string
  receipt?: string
}

function readRegistration(activityId: string, preview: boolean): Registration {
  if (!preview) {
    try {
      const saved = localStorage.getItem(signupReceiptPrefix + activityId)
      if (saved) {
        const parsed = signupReceiptSchema.safeParse(JSON.parse(saved))
        if (parsed.success) return parsed.data
      }
    } catch {
      return { name: '' }
    }
    return { name: '' }
  }

  try {
    const saved = localStorage.getItem(registrationPrefix + activityId)
    if (saved) {
      const parsed = registrationSchema.safeParse(JSON.parse(saved))
      if (parsed.success) return parsed.data
    }

    const legacy = localStorage.getItem(
      'yantu.activity-registrations.v1.' + activityId
    )
    return { name: legacy?.trim().slice(0, 50) ?? '', phone: '' }
  } catch {
    return { name: '', phone: '' }
  }
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

function Signup({
  activity,
  token,
}: {
  activity: ActivityInvite
  token: string
}) {
  const preview = activity.registrationMode === 'preview'
  const legacy = activity.registrationMode === 'legacy'
  const [registration, setRegistration] = useState(() =>
    readRegistration(activity.id, preview)
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const registered = Boolean(
    registration.receipt || (preview && registration.phone)
  )

  function validatePhone(value: string) {
    const phone = value.replace(/[\s-]/g, '').replace(/^\+86/, '')
    const result = phoneSchema.safeParse(phone)
    setPhoneError(
      result.success
        ? ''
        : phone
          ? '请输入有效的 11 位手机号。'
          : '请输入手机号。'
    )
    return result
  }

  async function signup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || legacy) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const name = nameSchema.safeParse(fields.get('name'))
    if (!name.success) {
      setError('请输入你的姓名。')
      return
    }
    const phone = validatePhone(String(fields.get('phone') ?? ''))
    if (!phone.success) return
    const entry = { name: name.data, phone: phone.data }
    setError('')
    setSubmitting(true)
    try {
      if (preview) {
        localStorage.setItem(
          registrationPrefix + activity.id,
          JSON.stringify(entry)
        )
        setRegistration(entry)
      } else {
        const saved = await activityInvitesApi.signup(token, entry)
        setRegistration(saved)
        try {
          localStorage.setItem(
            signupReceiptPrefix + activity.id,
            JSON.stringify(saved)
          )
        } catch {
          // The current page can still use the receipt after the server has saved the signup.
        }
      }
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
    <Card className='w-full max-w-md min-w-0 gap-6 rounded-2xl py-7 shadow-sm sm:py-9'>
      <CardHeader className='gap-2 px-6 sm:px-8'>
        {activity.inviter && (
          <p className='text-sm wrap-anywhere text-blue-700 dark:text-blue-300'>
            邀请人：
            <strong className='font-semibold'>{activity.inviter}</strong>
          </p>
        )}
        <CardTitle>
          <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
            {registered ? '报名成功' : '报名参加'}
          </h2>
        </CardTitle>
        {!registered && (
          <CardDescription>
            {legacy
              ? '请向邀请人获取新报名链接。'
              : '填写姓名和手机号，提交本次活动报名。'}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className='px-6 sm:px-8'>
        {registered ? (
          <div className='space-y-4'>
            <p
              role='status'
              className='flex items-start gap-3 rounded-xl border bg-muted/65 p-4 text-sm leading-relaxed wrap-break-word'
            >
              <CheckCircle2
                className='mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400'
                aria-hidden='true'
              />
              {registration.name}，
              {preview ? '报名已保存在当前浏览器。' : '你已成功报名本场活动。'}
            </p>
            <div className='space-y-3 rounded-xl border bg-background p-4'>
              <div className='space-y-1'>
                <p className='font-medium'>邀请同学一起参加</p>
                <p className='text-xs leading-relaxed text-muted-foreground'>
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
          <form className='space-y-5' aria-busy={submitting} onSubmit={signup}>
            <div className='space-y-2'>
              <Label htmlFor='signup-name'>姓名</Label>
              <Input
                id='signup-name'
                className='h-11 rounded-lg'
                name='name'
                disabled={submitting}
                required
                maxLength={50}
                autoComplete='name'
                defaultValue={registration.name}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='signup-phone'>手机号</Label>
              <Input
                id='signup-phone'
                className='h-11 rounded-lg'
                name='phone'
                type='tel'
                disabled={submitting}
                required
                maxLength={25}
                autoComplete='tel'
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? 'signup-phone-error' : undefined}
                onBlur={(event) => validatePhone(event.target.value)}
                onChange={(event) => {
                  if (phoneError) validatePhone(event.target.value)
                }}
              />
              {phoneError && (
                <p
                  id='signup-phone-error'
                  role='alert'
                  className='text-sm text-destructive'
                >
                  {phoneError}
                </p>
              )}
            </div>
            {error && (
              <p role='alert' className='text-sm text-destructive'>
                {error}
              </p>
            )}
            <Button
              type='submit'
              size='lg'
              className='w-full rounded-lg'
              disabled={submitting}
            >
              {submitting ? '正在提交…' : '提交报名'}
            </Button>
            {preview && (
              <p className='text-xs text-muted-foreground'>
                当前为本地报名演示，记录保存在此浏览器。
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityHero({ activity }: { activity: Activity | null }) {
  return (
    <section className='relative isolate flex min-h-72 flex-col justify-between gap-9 overflow-hidden bg-slate-950 px-6 py-6 text-slate-50 sm:px-10 sm:py-8 lg:min-h-svh lg:px-12 lg:py-10 xl:px-16'>
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
          <GraduationCap className='size-5' aria-hidden='true' />
        </span>
        <span className='text-base font-semibold tracking-wide'>研途</span>
      </header>

      {activity && (
        <div className='max-w-3xl space-y-4 pb-1 sm:space-y-6 lg:pb-8'>
          <p className='inline-flex items-center gap-2 text-sm font-medium text-blue-100'>
            <span className='h-px w-6 bg-blue-200/80' aria-hidden='true' />
            保研知识分享
          </p>
          <h1 className='join-event-title text-[clamp(1.875rem,4.1vw,4.25rem)] leading-[1.16] font-bold wrap-break-word'>
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
                <CalendarDays
                  className='mt-0.5 size-4 shrink-0 text-blue-200'
                  aria-hidden='true'
                />
                <time dateTime={activity.date}>
                  {activityDate.format(new Date(activity.date + 'T00:00:00Z'))}
                </time>
              </dd>
            </div>
            <div className='flex min-w-0 items-start gap-2'>
              <dt className='flex shrink-0 items-start gap-2'>
                <Ticket
                  className='mt-0.5 size-4 shrink-0 text-blue-200'
                  aria-hidden='true'
                />
                价格
              </dt>
              <dd className='min-w-0 wrap-break-word'>
                {activity.price > 0 ? `¥${activity.price.toFixed(2)}` : '免费'}
              </dd>
            </div>
            {activity.sharer && (
              <div className='flex min-w-0 items-start gap-2'>
                <dt className='flex shrink-0 items-start gap-2'>
                  <UserRound
                    className='mt-0.5 size-4 shrink-0 text-blue-200'
                    aria-hidden='true'
                  />
                  分享人
                </dt>
                <dd className='min-w-0 wrap-break-word'>{activity.sharer}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </section>
  )
}

export function ActivityJoin({ token }: { token: string }) {
  const invite = useQuery({
    queryKey: ['activity-invite', token],
    queryFn: ({ signal }) => activityInvitesApi.resolve(token, signal),
    enabled: Boolean(token),
    retry: false,
  })
  const activity = invite.data ?? null
  const loading = Boolean(token) && invite.isPending
  const connectionError =
    invite.isError &&
    !(
      invite.error instanceof ApiError &&
      (invite.error.status === 400 || invite.error.status === 404)
    )

  return (
    <main className='grid min-h-svh min-w-0 lg:grid-cols-[1.2fr_1fr]'>
      <ActivityHero activity={activity} />
      <section
        aria-label='活动报名'
        className='flex min-w-0 items-center justify-center bg-[#f8f6f0] px-4 py-7 sm:px-8 sm:py-10 dark:bg-background'
      >
        {activity ? (
          <Signup
            key={`${activity.id}:${activity.registrationMode}`}
            activity={activity}
            token={token}
          />
        ) : (
          <Card className='w-full max-w-md min-w-0 rounded-2xl py-8 shadow-sm'>
            <CardHeader className='gap-2 px-6 sm:px-8'>
              <CardTitle>
                <h1 className='text-2xl font-semibold'>
                  {loading
                    ? '正在加载活动…'
                    : connectionError
                      ? '活动加载失败'
                      : '活动链接无效'}
                </h1>
              </CardTitle>
              {!loading && (
                <CardDescription>
                  {connectionError
                    ? invite.error.message
                    : '请向活动分享人获取最新的报名链接。'}
                </CardDescription>
              )}
            </CardHeader>
            {connectionError && (
              <CardContent>
                <Button variant='outline' onClick={() => invite.refetch()}>
                  重试
                </Button>
              </CardContent>
            )}
          </Card>
        )}
      </section>
    </main>
  )
}
