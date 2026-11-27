import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SiteChrome } from '@/components/site-chrome'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '研途｜把保研这件事，做得更清楚',
    template: '%s｜研途',
  },
  description:
    '研途是面向保研同学的知识分享平台，提供定位诊断、申请材料、面试模拟等产品，以及真实的经验分享活动。',
  keywords: ['保研', '夏令营', '预推免', '个人陈述', '面试', '研途'],
  openGraph: {
    title: '研途｜把保研这件事，做得更清楚',
    description: '从定位、材料到面试，把复杂的保研准备拆成可以完成的小事。',
    type: 'website',
    locale: 'zh_CN',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='zh-CN'>
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
