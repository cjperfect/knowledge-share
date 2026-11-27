import Link from 'next/link'

export function resolvePage(
  value: string | string[] | undefined,
  totalPages: number
) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number.parseInt(raw ?? '1', 10)
  if (!Number.isFinite(page)) return 1
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1))
}

function pageHref(basePath: string, page: number) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`
}

function visiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('ellipsis')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < total - 1) pages.push('ellipsis')
  pages.push(total)
  return pages
}

const pageItem =
  'inline-flex h-[34px] min-w-[34px] items-center justify-center rounded-full border border-line px-2.5 text-[11px] text-ink-soft transition duration-[180ms] ease-out hover:-translate-y-px hover:border-blue/30 hover:text-ink min-[561px]:h-[38px] min-[561px]:min-w-[38px] min-[561px]:px-[13px] min-[561px]:text-xs'

export function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number
  totalPages: number
  basePath: string
}) {
  const pages = visiblePages(currentPage, totalPages)

  return (
    <nav
      className='mt-[34px] flex items-center justify-center gap-1.5 border-t border-line pt-[22px] min-[561px]:mt-[46px] min-[561px]:gap-2.5 min-[561px]:pt-[26px]'
      aria-label='分页'
    >
      <Link
        href={pageHref(basePath, Math.max(1, currentPage - 1))}
        aria-disabled={currentPage <= 1}
        className={`${pageItem} ${currentPage <= 1 ? 'pointer-events-none opacity-35' : ''}`}
      >
        上一页
      </Link>

      <div className='flex items-center gap-[5px] min-[561px]:gap-[7px]'>
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className='px-0.5 text-[11px] text-faint min-[561px]:text-xs'
            >
              …
            </span>
          ) : (
            <Link
              key={page}
              href={pageHref(basePath, page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`${pageItem} ${
                page === currentPage
                  ? 'border-ink bg-ink text-white hover:border-ink hover:text-white'
                  : ''
              }`}
            >
              {page}
            </Link>
          )
        )}
      </div>

      <Link
        href={pageHref(basePath, Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage >= totalPages}
        className={`${pageItem} ${
          currentPage >= totalPages ? 'pointer-events-none opacity-35' : ''
        }`}
      >
        下一页
      </Link>
    </nav>
  )
}
