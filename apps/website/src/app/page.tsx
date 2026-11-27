import Link from 'next/link'
import { ActivityCard } from '@/components/activity-card'
import { ArrowRight, ArrowUpRight, Spark } from '@/components/icons'
import { ProductCard } from '@/components/product-card'
import {
  buttonClassName,
  Eyebrow,
  iconMd,
  iconSm,
  PageShell,
  textLinkClassName,
} from '@/components/ui'
import { getActivities, getProducts, isActivityEnded } from '@/lib/content'
import { isUpcoming } from '@/lib/format'

export const dynamic = 'force-dynamic'

const reveal =
  'opacity-0 animate-[rise_900ms_cubic-bezier(0.22,1,0.36,1)_forwards]'

export default async function HomePage() {
  const [products, activities] = await Promise.all([
    getProducts(),
    getActivities(),
  ])
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
  const featuredActivities = [...upcoming, ...past].slice(0, 4)
  const homeProducts = products.slice(0, 4)
  const preferredProduct =
    homeProducts.find((product) => product.name.includes('定位')) ??
    homeProducts[0]
  const featuredProduct = preferredProduct
  const restProducts = homeProducts
    .filter((product) => product.id !== preferredProduct?.id)
    .slice(0, 3)

  return (
    <main>
      <section className='relative min-h-[min(880px,calc(100svh-56px))] overflow-hidden border-b border-line bg-[radial-gradient(62%_52%_at_82%_14%,rgba(0,113,227,0.10),transparent_62%),radial-gradient(48%_46%_at_22%_90%,rgba(255,159,10,0.07),transparent_66%),linear-gradient(180deg,#ffffff_0%,#fbfbfd_100%)]'>
        <div
          className='pointer-events-none absolute inset-0 bg-[image:radial-gradient(rgba(0,0,0,0.04)_0.5px,transparent_0.5px)] bg-[length:5px_5px] opacity-45 [mask-image:linear-gradient(180deg,#000,transparent_72%)]'
          aria-hidden='true'
        />

        <PageShell className='relative z-10 grid min-h-0 grid-cols-1 items-center gap-[18px] pt-[58px] pb-4 min-[821px]:min-h-[710px] min-[821px]:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] min-[821px]:gap-6 min-[821px]:pt-[70px] min-[821px]:pb-10 min-[1081px]:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] min-[1081px]:gap-[52px]'>
          <div className='relative z-20'>
            <Eyebrow className={`${reveal} [animation-delay:0ms]`}>
              2027 保研季 · 从看清自己开始
            </Eyebrow>
            <h1
              className={`${reveal} mt-[22px] max-w-[760px] text-[clamp(52px,11.5vw,76px)] leading-[0.97] tracking-[-0.068em] [animation-delay:90ms] min-[821px]:text-[clamp(58px,7.2vw,94px)] max-[520px]:text-[clamp(46px,12vw,62px)]`}
            >
              把保研，
              <br />
              <span className='whitespace-nowrap bg-[linear-gradient(96deg,#1d1d1f_4%,#0066cc_56%,#4aa8ff_96%)] bg-clip-text text-transparent'>
                做得更清楚。
              </span>
            </h1>
            <p
              className={`${reveal} mt-[30px] max-w-[530px] text-[16px] leading-[1.62] tracking-[-0.018em] text-ink-soft [animation-delay:180ms] min-[521px]:text-[17px] min-[821px]:text-[19px]`}
            >
              不是把日程塞满，而是在每一个关键节点，知道下一步该做什么。
              从定位、材料到面试，研途把复杂的准备拆成可以完成的小事。
            </p>
            <div
              className={`${reveal} mt-9 flex flex-col items-start gap-2.5 [animation-delay:270ms] min-[521px]:flex-row min-[521px]:flex-wrap min-[521px]:items-center min-[521px]:gap-x-[22px] min-[521px]:gap-y-3`}
            >
              <Link className={buttonClassName('primary')} href='/products'>
                探索研途产品
                <ArrowRight className={iconSm} />
              </Link>
              <Link className={buttonClassName('quiet')} href='/activities'>
                查看活动回顾
                <ArrowUpRight className={iconSm} />
              </Link>
            </div>
          </div>

          <div
            className={`${reveal} relative mt-1 h-[330px] min-w-0 [animation-delay:180ms] min-[521px]:h-[430px] min-[821px]:mt-1.5 min-[821px]:h-[500px] min-[1081px]:h-[560px]`}
            aria-hidden='true'
          >
            <div className='absolute top-[52%] left-[51%] size-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[image:radial-gradient(circle,rgba(0,113,227,0.2),rgba(90,200,250,0.06)_55%,transparent_72%)] blur-[26px] min-[821px]:size-[470px]' />

            <div className='absolute top-1/2 left-1/2 grid aspect-square size-[220px] -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full border border-white/70 bg-[radial-gradient(circle_at_31%_23%,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.28)_13%,transparent_32%),radial-gradient(circle_at_70%_78%,rgba(0,40,120,0.9)_0%,transparent_42%),conic-gradient(from_218deg_at_52%_50%,#0b2c5d,#0b84ff,#8ed8ff,#f7fbff,#287ef0,#0b2c5d)] shadow-[0_60px_110px_rgba(0,58,140,0.28),0_20px_42px_rgba(0,87,190,0.18),inset_0_0_70px_rgba(255,255,255,0.4),inset_-20px_-30px_70px_rgba(1,20,55,0.55)] animate-[orb-breath_9s_ease-in-out_infinite] before:absolute before:inset-[16%] before:rounded-full before:border before:border-white/30 before:content-[""] after:absolute after:inset-[30%] after:rounded-full after:border after:border-[#001e50]/25 after:content-[""] min-[521px]:size-[270px] min-[821px]:size-[310px] min-[1081px]:size-[350px]'>
              <span className='relative z-10 -translate-y-[42px] text-[10px] font-semibold tracking-[0.36em] text-white/70 min-[821px]:-translate-y-[52px]'>
                YANTU
              </span>
              <span className='absolute z-10 text-[44px] font-semibold tracking-[-0.07em] text-white [text-shadow:0_8px_34px_rgba(0,23,62,0.38)] min-[521px]:text-[55px] min-[821px]:text-[62px] min-[1081px]:text-[72px]'>
                2027
              </span>
              <span className='absolute z-10 translate-y-[50px] text-[8px] font-semibold tracking-[0.24em] text-white/60 min-[821px]:translate-y-[62px]'>
                READY / CLEAR / STEADY
              </span>
            </div>

            <div className='absolute top-1 left-0 flex w-[138px] animate-[drift-a_7s_ease-in-out_infinite] items-center gap-2 rounded-[18px] border border-white/85 bg-white/70 p-[10px_11px] shadow-[0_18px_44px_rgba(16,45,90,0.12),inset_0_0_0_1px_rgba(0,0,0,0.02)] backdrop-blur-[20px] backdrop-saturate-150 min-[521px]:top-[18px] min-[521px]:left-[2%] min-[521px]:w-[152px] min-[521px]:gap-3 min-[521px]:p-[11px_12px] min-[821px]:top-[54px] min-[821px]:left-[7%] min-[821px]:w-[164px] min-[821px]:p-[13px_14px] min-[1081px]:w-[188px] min-[1081px]:p-[15px_17px]'>
              <span className='grid size-[21px] shrink-0 place-items-center rounded-full bg-blue/[0.08] text-[9px] font-semibold tracking-[0.06em] text-blue min-[521px]:size-6 min-[821px]:size-7 min-[821px]:text-[10px]'>
                01
              </span>
              <div>
                <strong className='block text-[13px] tracking-[-0.03em] min-[521px]:text-[14px] min-[821px]:text-[16px]'>
                  定位
                </strong>
                <p className='mt-0.5 text-[9px] text-muted min-[521px]:text-[10px] min-[821px]:text-[11px]'>
                  知道该冲哪里
                </p>
              </div>
            </div>

            <div className='absolute top-[39%] right-0 flex w-[138px] animate-[drift-b_8s_ease-in-out_infinite] items-center gap-2 rounded-[18px] border border-white/85 bg-white/70 p-[10px_11px] shadow-[0_18px_44px_rgba(16,45,90,0.12),inset_0_0_0_1px_rgba(0,0,0,0.02)] backdrop-blur-[20px] backdrop-saturate-150 min-[521px]:top-[40%] min-[521px]:w-[152px] min-[521px]:gap-3 min-[521px]:p-[11px_12px] min-[821px]:top-[42%] min-[821px]:w-[164px] min-[821px]:p-[13px_14px] min-[1081px]:right-[-3%] min-[1081px]:w-[188px] min-[1081px]:p-[15px_17px]'>
              <span className='grid size-[21px] shrink-0 place-items-center rounded-full bg-blue/[0.08] text-[9px] font-semibold tracking-[0.06em] text-blue min-[521px]:size-6 min-[821px]:size-7 min-[821px]:text-[10px]'>
                02
              </span>
              <div>
                <strong className='block text-[13px] tracking-[-0.03em] min-[521px]:text-[14px] min-[821px]:text-[16px]'>
                  材料
                </strong>
                <p className='mt-0.5 text-[9px] text-muted min-[521px]:text-[10px] min-[821px]:text-[11px]'>
                  让经历成为证据
                </p>
              </div>
            </div>

            <div className='absolute bottom-0.5 left-[12%] flex w-[138px] animate-[drift-c_7.5s_ease-in-out_infinite] items-center gap-2 rounded-[18px] border border-white/85 bg-white/70 p-[10px_11px] shadow-[0_18px_44px_rgba(16,45,90,0.12),inset_0_0_0_1px_rgba(0,0,0,0.02)] backdrop-blur-[20px] backdrop-saturate-150 min-[521px]:bottom-2.5 min-[521px]:left-[9%] min-[521px]:w-[152px] min-[521px]:gap-3 min-[521px]:p-[11px_12px] min-[821px]:bottom-8 min-[821px]:left-[22%] min-[821px]:w-[164px] min-[821px]:p-[13px_14px] min-[1081px]:w-[188px] min-[1081px]:p-[15px_17px]'>
              <span className='grid size-[21px] shrink-0 place-items-center rounded-full bg-blue/[0.08] text-[9px] font-semibold tracking-[0.06em] text-blue min-[521px]:size-6 min-[821px]:size-7 min-[821px]:text-[10px]'>
                03
              </span>
              <div>
                <strong className='block text-[13px] tracking-[-0.03em] min-[521px]:text-[14px] min-[821px]:text-[16px]'>
                  面试
                </strong>
                <p className='mt-0.5 text-[9px] text-muted min-[521px]:text-[10px] min-[821px]:text-[11px]'>
                  把答案讲清楚
                </p>
              </div>
            </div>
          </div>
        </PageShell>

        <PageShell className='relative z-10 flex flex-wrap items-center gap-3.5 pt-2 pb-[22px] text-[11px] tracking-[0.12em] text-faint min-[521px]:flex-nowrap min-[821px]:pt-[18px]'>
          <span>定位</span>
          <span className='h-px w-5 bg-ink/20 min-[821px]:w-[38px]' />
          <span>材料</span>
          <span className='h-px w-5 bg-ink/20 min-[821px]:w-[38px]' />
          <span>面试</span>
          <span className='w-full text-[#424245] tracking-[0.08em] min-[521px]:ml-auto min-[521px]:w-auto'>
            为保研做减法
          </span>
        </PageShell>
      </section>

      <section
        className='bg-white py-[88px] min-[821px]:py-[124px]'
        id='products'
      >
        <PageShell>
          <div className='mb-[38px] grid gap-7 min-[821px]:mb-14 min-[821px]:grid-cols-[minmax(0,1fr)_320px] min-[821px]:items-end min-[821px]:gap-10 min-[1081px]:grid-cols-[minmax(0,1fr)_370px] min-[1081px]:gap-[60px]'>
            <div>
              <Eyebrow>研途产品</Eyebrow>
              <h2 className='mt-[18px] text-[clamp(38px,8.2vw,52px)] leading-[1.02] tracking-[-0.06em] min-[821px]:text-[clamp(44px,5vw,68px)]'>
                每一步，都有
                <br />
                更清晰的做法。
              </h2>
            </div>
            <div className='grid gap-[22px] pb-0 min-[821px]:pb-1.5'>
              <p className='text-[15px] leading-[1.65] tracking-[-0.016em] text-ink-soft min-[821px]:text-[17px]'>
                每个常卡住的节点，都有一件可以直接执行的产品。不是更多信息，而是把下一步变得具体。
              </p>
              <Link className={textLinkClassName(true)} href='/products'>
                查看全部产品
                <ArrowRight className={iconSm} />
              </Link>
            </div>
          </div>

          {featuredProduct && (
            <div className='grid grid-cols-1 gap-[22px] min-[821px]:grid-cols-2 min-[1081px]:grid-cols-3'>
              <ProductCard product={featuredProduct} featured order={1} />
              {restProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  order={index + 2}
                />
              ))}
            </div>
          )}
        </PageShell>
      </section>

      <section
        className='bg-soft py-[88px] min-[821px]:py-[124px]'
        id='activities'
      >
        <PageShell>
          <div className='mb-[38px] grid gap-7 min-[821px]:mb-14 min-[821px]:grid-cols-[minmax(0,1fr)_320px] min-[821px]:items-end min-[821px]:gap-10 min-[1081px]:grid-cols-[minmax(0,1fr)_370px] min-[1081px]:gap-[60px]'>
            <div>
              <Eyebrow>活动回顾</Eyebrow>
              <h2 className='mt-[18px] text-[clamp(38px,8.2vw,52px)] leading-[1.02] tracking-[-0.06em] min-[821px]:text-[clamp(44px,5vw,68px)]'>
                和走过这条路的人，
                <br />
                坐下来聊聊。
              </h2>
            </div>
            <div className='grid gap-[22px] pb-0 min-[821px]:pb-1.5'>
              <p className='text-[15px] leading-[1.65] tracking-[-0.016em] text-ink-soft min-[821px]:text-[17px]'>
                线上分享、工作坊和模拟夜。没有空泛的加油，只有可以带走的判断和方法。
              </p>
              <Link className={textLinkClassName(true)} href='/activities'>
                查看全部活动回顾
                <ArrowRight className={iconSm} />
              </Link>
            </div>
          </div>

          <div className='grid gap-3.5'>
            {featuredActivities.length ? (
              featuredActivities.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  index={index}
                />
              ))
            ) : (
              <p className='pt-[42px] pb-2.5 text-sm text-black/45'>
                活动回顾正在整理中，稍后再来看看。
              </p>
            )}
          </div>

          <div className='mt-[34px] flex items-start gap-2.5 text-xs text-muted'>
            <Spark className={`${iconMd} mt-px text-faint`} />
            <p className='max-w-[660px]'>
              活动回顾会持续更新。没有赶上的分享，也可以在产品里找到对应的方法。
            </p>
          </div>
        </PageShell>
      </section>
    </main>
  )
}
