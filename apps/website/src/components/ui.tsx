import type { ReactNode } from 'react'

export function PageShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1180px] px-5 min-[821px]:px-[26px] ${className}`}
    >
      {children}
    </div>
  )
}

export function Eyebrow({
  children,
  light = false,
  className = '',
}: {
  children: ReactNode
  light?: boolean
  className?: string
}) {
  return (
    <p
      className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
        light ? 'text-white/55' : 'text-blue'
      } ${className}`}
    >
      {children}
    </p>
  )
}

export const iconSm = 'size-[17px] shrink-0'

export const iconMd = 'size-5 shrink-0'

export function buttonClassName(
  tone: 'primary' | 'quiet' | 'light' | 'dark' = 'primary'
) {
  const base =
    'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-[22px] py-[11px] text-[14px] font-medium leading-[1.2] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/35 focus-visible:ring-offset-2 hover:-translate-y-px'

  const tones = {
    primary: 'bg-blue text-white hover:bg-[#0077ed]',
    quiet: 'bg-transparent text-blue hover:bg-blue/[0.06]',
    light: 'bg-white text-ink hover:bg-soft',
    dark: 'bg-ink text-white hover:bg-black',
  }

  return `${base} ${tones[tone]}`
}

export function textLinkClassName(large = false) {
  return `inline-flex items-center gap-1.5 font-medium text-blue underline-offset-[3px] transition-colors hover:text-[#0077ed] hover:underline ${
    large ? 'text-[16px]' : 'text-[13px]'
  }`
}
