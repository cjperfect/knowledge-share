import type { NextConfig } from 'next'

const apiBase = (
  process.env.WEBSITE_API_BASE_URL ?? 'http://127.0.0.1:3001'
).replace(/\/$/, '')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`,
      },
    ]
  },
}

export default nextConfig
