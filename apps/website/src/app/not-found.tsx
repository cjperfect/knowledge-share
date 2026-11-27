import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import {
  buttonClassName,
  Eyebrow,
  iconSm,
  PageShell,
  textLinkClassName,
} from '@/components/ui'

export default function NotFound() {
  return (
    <main className='min-h-[68svh]'>
      <PageShell className='pb-[100px] pt-[100px] min-[821px]:pb-[140px] min-[821px]:pt-[140px]'>
        <Eyebrow>404</Eyebrow>
        <h1 className='mt-[22px] text-[clamp(46px,9vw,64px)] leading-[0.98] tracking-[-0.07em] min-[821px]:text-[clamp(50px,7vw,90px)]'>
          这一页，
          <br />
          还没有准备好。
        </h1>
        <p className='mt-6 text-[16px] text-muted'>
          你要找的内容可能已经移动，或者还没有发布。
        </p>
        <div className='mt-[34px] flex flex-wrap items-center gap-x-6 gap-y-4'>
          <Link className={buttonClassName('primary')} href='/'>
            回到首页
            <ArrowRight className={iconSm} />
          </Link>
          <Link className={textLinkClassName(true)} href='/products'>
            看看产品
          </Link>
        </div>
      </PageShell>
    </main>
  )
}
