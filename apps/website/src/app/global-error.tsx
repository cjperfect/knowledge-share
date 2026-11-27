'use client'
import './globals.css'

import { buttonClassName } from '@/components/ui'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang='zh-CN'>
      <body className='grid min-h-screen place-items-center bg-soft-2 text-ink'>
        <main className='max-w-[560px] px-6 py-8 text-center'>
          <p className='m-0 text-[13px] tracking-[2px] text-muted'>500</p>
          <h1 className='mx-0 mt-4 mb-3 text-[36px] leading-[1.3]'>
            页面出了点问题
          </h1>
          <p className='m-0 leading-[1.8] text-muted'>
            很抱歉，页面暂时无法正常加载，请稍后重试。
          </p>
          <button
            type='button'
            onClick={reset}
            className={`${buttonClassName('dark')} mt-7`}
          >
            重新加载
          </button>
        </main>
      </body>
    </html>
  )
}
