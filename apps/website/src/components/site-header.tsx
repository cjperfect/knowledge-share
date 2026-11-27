'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { label: '首页', href: '/' },
  { label: '产品', href: '/products' },
  { label: '活动回顾', href: '/activities' },
  { label: '邀请奖励', href: '/rewards' },
] as const

function isActive(item: (typeof navigation)[number], pathname: string) {
  if (item.href === '/') return pathname === '/'
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  function closeMenu() {
    setMenuOpen(false)
    window.requestAnimationFrame(() => menuButtonRef.current?.focus())
  }

  function trapFocus(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    )
    if (!focusable?.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        window.requestAnimationFrame(() => menuButtonRef.current?.focus())
      }
    }

    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) {
        setMenuOpen(false)
        document.body.style.overflow = previousOverflow
      }
    }

    const desktop = window.matchMedia('(min-width: 768px)')
    desktop.addEventListener('change', closeOnDesktop)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      desktop.removeEventListener('change', closeOnDesktop)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <>
      <header className='sticky top-0 z-50 border-b border-black/[0.06] bg-white/75 backdrop-blur-2xl backdrop-saturate-150'>
        <div className='relative mx-auto flex h-14 w-full max-w-[1180px] items-center gap-4 px-5 sm:gap-8 sm:px-7'>
          <Link
            href='/'
            className='flex flex-none items-center gap-2.5'
            aria-label='研途首页'
          >
            <span className='grid h-[29px] w-[29px] place-items-center rounded-full bg-[#1d1d1f] text-[14px] font-bold leading-none text-white'>
              Y
            </span>
            <span className='hidden text-[15px] font-semibold tracking-[0.02em] text-[#1d1d1f] min-[360px]:inline'>
              研途
            </span>
          </Link>

          <nav
            className='absolute top-0 left-1/2 hidden h-full -translate-x-1/2 items-center gap-4 sm:gap-7 md:flex'
            aria-label='主导航'
          >
            {navigation.map((item) => {
              const active = isActive(item, pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className="group relative flex h-14 items-center after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-center after:scale-x-0 after:rounded-full after:bg-[#0071e3] after:content-[''] after:transition-transform after:duration-300 aria-[current=page]:after:scale-x-100"
                >
                  <span
                    className={`text-[12px] tracking-[0.01em] transition-colors duration-200 ${
                      active
                        ? 'font-medium text-[#1d1d1f]'
                        : 'text-[#6e6e73] group-hover:text-[#1d1d1f]'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <button
            ref={menuButtonRef}
            type='button'
            className='ml-auto grid size-10 place-items-center rounded-full text-[#1d1d1f] transition-colors hover:bg-black/[0.04] md:hidden'
            aria-label='打开导航菜单'
            aria-controls='site-navigation-drawer'
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <svg
              width='20'
              height='20'
              viewBox='0 0 20 20'
              fill='none'
              aria-hidden='true'
            >
              <path
                d='M3.5 6h13M3.5 10h13M3.5 14h13'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
              />
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className='fixed inset-0 z-[60] md:hidden'>
          <button
            type='button'
            aria-label='关闭导航菜单'
            tabIndex={-1}
            className='absolute inset-0 animate-[nav-backdrop-in_180ms_ease-out_both] bg-black/35 backdrop-blur-[2px]'
            onClick={closeMenu}
          />

          <aside
            ref={panelRef}
            id='site-navigation-drawer'
            role='dialog'
            aria-modal='true'
            aria-label='站点导航'
            onKeyDown={trapFocus}
            className='absolute top-0 right-0 flex h-[100dvh] w-[min(84vw,320px)] animate-[nav-drawer-in_320ms_cubic-bezier(0.22,1,0.36,1)_both] flex-col bg-[#fbfbfd] shadow-[-20px_0_60px_rgba(0,0,0,0.18)]'
          >
            <div className='flex h-14 shrink-0 items-center justify-between border-b border-black/[0.07] px-5'>
              <Link
                href='/'
                className='flex items-center gap-2.5'
                aria-label='研途首页'
                onClick={closeMenu}
              >
                <span className='grid h-[29px] w-[29px] place-items-center rounded-full bg-[#1d1d1f] text-[14px] font-bold leading-none text-white'>
                  Y
                </span>
                <span className='text-[15px] font-semibold tracking-[0.02em] text-[#1d1d1f]'>
                  研途
                </span>
              </Link>

              <button
                ref={closeButtonRef}
                type='button'
                className='grid size-10 place-items-center rounded-full text-[#1d1d1f] transition-colors hover:bg-black/[0.04]'
                aria-label='关闭导航菜单'
                onClick={closeMenu}
              >
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 18 18'
                  fill='none'
                  aria-hidden='true'
                >
                  <path
                    d='m3.5 3.5 11 11M14.5 3.5 3.5 14.5'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                </svg>
              </button>
            </div>

            <nav
              className='flex-1 overflow-y-auto px-5 py-6'
              aria-label='主导航'
            >
              {navigation.map((item, index) => {
                const active = isActive(item, pathname)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={closeMenu}
                    className='group flex items-center justify-between border-b border-black/[0.07] py-4 last:border-b-0'
                  >
                    <span className='flex items-baseline gap-4'>
                      <span
                        className={`text-[10px] font-medium tracking-[0.12em] tabular-nums ${
                          active ? 'text-[#0071e3]' : 'text-[#86868b]'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`text-[23px] font-semibold tracking-[-0.035em] ${
                          active ? 'text-[#0071e3]' : 'text-[#1d1d1f]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </span>
                    <span
                      aria-hidden='true'
                      className={`size-1.5 rounded-full transition-colors ${
                        active ? 'bg-[#0071e3]' : 'bg-transparent'
                      }`}
                    />
                  </Link>
                )
              })}
            </nav>

            <div className='shrink-0 border-t border-black/[0.07] px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]'>
              <p className='text-[11px] leading-5 text-[#86868b]'>
                研途 · 保研知识分享
                <br />
                把保研这件事，做得更清楚。
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
