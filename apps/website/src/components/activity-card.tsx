import Link from 'next/link'
import {
  activityBanner,
  activityPriceLabel,
  isActivityEnded,
  type Activity,
} from '@/lib/content'
import {
  dateParts,
  daysUntil,
  formatDateLong,
  isToday,
  isUpcoming,
} from '@/lib/format'
import { ArrowUpRight } from './icons'

export function ActivityCard({
  activity,
  index = 0,
  variant = 'default',
  muted = false,
}: {
  activity: Activity
  index?: number
  variant?: 'default' | 'page'
  muted?: boolean
}) {
  const upcomingRaw = isUpcoming(activity.date)
  const todayRaw = isToday(activity.date)
  const ended = isActivityEnded(activity.status) || (!upcomingRaw && !todayRaw)
  const upcoming = !ended && upcomingRaw
  const days = daysUntil(activity.date)
  const parts = dateParts(activity.date)
  const banner = activityBanner(activity)
  const page = variant === 'page'

  return (
    <Link
      className={`group grid grid-cols-[76px_minmax(0,1fr)] items-center gap-[18px] rounded-[24px] border border-black/[0.05] bg-white p-[17px_18px] text-inherit transition-[translate,box-shadow,border-color,background-color,opacity] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] animate-[rise_700ms_cubic-bezier(0.22,1,0.36,1)_both] hover:-translate-y-1 hover:border-blue/20 hover:bg-[#fdfdfd] hover:shadow-[0_18px_42px_rgba(15,30,55,0.09)] ${
        page
          ? 'min-[821px]:grid-cols-[118px_186px_minmax(0,1fr)_48px] min-[821px]:p-[26px_30px]'
          : 'min-[821px]:grid-cols-[104px_156px_minmax(0,1fr)_42px] min-[821px]:p-[20px_24px]'
      } ${muted ? 'opacity-[0.68] hover:opacity-100' : ''}`}
      href={`/activities/${activity.id}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div
        className='col-start-1 row-start-1 flex min-h-full flex-col items-start border-r border-line pr-3.5 min-[821px]:row-start-1 min-[821px]:pr-[22px]'
        aria-label={formatDateLong(activity.date)}
      >
        <span className='text-[10px] font-medium tracking-[0.1em] text-faint'>
          {parts.month} 月
        </span>
        <span className='mt-px text-[36px] font-semibold leading-none tracking-[-0.06em] text-ink tabular-nums min-[821px]:text-[44px]'>
          {parts.day}
        </span>
        <span
          className={`mt-2 rounded-full px-[7px] py-[3px] text-[8px] font-semibold tracking-[0.04em] min-[821px]:text-[9px] ${
            ended ? 'bg-black/[0.04] text-faint' : 'bg-blue/[0.08] text-blue'
          }`}
        >
          {ended ? '已结束' : upcoming ? `${days} 天后` : '今天'}
        </span>
      </div>

      <div className='col-span-full row-start-2 aspect-[16/7] overflow-hidden rounded-[11px] bg-soft min-[821px]:col-span-1 min-[821px]:col-start-2 min-[821px]:row-start-1 min-[821px]:aspect-[16/10]'>
        <img
          className='size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]'
          src={banner}
          alt={`${activity.name}活动封面`}
          loading='lazy'
        />
      </div>

      <div className='col-start-2 row-start-1 min-w-0 min-[821px]:col-start-3'>
        <div className='flex flex-wrap gap-x-[18px] gap-y-2 text-[10px] tracking-[0.06em] text-faint'>
          <span>分享人 · {activity.sharer}</span>
          <span>价格 · {activityPriceLabel(activity.price)}</span>
          {activity.signupCount > 0 && (
            <span>{activity.signupCount} 人报名</span>
          )}
        </div>
        <h3
          className={`mt-[7px] leading-[1.28] tracking-[-0.04em] ${
            page ? 'text-[21px] min-[821px]:text-[27px]' : 'text-[23px]'
          }`}
        >
          {activity.name}
        </h3>
        <p className='mt-[7px] max-w-[820px] overflow-hidden text-[13px] leading-[1.6] text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] min-[821px]:max-w-[900px] min-[821px]:whitespace-nowrap min-[821px]:text-[13px] min-[821px]:[display:block] min-[821px]:[-webkit-line-clamp:unset]'>
          {activity.summary}
        </p>
      </div>

      <div className='hidden size-[34px] place-items-center rounded-full bg-black/[0.04] text-ink-soft transition-[background-color,color,scale] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-hover:bg-blue group-hover:text-white min-[821px]:col-start-4 min-[821px]:row-start-1 min-[821px]:grid'>
        <ArrowUpRight className='size-[18px] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[2px] group-hover:translate-x-[2px]' />
      </div>
    </Link>
  )
}
