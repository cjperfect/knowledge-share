import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ChevronLeft } from '@/components/icons'
import { Markdown } from '@/components/markdown'
import { buttonClassName, Eyebrow, iconSm, PageShell } from '@/components/ui'
import {
  activityBanner,
  activityPriceLabel,
  getActivities,
  getActivityById,
  isActivityEnded,
} from '@/lib/content'
import {
  dateParts,
  daysUntil,
  formatDateLong,
  isToday,
  isUpcoming,
} from '@/lib/format'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateStaticParams() {
  const activities = await getActivities()
  return activities.map((activity) => ({ id: activity.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const activity = await getActivityById(id)
  if (!activity) return { title: '活动回顾不存在' }
  return {
    title: activity.name,
    description: activity.summary,
  }
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const activity = await getActivityById(id)
  if (!activity) notFound()

  const upcomingRaw = isUpcoming(activity.date)
  const todayRaw = isToday(activity.date)
  const ended = isActivityEnded(activity.status) || (!upcomingRaw && !todayRaw)
  const upcoming = !ended && upcomingRaw
  const days = daysUntil(activity.date)
  const banner = activityBanner(activity)
  const parts = dateParts(activity.date)
  const markdown = activity.contentMarkdown?.trim() ?? ''

  return (
    <main className='bg-white'>
      <section className='bg-[image:radial-gradient(55%_90%_at_82%_8%,rgba(0,113,227,0.32),transparent_64%),radial-gradient(40%_80%_at_8%_100%,rgba(90,200,250,0.08),transparent_70%)] bg-dark pb-[52px] pt-[30px] text-[#f5f5f7] min-[521px]:pb-[66px] min-[521px]:pt-[44px] min-[821px]:pb-24 min-[821px]:pt-[66px]'>
        <PageShell>
          <Link
            className='mb-[34px] inline-flex items-center gap-1 text-[13px] text-white/60 transition-colors hover:text-white min-[821px]:mb-[54px]'
            href='/activities'
          >
            <ChevronLeft className={iconSm} />
            全部活动回顾
          </Link>

          <div className='grid gap-7 min-[521px]:gap-9 min-[821px]:grid-cols-[210px_minmax(0,1fr)_280px] min-[821px]:items-center min-[821px]:gap-12'>
            <div
              className='flex flex-row items-baseline gap-[9px] border-b border-white/15 pb-[22px] min-[821px]:flex-col min-[821px]:items-start min-[821px]:border-b-0 min-[821px]:border-r min-[821px]:pb-0 min-[821px]:pr-10'
              aria-label={formatDateLong(activity.date)}
            >
              <span className='text-[12px] tracking-[0.12em] text-white/50'>
                {parts.month} 月
              </span>
              <span className='mt-1 text-[64px] font-semibold leading-[0.82] tracking-[-0.085em] text-white tabular-nums min-[521px]:text-[78px] min-[821px]:mt-1 min-[821px]:text-[132px]'>
                {parts.day}
              </span>
              <span className='ml-auto mt-0 text-[10px] tracking-[0.16em] text-white/40 min-[821px]:ml-0 min-[821px]:mt-[18px]'>
                {parts.year}
              </span>
            </div>

            <div>
              <Eyebrow light>
                {ended
                  ? '活动回顾'
                  : upcoming
                    ? `即将开始 · ${days} 天后`
                    : '今天 · 即将开始'}
              </Eyebrow>
              <h1 className='mt-5 max-w-[820px] text-[clamp(36px,8.2vw,54px)] leading-[1.02] tracking-[-0.065em] min-[821px]:text-[clamp(44px,5.4vw,72px)]'>
                {activity.name}
              </h1>
              <p className='mt-[26px] max-w-[720px] text-[15px] leading-[1.7] text-[#a1a1a6] min-[821px]:text-[17px]'>
                {activity.summary}
              </p>

              <dl className='mt-9 flex flex-wrap gap-[34px] border-t border-white/10 pt-6'>
                <div className='grid gap-1.5'>
                  <dt className='text-[10px] tracking-[0.1em] text-white/40'>
                    分享人
                  </dt>
                  <dd className='text-[14px] text-white/85'>
                    {activity.sharer}
                  </dd>
                </div>
                <div className='grid gap-1.5'>
                  <dt className='text-[10px] tracking-[0.1em] text-white/40'>
                    日期
                  </dt>
                  <dd className='text-[14px] text-white/85'>
                    {formatDateLong(activity.date)}
                  </dd>
                </div>
                <div className='grid gap-1.5'>
                  <dt className='text-[10px] tracking-[0.1em] text-white/40'>
                    价格
                  </dt>
                  <dd className='text-[14px] text-white/85'>
                    {activityPriceLabel(activity.price)}
                  </dd>
                </div>
                {activity.signupCount > 0 && (
                  <div className='grid gap-1.5'>
                    <dt className='text-[10px] tracking-[0.1em] text-white/40'>
                      报名人数
                    </dt>
                    <dd className='text-[14px] text-white/85'>
                      {activity.signupCount} 人
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className='w-full overflow-hidden rounded-[14px] border border-white/15 bg-white/5 shadow-[0_22px_54px_rgba(0,0,0,0.28)] min-[821px]:rounded-[16px]'>
              <img
                className='block aspect-[16/6] max-h-[200px] w-full object-cover min-[521px]:aspect-[16/6.5] min-[521px]:max-h-[260px] min-[821px]:aspect-[16/10] min-[821px]:max-h-none'
                src={banner}
                alt={`${activity.name}活动封面`}
              />
            </div>
          </div>
        </PageShell>
      </section>

      <section className='bg-white py-[88px] min-[821px]:py-[124px]'>
        <PageShell className='grid gap-[34px] min-[821px]:grid-cols-[180px_minmax(0,1fr)] min-[821px]:gap-12 min-[1081px]:grid-cols-[220px_minmax(0,760px)] min-[1081px]:gap-20'>
          <aside className='grid gap-4'>
            <Eyebrow>关于这场活动</Eyebrow>
            <p className='text-[13px] leading-[1.7] text-muted'>
              活动信息由研途运营团队发布。最新安排以主办方通知为准。
            </p>
          </aside>

          <div>
            <h2 className='text-[30px] leading-[1.1] tracking-[-0.055em] min-[821px]:text-[clamp(34px,4vw,50px)]'>
              {markdown ? '活动回顾' : '这一次，我们聊什么'}
            </h2>
            <p className='mt-[30px] text-[21px] leading-[1.55] tracking-[-0.035em] text-ink min-[821px]:text-[25px]'>
              {activity.summary}
            </p>
            {markdown ? (
              <div className='mt-8'>
                <Markdown content={markdown} />
              </div>
            ) : (
              <p className='mt-[22px] max-w-[700px] text-[16px] leading-[1.8] text-ink-soft min-[821px]:text-[17px]'>
                分享会围绕一个具体问题展开，把经验拆成可以理解、可以带走的方法。
                你可以带着自己的材料、疑问和卡点来，在交流环节一起拆解。
              </p>
            )}
          </div>
        </PageShell>
      </section>

      <section className='bg-dark py-[72px] text-[#f5f5f7] min-[821px]:py-[124px]'>
        <PageShell className='flex flex-col items-start justify-between gap-8 min-[821px]:flex-row min-[821px]:items-center min-[821px]:gap-10'>
          <div>
            <Eyebrow light>继续看看</Eyebrow>
            <h2 className='mt-[18px] text-[clamp(38px,8.2vw,52px)] leading-[1.05] tracking-[-0.06em] min-[821px]:text-[clamp(38px,4.4vw,58px)]'>
              还有更多
              <br />
              值得听的故事。
            </h2>
          </div>
          <Link className={buttonClassName('light')} href='/activities'>
            返回活动回顾
            <ArrowRight className={iconSm} />
          </Link>
        </PageShell>
      </section>
    </main>
  )
}
