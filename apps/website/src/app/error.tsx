'use client'

import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import {
  buttonClassName,
  Eyebrow,
  iconSm,
  PageShell,
  textLinkClassName,
} from '@/components/ui'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className='min-h-[68svh]'>
      <PageShell className='pb-[100px] pt-[100px] min-[821px]:pb-[140px] min-[821px]:pt-[140px]'>
        <Eyebrow>500</Eyebrow>
        <h1 className='mt-[22px] text-[clamp(46px,9vw,64px)] leading-[0.98] tracking-[-0.07em] min-[821px]:text-[clamp(50px,7vw,90px)]'>
          页面出了点问题，
          <br />
          请稍后再试。
        </h1>
        <p className='mt-6 text-[16px] text-muted'>
          你可以重新加载当前页面，或者先回到首页。
        </p>
        <div className='mt-[34px] flex flex-wrap items-center gap-x-6 gap-y-4'>
          <button
            type='button'
            className={buttonClassName('primary')}
            onClick={reset}
          >
            重新加载
            <ArrowRight className={iconSm} />
          </button>
          <Link className={textLinkClassName(true)} href='/'>
            回到首页
          </Link>
        </div>
      </PageShell>
    </main>
  )
}
