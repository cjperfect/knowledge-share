import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import { PageHero } from '@/components/page-hero'
import { Pagination, resolvePage } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'
import { iconSm, PageShell, textLinkClassName } from '@/components/ui'
import { getProducts } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '产品',
  description:
    '研途产品：围绕保研定位、材料准备与面试表达，把下一步拆成可以执行的事。',
}

const pageSize = 4

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const { page } = await searchParams
  const products = await getProducts()
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize))
  const currentPage = resolvePage(page, totalPages)
  const pageProducts = products.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const featured =
    currentPage === 1
      ? (pageProducts.find((product) => product.name.includes('定位')) ??
        pageProducts[0])
      : undefined
  const rest = featured
    ? pageProducts.filter((product) => product.id !== featured.id)
    : pageProducts

  return (
    <main>
      <PageHero
        eyebrow='研途产品'
        index='PRODUCTS / 01'
        title={
          <h1>
            每件产品，
            <br />
            对应一个
            <br />
            <span className='text-blue'>更清楚的下一步。</span>
          </h1>
        }
        aside={
          <p>
            不替你做完所有事，只把最值得做的那一步讲清楚。
            定位、材料、面试，每一件都对应一个真实的卡点。
          </p>
        }
      />

      <section className='bg-white py-[88px] min-[821px]:py-[124px]'>
        <PageShell>
          {pageProducts.length ? (
            <div className='grid grid-cols-1 gap-[22px] min-[821px]:grid-cols-2 min-[1081px]:grid-cols-3'>
              {featured && (
                <ProductCard product={featured} featured order={1} />
              )}
              {rest.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  order={index + (featured ? 2 : 1)}
                />
              ))}
            </div>
          ) : (
            <div className='grid gap-4 py-[70px] text-muted'>
              <p>产品正在整理中。</p>
              <Link className={textLinkClassName()} href='/activities'>
                去看活动回顾
                <ArrowRight className={iconSm} />
              </Link>
            </div>
          )}

          {products.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath='/products'
            />
          )}
        </PageShell>
      </section>
    </main>
  )
}
