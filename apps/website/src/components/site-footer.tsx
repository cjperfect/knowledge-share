import Link from 'next/link'
import { PageShell } from '@/components/ui'

export function SiteFooter() {
  return (
    <footer className='border-t border-line bg-soft pb-[30px] pt-[52px] min-[821px]:pt-[68px]'>
      <PageShell className='flex flex-col items-start justify-between gap-8 min-[821px]:flex-row min-[821px]:gap-10'>
        <div className='flex items-center gap-3.5'>
          <span
            className='grid size-[29px] place-items-center rounded-full bg-white text-[14px] font-bold leading-none text-ink shadow-[0_2px_10px_rgba(0,0,0,0.06)]'
            aria-hidden='true'
          >
            Y
          </span>
          <div>
            <p className='text-[15px] font-semibold tracking-[0.02em]'>研途</p>
            <p className='mt-1 text-xs text-muted'>
              把保研这件事，做得更清楚。
            </p>
          </div>
        </div>

        <div className='flex flex-wrap gap-x-7 gap-y-2.5 text-xs text-ink-soft'>
          <Link className='transition-colors hover:text-blue' href='/products'>
            产品
          </Link>
          <Link
            className='transition-colors hover:text-blue'
            href='/activities'
          >
            活动回顾
          </Link>
          <Link className='transition-colors hover:text-blue' href='/rewards'>
            邀请奖励
          </Link>
        </div>
      </PageShell>

      <PageShell className='mt-10 flex flex-wrap justify-between gap-x-5 gap-y-2 border-t border-line pt-[18px] text-[10px] tracking-[0.02em] text-faint min-[821px]:mt-[58px]'>
        <p>© 2026 研途 · 保研知识分享</p>
        <p>为每一个认真准备的人，留一条更清晰的路。</p>
      </PageShell>
    </footer>
  )
}
