import {
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Sparkles,
} from 'lucide-react'

type AuthLayoutProps = {
  children: React.ReactNode
}

const FEATURES = [
  {
    icon: BookOpen,
    title: '内容推送',
    description: '一次编辑，多端同步，定时发送。',
  },
  {
    icon: CalendarDays,
    title: '活动与报名',
    description: '发布活动，用海报二维码直达报名。',
  },
  {
    icon: BarChart3,
    title: '分享数据',
    description: '报名与传播效果，集中在一个看板。',
  },
]

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='grid min-h-svh bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)]'>
      <aside className='relative hidden overflow-hidden bg-[#0f172a] text-white lg:flex lg:flex-col'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 opacity-[0.14]'
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -top-40 -left-36 size-[520px] rounded-full bg-[#1d4ed8]/30 blur-[120px]'
        />
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -right-24 -bottom-28 size-[420px] rounded-full bg-[#bfdbfe]/10 blur-[100px]'
        />
        <div
          aria-hidden='true'
          className='pointer-events-none absolute top-[18%] right-10 hidden h-44 w-px bg-linear-to-b from-transparent via-white/15 to-transparent xl:block'
        />

        <div className='relative z-10 flex min-h-svh flex-col p-10 xl:p-14'>
          <div className='flex items-center gap-3'>
            <span className='grid size-10 place-items-center rounded-xl bg-[#bfdbfe] text-[#0f172a] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'>
              <GraduationCap className='size-5' aria-hidden='true' />
            </span>
            <div>
              <p className='text-base font-semibold tracking-tight'>研途</p>
              <p className='mt-0.5 text-[10px] font-medium tracking-[0.22em] text-white/40 uppercase'>
                Knowledge Share
              </p>
            </div>
          </div>

          <div className='my-auto max-w-[560px] py-12'>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/65'>
              <Sparkles
                className='size-3.5 text-[#bfdbfe]'
                aria-hidden='true'
              />
              保研知识分享 · 运营后台
            </span>

            <h1 className='mt-7 text-[2.65rem] leading-[1.12] font-semibold tracking-[-0.045em] text-balance xl:text-[3.25rem]'>
              把经验沉淀下来，
              <br />
              <span className='text-[#bfdbfe]'>让同路人少走弯路。</span>
            </h1>

            <p className='mt-5 max-w-[470px] text-sm leading-7 text-white/55'>
              在这里管理活动、内容与报名数据，让每一次分享都被看见，也能真正帮到下一位同学。
            </p>

            <div className='mt-9 grid gap-3'>
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className='flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.045] px-4 py-3.5 backdrop-blur-sm'
                  >
                    <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-[#1d4ed8]/20 text-[#bfdbfe]'>
                      <Icon className='size-4' aria-hidden='true' />
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-white/90'>
                        {feature.title}
                      </p>
                      <p className='mt-0.5 text-xs leading-5 text-white/45'>
                        {feature.description}
                      </p>
                    </div>
                    <span className='text-[10px] font-medium tracking-[0.14em] text-white/25 tabular-nums'>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className='flex items-end justify-between gap-6 border-t border-white/10 pt-6 text-white/35'>
            <p className='text-xs'>研途 · 保研知识分享平台</p>
            <p className='text-[10px] tracking-[0.22em] uppercase'>Est. 2026</p>
          </div>
        </div>
      </aside>

      <main className='relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/30 px-5 py-10 sm:px-8'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(29,78,216,0.10),transparent_40%),radial-gradient(circle_at_8%_92%,rgba(15,23,42,0.08),transparent_44%)]'
        />
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -top-24 -right-24 size-72 rounded-full border border-primary/10'
        />
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full border border-primary/10'
        />

        <div className='relative z-10 w-full max-w-[420px]'>
          <div className='mb-8 flex items-center gap-3 lg:hidden'>
            <span className='grid size-10 place-items-center rounded-xl bg-[#0f172a] text-[#bfdbfe]'>
              <GraduationCap className='size-5' aria-hidden='true' />
            </span>
            <div>
              <p className='text-base font-semibold tracking-tight'>研途</p>
              <p className='text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase'>
                Knowledge Share
              </p>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
