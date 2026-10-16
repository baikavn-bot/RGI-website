import type { MetadataRoute } from 'next'

import { getAllProducts, getLines } from '../lib/data'
import { href, type RouteKey, siteUrl } from '../lib/routes'
import type { ProductLine } from '../payload-types'

export const dynamic = 'force-dynamic'

const STATIC: RouteKey[] = ['home', 'about', 'factory', 'products', 'partners', 'samples', 'downloads', 'contact', 'terms', 'privacy']

/** sitemap.xml tự sinh, có hreflang vi/en cho từng trang. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const entries: MetadataRoute.Sitemap = STATIC.map((key) => ({
    url: base + href('vi', key),
    alternates: { languages: { vi: base + href('vi', key), en: base + href('en', key) } },
    changeFrequency: 'monthly',
    priority: key === 'home' ? 1 : 0.7,
  }))
  try {
    const [linesVi, linesEn, prodVi, prodEn] = await Promise.all([getLines('vi'), getLines('en'), getAllProducts('vi'), getAllProducts('en')])
    for (const l of linesVi) {
      const en = linesEn.find((x) => x.id === l.id)
      entries.push({
        url: base + href('vi', 'products', l.slug),
        alternates: { languages: { vi: base + href('vi', 'products', l.slug), en: base + href('en', 'products', en?.slug ?? l.slug) } },
        priority: 0.8,
      })
    }
    for (const p of prodVi) {
      const lineVi = p.line as ProductLine
      const pe = prodEn.find((x) => x.id === p.id)
      const lineEn = linesEn.find((x) => x.id === lineVi.id)
      const vi = base + href('vi', 'products', lineVi.slug, p.slug)
      const en = base + href('en', 'products', lineEn?.slug ?? lineVi.slug, pe?.slug ?? p.slug)
      entries.push({ url: vi, lastModified: p.updatedAt, alternates: { languages: { vi, en } }, priority: 0.8 })
    }
  } catch {
    // Mất kết nối cơ sở dữ liệu: vẫn trả các trang tĩnh.
  }
  return entries
}
