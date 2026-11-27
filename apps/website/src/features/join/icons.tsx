import type { ReactNode, SVGProps } from 'react'

function Icon({
  children,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}

export function GraduationCapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d='M21.4 9.5 12 4.6 2.6 9.5 12 14.4l9.4-4.9Z' />
      <path d='M6.5 11.5v5.1c0 .8 2.5 2 5.5 2s5.5-1.2 5.5-2v-5.1' />
      <path d='M21.4 9.5v5.4' />
    </Icon>
  )
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x='3' y='4.5' width='18' height='16.5' rx='2.5' />
      <path d='M8 2.5v4M16 2.5v4M3 9.5h18' />
    </Icon>
  )
}

export function TicketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d='M3 8.2V6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v1.7a2.5 2.5 0 0 0 0 4.9v4.4A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-4.4a2.5 2.5 0 0 0 0-4.9Z' />
      <path d='M14 7v10' strokeDasharray='2 3' />
    </Icon>
  )
}

export function UserRoundIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx='12' cy='8' r='4' />
      <path d='M4.5 20.5c.7-4 3.6-6 7.5-6s6.8 2 7.5 6' />
    </Icon>
  )
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx='12' cy='12' r='9' />
      <path d='m8.2 12.2 2.6 2.6 5.2-5.4' />
    </Icon>
  )
}

export function QrCodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x='3' y='3' width='6.5' height='6.5' rx='1' />
      <rect x='14.5' y='3' width='6.5' height='6.5' rx='1' />
      <rect x='3' y='14.5' width='6.5' height='6.5' rx='1' />
      <path d='M14.5 14.5h2.8v2.8M20.5 14.5h.5v2.8M14 20.5h3.3M21 20.5h.5' />
    </Icon>
  )
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x='8' y='8' width='13' height='13' rx='2' />
      <path d='M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3' />
    </Icon>
  )
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d='M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5' />
      <path d='M4 19.5h16' />
    </Icon>
  )
}

export function LoaderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d='M20 12a8 8 0 1 1-2.4-5.7' />
    </Icon>
  )
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d='m6 6 12 12M18 6 6 18' />
    </Icon>
  )
}
