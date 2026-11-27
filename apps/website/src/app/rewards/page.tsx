import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import { PageHero } from '@/components/page-hero'
import { iconSm, PageShell, textLinkClassName } from '@/components/ui'
import { getInviteRewards } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '邀请奖励',
  description: '研途邀请奖励名单：查看邀请人、邀请人数与获得佣金。',
}

const money = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export default async function RewardsPage() {
  const rewards = await getInviteRewards()

  return (
    <main>
      <PageHero
        eyebrow='邀请奖励'
        index='REWARDS / 01'
        title={
          <h1>
            邀请好友，
            <br />
            <span className='text-blue'>一起把路走清楚。</span>
          </h1>
        }
        aside={<p>邀请好友参与研途活动，好友报名成功后获得佣金。</p>}
      />

      <section className='bg-white pb-[88px] pt-[56px] min-[821px]:pb-[124px] min-[821px]:pt-[84px]'>
        <PageShell>
          {rewards.length ? (
            <div className='overflow-hidden rounded-[32px] border border-line'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr>
                    <th
                      scope='col'
                      className='bg-soft px-4 py-[18px] text-left text-[11px] font-medium tracking-[0.04em] text-muted min-[561px]:px-7 min-[561px]:text-xs'
                    >
                      邀请人
                    </th>
                    <th
                      scope='col'
                      className='whitespace-nowrap bg-soft px-4 py-[18px] text-right text-[11px] font-medium tracking-[0.04em] text-muted min-[561px]:px-7 min-[561px]:text-xs'
                    >
                      邀请人数
                    </th>
                    <th
                      scope='col'
                      className='whitespace-nowrap bg-soft px-4 py-[18px] text-right text-[11px] font-medium tracking-[0.04em] text-muted min-[561px]:px-7 min-[561px]:text-xs'
                    >
                      获得佣金
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((reward, index) => (
                    <tr key={`${reward.phone}-${index}`}>
                      <td className='border-t border-line px-4 py-5 align-middle min-[561px]:px-7 min-[561px]:py-6'>
                        <div className='grid gap-[5px]'>
                          <strong className='text-[16px] font-semibold tracking-[-0.025em] min-[561px]:text-[18px]'>
                            {reward.name}
                          </strong>
                          <span className='text-[13px] tracking-[0.02em] text-muted tabular-nums'>
                            {reward.phone}
                          </span>
                        </div>
                      </td>
                      <td className='border-t border-line px-4 py-5 text-right align-middle text-[14px] text-ink-soft tabular-nums min-[561px]:px-7 min-[561px]:py-6 min-[561px]:text-[15px]'>
                        {reward.inviteCount} 人
                      </td>
                      <td className='border-t border-line px-4 py-5 text-right align-middle text-[14px] font-semibold text-blue tabular-nums min-[561px]:px-7 min-[561px]:py-6 min-[561px]:text-[15px]'>
                        ¥ {money.format(reward.commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='grid gap-4 py-[70px] text-muted'>
              <p>邀请奖励正在整理中。</p>
              <Link className={textLinkClassName()} href='/activities'>
                去看活动回顾
                <ArrowRight className={iconSm} />
              </Link>
            </div>
          )}
        </PageShell>
      </section>
    </main>
  )
}
