import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ChevronLeft } from '@/components/icons'
import { Markdown } from '@/components/markdown'
import {
  buttonClassName,
  Eyebrow,
  iconSm,
  PageShell,
  textLinkClassName,
} from '@/components/ui'
import {
  getProductById,
  getProducts,
  productExcerpt,
  productLead,
  type ProductTheme,
} from '@/lib/content'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

const themeStyles: Record<
  ProductTheme,
  { hero: string; placeholder: string; accent: string }
> = {
  navy: {
    hero: 'bg-[image:radial-gradient(70%_95%_at_86%_5%,#eef3fb,transparent_66%)] bg-white',
    placeholder: 'bg-[linear-gradient(135deg,#eef3fb,#dce7f6)]',
    accent: 'text-[#17385c]',
  },
  blue: {
    hero: 'bg-[image:radial-gradient(70%_95%_at_86%_5%,#edf6ff,transparent_66%)] bg-white',
    placeholder: 'bg-[linear-gradient(135deg,#edf6ff,#dce9ff)]',
    accent: 'text-[#2563eb]',
  },
  amber: {
    hero: 'bg-[image:radial-gradient(70%_95%_at_86%_5%,#fff8ea,transparent_66%)] bg-white',
    placeholder: 'bg-[linear-gradient(135deg,#fff8ea,#f4e4c3)]',
    accent: 'text-[#9a6a1f]',
  },
  sage: {
    hero: 'bg-[image:radial-gradient(70%_95%_at_86%_5%,#eef8f3,transparent_66%)] bg-white',
    placeholder: 'bg-[linear-gradient(135deg,#eef8f3,#dceee4)]',
    accent: 'text-[#2f6f58]',
  },
}

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({ id: product.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) return { title: '产品不存在' }
  return {
    title: product.name,
    description: productExcerpt(product, 150),
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()

  const markdown = product.contentMarkdown?.trim() || productLead(product)
  const theme = themeStyles[product.theme]

  return (
    <main>
      <section
        className={`border-b border-line pb-[52px] pt-[34px] ${theme.hero} min-[521px]:pb-[64px] min-[521px]:pt-[46px] min-[1081px]:pb-24 min-[1081px]:pt-[66px]`}
      >
        <PageShell>
          <Link
            className='mb-[34px] inline-flex items-center gap-1 text-[13px] text-muted transition-colors hover:text-ink min-[821px]:mb-[54px]'
            href='/products'
          >
            <ChevronLeft className={iconSm} />
            全部产品
          </Link>

          <div className='grid items-center gap-9 min-[821px]:grid-cols-2 min-[821px]:gap-[44px] min-[1081px]:grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)] min-[1081px]:gap-[72px]'>
            <div>
              <Eyebrow>研途产品</Eyebrow>
              <h1 className='mt-5 text-[clamp(40px,9vw,58px)] leading-[1.02] tracking-[-0.065em] min-[821px]:text-[clamp(48px,5.2vw,74px)]'>
                {product.name}
              </h1>
              <p className='mt-[26px] max-w-[540px] text-[16px] leading-[1.7] text-ink-soft min-[821px]:text-[18px]'>
                {productExcerpt(product, 170)}
              </p>
            </div>

            <div className='relative max-w-[560px] overflow-hidden rounded-[32px] shadow-[0_40px_90px_rgba(15,35,70,0.16)] min-[821px]:max-w-none'>
              {product.thumbnail ? (
                <img
                  className='aspect-[16/8.5] w-full object-cover min-[521px]:aspect-[16/9] min-[821px]:aspect-[16/11]'
                  src={product.thumbnail}
                  alt={`${product.name}产品图`}
                />
              ) : (
                <div
                  className={`relative grid aspect-[16/8.5] w-full place-items-center min-[521px]:aspect-[16/9] min-[821px]:aspect-[16/11] ${theme.placeholder}`}
                  aria-hidden='true'
                >
                  <span className='absolute inset-0 bg-[image:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.85),transparent_35%)]' />
                  <span
                    className={`relative text-[64px] font-bold opacity-55 ${theme.accent}`}
                  >
                    Y
                  </span>
                </div>
              )}
              <span className='absolute right-[18px] bottom-4 rounded-full border border-white/20 bg-black/25 px-[9px] py-[5px] text-[9px] tracking-[0.12em] text-white/80 backdrop-blur-[8px]'>
                YANTU / PRODUCT
              </span>
            </div>
          </div>
        </PageShell>
      </section>

      <section className='bg-white py-[88px] min-[821px]:py-[124px]'>
        <PageShell className='grid gap-[34px] min-[821px]:grid-cols-[180px_minmax(0,1fr)] min-[821px]:gap-12 min-[1081px]:grid-cols-[220px_minmax(0,760px)] min-[1081px]:justify-between min-[1081px]:gap-20'>
          <aside className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3 min-[821px]:sticky min-[821px]:top-[98px] min-[821px]:grid min-[821px]:items-start min-[821px]:gap-[18px] min-[821px]:self-start'>
            <Eyebrow>这项产品</Eyebrow>
            <p className='max-w-full basis-full text-[13px] leading-[1.7] text-muted min-[821px]:max-w-none'>
              为正在准备保研的你，整理出更具体的下一步。
            </p>
            <Link className={textLinkClassName()} href='/products'>
              返回产品列表
              <ArrowRight className={iconSm} />
            </Link>
          </aside>

          <div>
            <Markdown content={markdown} variant='product' />
          </div>
        </PageShell>
      </section>

      <section className='bg-[image:radial-gradient(60%_80%_at_80%_10%,rgba(0,113,227,0.2),transparent_68%)] bg-dark py-[72px] text-[#f5f5f7] min-[821px]:py-[124px]'>
        <PageShell className='flex flex-col items-start justify-between gap-8 min-[821px]:flex-row min-[821px]:items-center min-[821px]:gap-10'>
          <div>
            <Eyebrow light>下一步</Eyebrow>
            <h2 className='mt-[18px] text-[clamp(38px,8.2vw,52px)] leading-[1.05] tracking-[-0.06em] min-[821px]:text-[clamp(40px,4.6vw,62px)]'>
              听完方法，
              <br />
              再去听一个真实的故事。
            </h2>
          </div>
          <Link className={buttonClassName('light')} href='/activities'>
            查看活动回顾
            <ArrowRight className={iconSm} />
          </Link>
        </PageShell>
      </section>
    </main>
  )
}
