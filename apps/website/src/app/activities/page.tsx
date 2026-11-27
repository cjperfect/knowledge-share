import type { Metadata } from 'next'
import { ActivityCard } from '@/components/activity-card'
import { PageHero } from '@/components/page-hero'
import { Pagination, resolvePage } from '@/components/pagination'
import { PageShell } from '@/components/ui'
import { getActivities, isActivityEnded } from '@/lib/content'
import { isUpcoming } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '活动回顾',
  description: '研途活动回顾：保研定位、申请材料、面试模拟与真实经验分享。',
}

const pageSize = 4

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const { page } = await searchParams
  const activities = await getActivities()
  const upcoming = activities
    .filter(
      (activity) =>
        !isActivityEnded(activity.status) && isUpcoming(activity.date)
    )
    .sort((a, b) => a.date.localeCompare(b.date))
  const past = activities
    .filter(
      (activity) =>
        isActivityEnded(activity.status) || !isUpcoming(activity.date)
    )
    .sort((a, b) => b.date.localeCompare(a.date))

  const allActivities = [...upcoming, ...past]
  const totalPages = Math.max(1, Math.ceil(allActivities.length / pageSize))
  const currentPage = resolvePage(page, totalPages)
  const pageActivities = allActivities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const pageUpcoming = pageActivities.filter(
    (activity) => !isActivityEnded(activity.status) && isUpcoming(activity.date)
  )
  const pagePast = pageActivities.filter(
    (activity) =>
      !(!isActivityEnded(activity.status) && isUpcoming(activity.date))
  )

  return (
    <main>
      <PageHero
        tone='dark'
        eyebrow='研途活动回顾'
        index='REVIEWS / 02'
        title={
          <h1>
            把经验，
            <br />
            变成可以带走的
            <br />
            <span className='text-blue-bright'>判断。</span>
          </h1>
        }
        aside={
          <p>
            分享、工作坊和模拟夜。每一场都围绕一个具体问题展开，
            不绕弯子，也不制造新的焦虑。
          </p>
        }
      />

      <section className='bg-white pb-[88px] pt-12 min-[821px]:pb-[124px] min-[821px]:pt-16'>
        <PageShell>
          {pageUpcoming.length > 0 && (
            <>
              <div className='flex items-center justify-between gap-5 border-b border-line pb-3.5'>
                <p className='text-[10px] font-semibold uppercase tracking-[0.18em] text-blue'>
                  即将开始
                </p>
                <span className='text-[11px] tracking-[0.06em] text-faint'>
                  {pageUpcoming.length} 场活动
                </span>
              </div>
              <div className='mt-[22px] grid gap-3.5'>
                {pageUpcoming.map((activity, index) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    index={index}
                    variant='page'
                  />
                ))}
              </div>
            </>
          )}

          {pagePast.length > 0 && (
            <div className={pageUpcoming.length > 0 ? 'mt-[88px]' : ''}>
              <div className='flex items-center justify-between gap-5 border-b border-line pb-3.5'>
                <p className='text-[10px] font-semibold uppercase tracking-[0.18em] text-blue'>
                  往期回顾
                </p>
                <span className='text-[11px] tracking-[0.06em] text-faint'>
                  {pagePast.length} 场
                </span>
              </div>
              <div className='mt-[22px] grid gap-3.5'>
                {pagePast.map((activity, index) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    index={index}
                    variant='page'
                    muted
                  />
                ))}
              </div>
            </div>
          )}

          {allActivities.length === 0 && (
            <div className='grid gap-5 py-[58px] pb-5 text-[14px] text-muted'>
              <span className='h-px w-full bg-line' />
              <p>活动回顾正在整理中。可以先看看产品。</p>
            </div>
          )}

          {allActivities.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath='/activities'
            />
          )}
        </PageShell>
      </section>
    </main>
  )
}
