/**
 * Bảng đường dẫn Việt – Anh (mục 6 blueprint).
 * Bên trong ứng dụng mọi trang nằm dưới /[lang]/<khoá tiếng Anh>.
 * Tiếng Anh: đường dẫn công khai trùng đường dẫn nội bộ (/en/products…).
 * Tiếng Việt: proxy.ts đổi /san-pham → /vi/products.
 */
import type { Locale } from './constants'

export const ROUTES = {
  home: { vi: '', en: '' },
  about: { vi: 've-renco', en: 'about' },
  factory: { vi: 'nha-may', en: 'factory' },
  products: { vi: 'san-pham', en: 'products' },
  partners: { vi: 'hop-tac', en: 'partners' },
  samples: { vi: 'bo-mau', en: 'samples' },
  downloads: { vi: 'tai-lieu', en: 'downloads' },
  contact: { vi: 'lien-he', en: 'contact' },
  terms: { vi: 'dieu-khoan', en: 'terms' },
  privacy: { vi: 'du-lieu-ca-nhan', en: 'privacy' },
  thankYou: { vi: 'cam-on', en: 'thank-you' },
} as const

export type RouteKey = keyof typeof ROUTES

/** Đoạn đầu đường dẫn tiếng Việt → khoá nội bộ (tiếng Anh). */
export const VI_TO_INTERNAL: Record<string, string> = Object.fromEntries(
  Object.values(ROUTES)
    .filter((r) => r.vi)
    .map((r) => [r.vi, r.en]),
)

export const INTERNAL_TO_VI: Record<string, string> = Object.fromEntries(
  Object.values(ROUTES)
    .filter((r) => r.en)
    .map((r) => [r.en, r.vi]),
)

/** Đường dẫn công khai của một trang. */
export function href(locale: Locale, key: RouteKey, ...rest: (string | undefined)[]): string {
  const seg = ROUTES[key][locale]
  const tail = rest.filter(Boolean).join('/')
  const base = locale === 'en' ? `/en${seg ? '/' + seg : ''}` : `/${seg}`
  const path = tail ? `${base.replace(/\/$/, '')}/${tail}` : base
  return path === '' ? '/' : path
}

/** Đổi một đường dẫn nội bộ /vi|en/<khoá>/... thành đường dẫn công khai. */
export function publicPath(locale: Locale, internalRest: string[]): string {
  const [first, ...more] = internalRest
  if (!first) return locale === 'en' ? '/en' : '/'
  if (locale === 'en') return ['/en', first, ...more].join('/')
  const vi = INTERNAL_TO_VI[first] ?? first
  return ['', vi, ...more].join('/')
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
