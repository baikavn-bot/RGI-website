/**
 * Đọc dữ liệu cho website công khai. Mọi truy vấn chạy với quyền khách (overrideAccess: false),
 * nên chỉ nhận được nội dung đã xuất bản, ảnh đã xác nhận quyền dùng, số liệu đã xác nhận.
 * Kết quả được cache theo thẻ "site"; hook trong CMS xoá cache khi nội dung đổi.
 */
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Document, Media, Page, Product, ProductLine, Setting, Variant } from '../payload-types'
import type { Locale } from './constants'

export const SITE_TAG = 'site'

const payload = () => getPayload({ config })

const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) =>
  unstable_cache(fn, [key], { tags: [SITE_TAG], revalidate: 3600 })

export const getSettings = cached(async (locale: Locale): Promise<Setting> => {
  const p = await payload()
  return p.findGlobal({ slug: 'settings', locale, depth: 0, overrideAccess: false })
}, 'settings')

export const getPage = cached(async (key: string, locale: Locale): Promise<Page | null> => {
  const p = await payload()
  const res = await p.find({
    collection: 'pages',
    where: { key: { equals: key } },
    locale,
    depth: 1,
    limit: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}, 'page')

export const getLines = cached(async (locale: Locale): Promise<ProductLine[]> => {
  const p = await payload()
  const res = await p.find({ collection: 'product-lines', locale, depth: 1, limit: 20, sort: 'order', overrideAccess: false })
  return res.docs
}, 'lines')

export const getLineBySlug = cached(async (slug: string, locale: Locale): Promise<ProductLine | null> => {
  const p = await payload()
  const res = await p.find({
    collection: 'product-lines',
    where: { slug: { equals: slug } },
    locale,
    depth: 1,
    limit: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}, 'line')

export const getProductsByLine = cached(async (lineId: number, locale: Locale): Promise<Product[]> => {
  const p = await payload()
  const res = await p.find({
    collection: 'products',
    where: { and: [{ line: { equals: lineId } }, { saleStatus: { in: ['coming_soon', 'on_sale', 'discontinued'] } }] },
    locale,
    depth: 1,
    limit: 100,
    sort: 'order',
    overrideAccess: false,
  })
  return res.docs
}, 'products-by-line')

export const getAllProducts = cached(async (locale: Locale): Promise<Product[]> => {
  const p = await payload()
  const res = await p.find({
    collection: 'products',
    where: { saleStatus: { in: ['coming_soon', 'on_sale', 'discontinued'] } },
    locale,
    depth: 1,
    limit: 500,
    sort: 'order',
    overrideAccess: false,
  })
  return res.docs
}, 'all-products')

export const getProduct = cached(async (slug: string, locale: Locale): Promise<Product | null> => {
  const p = await payload()
  const res = await p.find({
    collection: 'products',
    where: { and: [{ slug: { equals: slug } }, { saleStatus: { in: ['coming_soon', 'on_sale', 'discontinued'] } }] },
    locale,
    depth: 2,
    limit: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}, 'product')

export const getVariants = cached(async (productIds: number[], locale: Locale): Promise<Variant[]> => {
  if (!productIds.length) return []
  const p = await payload()
  const res = await p.find({
    collection: 'variants',
    where: { product: { in: productIds } },
    locale,
    depth: 0,
    limit: 500,
    sort: 'order',
    overrideAccess: false,
  })
  return res.docs
}, 'variants')

export const getComplianceFor = cached(async (productId: number) => {
  const p = await payload()
  const res = await p.find({
    collection: 'compliance-records',
    where: {
      and: [
        { product: { equals: productId } },
        { type: { equals: 'cr_declaration' } },
        { expiresOn: { greater_than: new Date().toISOString() } },
      ],
    },
    depth: 1,
    limit: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}, 'compliance')

export const getDocuments = cached(async (locale: Locale): Promise<Document[]> => {
  const p = await payload()
  const res = await p.find({ collection: 'documents', locale, depth: 0, limit: 100, sort: '-publishedOn', overrideAccess: false })
  return res.docs
}, 'documents')

export const getRedirect = cached(async (from: string) => {
  const p = await payload()
  const res = await p.find({ collection: 'redirects', where: { from: { equals: from } }, depth: 0, limit: 1, overrideAccess: false })
  return res.docs[0] ?? null
}, 'redirect')

/** Ảnh: chọn cỡ phù hợp, trả về null nếu không đọc được (chưa xác nhận quyền dùng). */
export function img(m: unknown, size: 'thumb' | 'card' | 'hero' = 'card') {
  if (!m || typeof m !== 'object') return null
  const media = m as Media
  const s = media.sizes?.[size]
  const raw = s?.url || media.url
  if (!raw) return null
  // Payload trả URL tuyệt đối (serverURL); website dùng đường dẫn tương đối để next/image tối ưu tại chỗ.
  const url = raw.replace(/^https?:\/\/[^/]+/, '')
  return { url, alt: media.alt ?? '', width: s?.width ?? media.width ?? 1200, height: s?.height ?? media.height ?? 800 }
}
