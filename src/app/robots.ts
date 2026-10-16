import type { MetadataRoute } from 'next'

// Đọc SITE_ENV lúc chạy, không lúc build (ảnh Docker build một lần, chạy ở staging và production).
export const dynamic = 'force-dynamic'

import { siteUrl } from '../lib/routes'

export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.SITE_ENV === 'production'
  // Staging và môi trường thử: chặn toàn bộ.
  if (!isProd) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/cam-on', '/en/thank-you'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
