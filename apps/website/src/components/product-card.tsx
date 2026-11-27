import Link from 'next/link'
import { productExcerpt, type Product, type ProductTheme } from '@/lib/content'
import { ArrowUpRight } from './icons'
import { iconSm, textLinkClassName } from './ui'

const themeStyles: Record<
  ProductTheme,
  { accent: string; soft: string; placeholder: string; feature: string }
> = {
  navy: {
    accent: 'text-[#17385c]',
    soft: 'bg-[#e7eff9]',
    placeholder: 'bg-[linear-gradient(135deg,#e7eff9,#dce7f6)]',
    feature:
      'bg-[image:radial-gradient(80%_90%_at_90%_10%,#e7eff9,transparent_60%)]',
  },
  blue: {
    accent: 'text-[#2563eb]',
    soft: 'bg-[#e8f2ff]',
    placeholder: 'bg-[linear-gradient(135deg,#e8f2ff,#dce9ff)]',
    feature:
      'bg-[image:radial-gradient(80%_90%_at_90%_10%,#e8f2ff,transparent_60%)]',
  },
  amber: {
    accent: 'text-[#9a6a1f]',
    soft: 'bg-[#fbf1db]',
    placeholder: 'bg-[linear-gradient(135deg,#fbf1db,#f4e4c3)]',
    feature:
      'bg-[image:radial-gradient(80%_90%_at_90%_10%,#fbf1db,transparent_60%)]',
  },
  sage: {
    accent: 'text-[#2f6f58]',
    soft: 'bg-[#e9f5ef]',
    placeholder: 'bg-[linear-gradient(135deg,#e9f5ef,#dceee4)]',
    feature:
      'bg-[image:radial-gradient(80%_90%_at_90%_10%,#e9f5ef,transparent_60%)]',
  },
}

export function ProductCard({
  product,
  featured = false,
  order,
}: {
  product: Product
  featured?: boolean
  order: number
}) {
  const theme = themeStyles[product.theme]

  return (
    <Link
      className={`group flex min-w-0 flex-col overflow-hidden rounded-[32px] border border-black/[0.04] bg-soft text-inherit transition-[translate,box-shadow,border-color,background-color] duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[7px] hover:border-black/[0.08] hover:bg-white hover:shadow-[0_30px_70px_rgba(15,30,55,0.12)] ${
        featured
          ? `min-[821px]:col-span-full min-[821px]:grid min-[821px]:min-h-[500px] min-[821px]:grid-cols-[1.05fr_0.95fr] ${theme.feature} min-[1081px]:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)]`
          : ''
      }`}
      href={`/products/${product.id}`}
    >
      <div
        className={`relative w-full overflow-hidden aspect-[16/10] ${theme.soft} ${
          featured ? 'min-[821px]:aspect-auto min-[821px]:h-full' : ''
        }`}
      >
        {product.thumbnail ? (
          <img
            className='size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035]'
            src={product.thumbnail}
            alt={`${product.name}产品图`}
            loading='lazy'
          />
        ) : (
          <div
            className={`grid size-full place-items-center ${theme.placeholder} ${
              featured ? 'min-[821px]:h-full' : ''
            }`}
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
        <span
          className='pointer-events-none absolute inset-x-[-20%] bottom-[-40%] h-[55%] bg-[image:radial-gradient(ellipse_at_center,rgba(255,255,255,0.5),transparent_66%)] opacity-60 mix-blend-screen transition-opacity duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100'
          aria-hidden='true'
        />
      </div>

      <div
        className={`flex flex-1 flex-col p-[25px_26px_27px] ${
          featured
            ? 'min-[821px]:justify-center min-[821px]:px-9 min-[821px]:py-10 min-[1081px]:px-[50px] min-[1081px]:py-[54px]'
            : ''
        }`}
      >
        <div
          className={`flex items-center justify-between gap-3 text-[10px] font-semibold tracking-[0.14em] ${theme.accent}`}
        >
          <span>研途产品 · {String(order).padStart(2, '0')}</span>
          <ArrowUpRight
            className={`${iconSm} opacity-50 transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[2px] group-hover:translate-x-[2px]`}
          />
        </div>
        <h3
          className={`mt-[15px] text-[30px] leading-[1.12] tracking-[-0.045em] text-ink ${
            featured
              ? 'min-[821px]:mt-5 min-[821px]:text-[clamp(40px,4vw,54px)]'
              : ''
          }`}
        >
          {product.name}
        </h3>
        <p
          className={`mt-3 text-[14px] leading-[1.65] text-ink-soft ${
            featured
              ? 'min-[821px]:mt-3.5 min-[821px]:max-w-[420px] min-[821px]:text-[16px]'
              : ''
          }`}
        >
          {productExcerpt(product, featured ? 128 : 82)}
        </p>
        <span
          className={`${textLinkClassName()} mt-auto pt-[22px] ${
            featured ? 'min-[821px]:pt-[34px]' : ''
          }`}
        >
          了解这项服务
          <ArrowUpRight
            className={`${iconSm} transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[2px]`}
          />
        </span>
      </div>
    </Link>
  )
}
