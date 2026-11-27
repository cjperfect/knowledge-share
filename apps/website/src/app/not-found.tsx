import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from '@/components/icons'
import {
  buttonClassName,
  Eyebrow,
  iconSm,
  PageShell,
  textLinkClassName,
} from '@/components/ui'

const destinations = [
  {
    href: '/',
    label: '回到首页',
    description: '从研途重新开始',
  },
  {
    href: '/products',
    label: '看看产品',
    description: '定位、材料与面试',
  },
  {
    href: '/activities',
    label: '活动回顾',
    description: '真实的经验分享',
  },
] as const

export default function NotFound() {
  return (
    <main className='relative isolate min-h-[72svh] overflow-hidden bg-soft-2'>
      <div
        className='pointer-events-none absolute -right-[18%] -top-[38%] -z-10 size-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,113,227,0.14),rgba(0,113,227,0.035)_45%,transparent_70%)]'
        aria-hidden='true'
      />
      <div
        className='pointer-events-none absolute -bottom-[42%] -left-[16%] -z-10 size-[620px] rounded-full bg-[radial-gradient(circle_at_center,rgba(29,29,31,0.08),transparent_68%)]'
        aria-hidden='true'
      />

      <PageShell className='pb-[96px] pt-[78px] min-[821px]:pb-[140px] min-[821px]:pt-[118px]'>
        <div className='grid items-center gap-12 min-[981px]:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] min-[981px]:gap-20'>
          <div className='min-w-0 animate-[rise_900ms_cubic-bezier(0.22,1,0.36,1)_both]'>
            <Eyebrow>404 · PAGE NOT FOUND</Eyebrow>
            <h1 className='mt-[20px] max-w-[760px] text-[clamp(44px,8vw,76px)] leading-[0.96] font-semibold tracking-[-0.065em] text-ink min-[821px]:text-[clamp(54px,6.2vw,92px)]'>
              这条路，
              <br />
              暂时还没铺好。
            </h1>
            <p className='mt-6 max-w-[500px] text-[16px] leading-[1.8] text-muted'>
              你要找的页面可能已经移动、改名，或者还没有发布。
              <br className='hidden min-[561px]:block' />
              先回到熟悉的地方，再继续往下走。
            </p>

            <div className='mt-[30px] flex flex-wrap items-center gap-x-6 gap-y-4'>
              <Link className={buttonClassName('primary')} href='/'>
                回到首页
                <ArrowRight className={iconSm} />
              </Link>
              <Link className={textLinkClassName(true)} href='/products'>
                浏览全部产品
              </Link>
            </div>

            <div className='mt-12 grid max-w-[640px] gap-3 min-[561px]:grid-cols-3'>
              {destinations.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className='group flex min-h-[104px] flex-col justify-between rounded-[22px] border border-line bg-white/80 p-4 no-underline transition duration-300 hover:-translate-y-1 hover:border-blue/30 hover:bg-white hover:shadow-[0_16px_38px_rgba(0,0,0,0.06)]'
                >
                  <span className='flex items-start justify-between gap-3'>
                    <span className='text-[14px] font-semibold text-ink'>
                      {item.label}
                    </span>
                    <ArrowUpRight className='size-4 text-faint transition-colors group-hover:text-blue' />
                  </span>
                  <span className='text-[11px] leading-5 text-muted'>
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className='relative mx-auto w-full max-w-[460px] animate-[rise_900ms_cubic-bezier(0.22,1,0.36,1)_120ms_both] min-[981px]:mx-0'>
            <div
              className='absolute inset-x-10 top-1/2 -z-10 h-[70%] -translate-y-1/2 rounded-full bg-blue/10 blur-3xl'
              aria-hidden='true'
            />
            <div
              className='absolute -right-3 -top-4 size-[92px] rounded-full border border-blue/15 bg-white/60 backdrop-blur-sm'
              aria-hidden='true'
            />
            <div
              className='absolute -bottom-5 -left-4 size-[58px] rounded-full border border-line bg-white/80 backdrop-blur-sm'
              aria-hidden='true'
            />

            <div className='relative overflow-hidden rounded-[34px] border border-line bg-white px-7 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.09)] min-[821px]:px-9 min-[821px]:py-10'>
              <div
                className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue/35 to-transparent'
                aria-hidden='true'
              />
              <div className='flex items-center justify-between gap-4'>
                <span className='text-[10px] font-semibold tracking-[0.18em] text-faint uppercase'>
                  Error Code
                </span>
                <span className='rounded-full border border-line px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-muted uppercase'>
                  Lost
                </span>
              </div>

              <p className='mt-10 text-[clamp(92px,17vw,164px)] leading-[0.82] font-semibold tracking-[-0.115em] text-ink'>
                404
              </p>
              <p className='mt-5 text-[15px] font-medium text-ink'>
                页面没有找到
              </p>
              <p className='mt-2 text-[12px] leading-6 text-muted'>
                你访问的地址不在当前站点中。
                <br />
                检查链接，或者从首页继续浏览。
              </p>

              <div className='mt-9 h-px w-full bg-line' aria-hidden='true' />
              <div className='mt-4 flex items-center justify-between gap-4'>
                <span className='text-[11px] text-faint'>HTTP 404</span>
                <Link
                  className='inline-flex items-center gap-1.5 text-[12px] font-medium text-blue no-underline transition hover:text-[#0077ed]'
                  href='/'
                >
                  回到首页
                  <ArrowRight className='size-3.5' />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </main>
  )
}
