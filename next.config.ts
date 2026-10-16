import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    globalNotFound: true,
    // Nhúng CSS vào HTML để bỏ các yêu cầu CSS chặn hiển thị (mục 17: LCP ≤ 2,5 s trên 4G).
    inlineCss: true,
  },
  images: {
    formats: ['image/webp'], // ảnh nguồn đã là WebP; bỏ AVIF để máy chủ nhỏ không tốn CPU nén lại
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '') + (process.env.NEXT_PUBLIC_UMAMI_SRC ? ' ' + new URL(process.env.NEXT_PUBLIC_UMAMI_SRC).origin : ''),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'" + (process.env.NEXT_PUBLIC_UMAMI_SRC ? ' ' + new URL(process.env.NEXT_PUBLIC_UMAMI_SRC).origin : ''),
      'frame-src https://challenges.cloudflare.com',
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ')
    return [
      {
        source: '/((?!admin|api).*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      { source: '/brand/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    ]
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
