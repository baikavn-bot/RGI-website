import type { Metadata } from 'next'

import type { Locale } from './constants'
import { LOCALES } from './constants'
import { href, type RouteKey, siteUrl } from './routes'

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)

type Alt = { vi: string; en: string }

/** Metadata chuẩn: tiêu đề ≤ 60, mô tả ≤ 155, canonical theo ngôn ngữ, hreflang vi/en/x-default. */
export function buildMetadata({
  locale,
  title,
  description,
  paths,
  image,
  noindex,
}: {
  locale: Locale
  title: string
  description?: string | null
  paths: Alt
  image?: string | null
  noindex?: boolean
}): Metadata {
  const base = siteUrl()
  const url = base + paths[locale]
  return {
    title: title.length > 60 ? title.slice(0, 59) + '…' : title,
    description: description ? (description.length > 155 ? description.slice(0, 154) + '…' : description) : undefined,
    metadataBase: new URL(base),
    alternates: {
      canonical: url,
      languages: { vi: base + paths.vi, en: base + paths.en, 'x-default': base + paths.vi },
    },
    openGraph: {
      title,
      description: description ?? undefined,
      url,
      siteName: 'RENCO',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      type: 'website',
      images: image ? [{ url: image }] : [{ url: '/brand/og.jpg', width: 1200, height: 630 }],
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  }
}

export const routePaths = (key: RouteKey, ...rest: string[]): Alt => ({
  vi: href('vi', key, ...rest),
  en: href('en', key, ...rest),
})
