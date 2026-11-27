import type { ReactNode } from 'react'
import { Eyebrow, PageShell } from '@/components/ui'

export function PageHero({
  eyebrow,
  index,
  title,
  aside,
  tone = 'light',
}: {
  eyebrow: string
  index: string
  title: ReactNode
  aside: ReactNode
  tone?: 'light' | 'dark'
}) {
  const dark = tone === 'dark'

  return (
    <section
      className={`border-b py-[72px] pb-[70px] min-[821px]:pt-[104px] min-[821px]:pb-24 ${
        dark
          ? 'border-white/10 bg-[image:radial-gradient(55%_80%_at_80%_5%,rgba(0,113,227,0.28),transparent_64%),radial-gradient(40%_60%_at_10%_100%,rgba(90,200,250,0.08),transparent_70%)] bg-dark text-[#f5f5f7]'
          : 'border-line bg-[image:radial-gradient(60%_80%_at_88%_0%,rgba(0,113,227,0.12),transparent_62%)] bg-soft'
      }`}
    >
      <PageShell>
        <div
          className={`flex items-center justify-between gap-6 border-b pb-[22px] ${
            dark ? 'border-white/15' : 'border-line'
          }`}
        >
          <Eyebrow light={dark}>{eyebrow}</Eyebrow>
          <span className='text-[10px] font-medium tracking-[0.14em] text-faint'>
            {index}
          </span>
        </div>

        <div className='mt-[38px] grid gap-7 min-[821px]:mt-14 min-[821px]:grid-cols-[minmax(0,1fr)_320px] min-[821px]:items-end min-[821px]:gap-10 min-[1081px]:grid-cols-[minmax(0,1fr)_360px] min-[1081px]:gap-[60px]'>
          <div className='[&_h1]:text-[clamp(44px,9vw,62px)] [&_h1]:leading-[1.01] [&_h1]:tracking-[-0.07em] min-[821px]:[&_h1]:text-[clamp(50px,6vw,78px)]'>
            {title}
          </div>
          <div
            className={`max-w-[560px] [&_p]:text-[16px] [&_p]:leading-[1.7] min-[821px]:max-w-none min-[821px]:pb-1.5 ${
              dark ? '[&_p]:text-[#a1a1a6]' : '[&_p]:text-ink-soft'
            }`}
          >
            {aside}
          </div>
        </div>
      </PageShell>
    </section>
  )
}
