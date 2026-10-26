/**
 * Nhập sản phẩm theo Catalog RENCO 2026 v3.0 — dùng được trên bản thật (khác `pnpm seed`: KHÔNG xoá dữ liệu).
 *
 *   pnpm payload run src/seed/catalog-v3/run.ts            # chạy thử: chỉ in ra sẽ làm gì, không ghi
 *   NHAP_GHI=1 pnpm payload run src/seed/catalog-v3/run.ts # ghi thật
 *   NHAP_XUAT_BAN=1                                        # thêm biến này: xuất bản luôn (Giám đốc đã duyệt theo catalog)
 *
 * Việc làm:
 * - Dòng sản phẩm: cập nhật tên, câu ngắn, mô tả theo catalog (giữ mã, đường dẫn, màu, ảnh, ghi chú).
 * - Sản phẩm: thêm mới hoặc cập nhật theo mã. Giữ ảnh, tài liệu, trạng thái bán, nhãn tái chế, nơi sản xuất của sản phẩm đã có.
 * - Quy cách: thêm hoặc cập nhật theo mã quy cách. Số đổi thì trạng thái số liệu quay về "Đề xuất" (BR-04).
 *   Quy cách cũ của sản phẩm catalog mà catalog không có (vd. 3 cỡ mẫu của RC-S01) bị xoá.
 * - Sản phẩm cũ không có trong catalog (RETIRED_CODES): chuyển về nháp — ẩn khỏi web, còn trong quản trị.
 * - Trang Sản phẩm: chỉ đổi chữ "Năm dòng" → "Bốn dòng" ở tiêu đề (nếu còn).
 * Không đụng: lead, người dùng, nội dung trang khác, ảnh, tài liệu, hồ sơ hợp quy, cài đặt.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { Product, Variant } from '../../payload-types'
import { LINES, PRODUCTS, RETIRED_CODES, type CatalogProduct } from './data'

const WRITE = process.env.NHAP_GHI === '1'
const PUBLISH = process.env.NHAP_XUAT_BAN === '1'
// Không bỏ nhật ký thay đổi: bản thật cần biết ai/khi nào đổi sản phẩm.
const ctx = { disableRevalidate: true }

const SPEC_KEYS = ['dnMm', 'eMm', 'idMm', 'odMm', 'odMaxMm', 'lengthM', 'lengthMm', 'widthMm', 'thicknessMm', 'pnBar', 'weightKgPerM', 'weightKgPerCoilMin', 'weightKgPerCoilMax', 'coilLengthM'] as const
const VARIANT_KEYS = [...SPEC_KEYS, 'pipeSeries', 'wallClass'] as const

const log: string[] = []
const note = (s: string) => log.push(s)
const count = { lines: 0, productsNew: 0, productsUpdated: 0, productsRetired: 0, variantsNew: 0, variantsUpdated: 0, variantsUnchanged: 0, variantsDeleted: 0, specReset: 0 }

async function findOne<T>(payload: Payload, collection: 'products' | 'variants' | 'product-lines', field: string, value: string) {
  const res = await payload.find({ collection, where: { [field]: { equals: value } }, depth: 0, limit: 1, overrideAccess: true, locale: 'vi' })
  return (res.docs[0] as T | undefined) ?? null
}

async function syncLines(payload: Payload) {
  const ids: Record<string, number> = {}
  for (const l of LINES) {
    const line = await findOne<{ id: number }>(payload, 'product-lines', 'code', l.code)
    if (!line) throw new Error(`Không thấy dòng ${l.code}. Dừng — không tự tạo dòng mới.`)
    ids[l.code] = line.id
    count.lines++
    note(`Dòng ${l.code}: cập nhật tên «${l.name.vi}»`)
    if (!WRITE) continue
    for (const locale of ['vi', 'en'] as const) {
      await payload.update({
        collection: 'product-lines',
        id: line.id,
        locale,
        overrideAccess: true,
        context: ctx,
        data: { name: l.name[locale], tagline: l.tagline[locale], description: l.description[locale] },
      })
    }
  }
  return ids
}

async function syncProduct(payload: Payload, p: CatalogProduct, lineId: number, order: number, defaultStatus: Product['saleStatus']) {
  const existing = await findOne<Product>(payload, 'products', 'code', p.code)
  // Không xuất bản: mọi sản phẩm catalog thành nháp chờ duyệt (kể cả sản phẩm đang hiện), tránh nội dung mới lên web khi chưa duyệt.
  const review = PUBLISH
    ? { status: 'approved' as const, note: `Giám đốc duyệt theo Catalog RENCO 2026 v3.0 (nhập bằng script ${new Date().toISOString().slice(0, 10)}).` }
    : { status: 'pending' as const, note: 'Nhập theo Catalog RENCO 2026 v3.0 — chờ duyệt.' }
  const status = PUBLISH ? ('published' as const) : ('draft' as const)
  const content = (locale: 'vi' | 'en') => ({
    name: p.name[locale],
    slug: p.slug[locale],
    groupLabel: p.group?.[locale] ?? null,
    summary: p.summary[locale],
    uses: p.uses?.[locale] ?? [],
    standardText: p.standardText?.[locale] ?? null,
  })

  let id: number
  if (existing) {
    count.productsUpdated++
    note(`Sản phẩm ${p.code}: cập nhật (${p.variants.length} quy cách)`)
    id = existing.id
    if (WRITE) {
      await payload.update({
        collection: 'products',
        id,
        locale: 'vi',
        overrideAccess: true,
        context: ctx,
        data: { ...content('vi'), line: lineId, order, specTemplate: p.template ?? null, legalReview: review, _status: status },
      })
    }
  } else {
    count.productsNew++
    note(`Sản phẩm ${p.code}: thêm mới «${p.name.vi}» (${p.variants.length} quy cách)`)
    if (!WRITE) {
      count.variantsNew += p.variants.length
      return
    }
    const doc = await payload.create({
      collection: 'products',
      locale: 'vi',
      overrideAccess: true,
      context: ctx,
      data: {
        ...content('vi'),
        code: p.code,
        line: lineId,
        order,
        specTemplate: p.template ?? null,
        manufacturerText: 'Nhà máy REN Group tại Tangerang, Indonesia',
        saleStatus: defaultStatus,
        claimLevel: 'none',
        legalReview: review,
        _status: status,
      },
    })
    id = doc.id
  }
  if (WRITE) {
    await payload.update({
      collection: 'products',
      id,
      locale: 'en',
      overrideAccess: true,
      context: ctx,
      data: { ...content('en'), ...(existing ? {} : { manufacturerText: 'REN Group factory in Tangerang, Indonesia' }), _status: status },
    })
  }
  await syncVariants(payload, p, id)
}

async function syncVariants(payload: Payload, p: CatalogProduct, productId: number) {
  const keep = new Set(p.variants.map((v) => v.sku))
  let order = 0
  for (const v of p.variants) {
    const existing = await findOne<Variant>(payload, 'variants', 'sku', v.sku)
    const data: Record<string, unknown> = { product: productId, order: order++, sizeLabel: v.size.vi }
    for (const k of VARIANT_KEYS) data[k] = v.values[k] ?? null
    if (!existing) {
      count.variantsNew++
      if (!WRITE) continue
      const doc = await payload.create({ collection: 'variants', locale: 'vi', overrideAccess: true, context: ctx, data: { ...data, sku: v.sku, specStatus: 'proposed' } as never })
      await payload.update({ collection: 'variants', id: doc.id, locale: 'en', overrideAccess: true, context: ctx, data: { sizeLabel: v.size.en } })
      continue
    }
    const raw = existing as unknown as Record<string, unknown>
    const specChanged = SPEC_KEYS.some((k) => (raw[k] ?? null) !== (data[k] ?? null))
    const otherChanged = ['product', 'order', 'sizeLabel', 'pipeSeries', 'wallClass'].some((k) => (raw[k] ?? null) !== (data[k] ?? null))
    if (!specChanged && !otherChanged) {
      count.variantsUnchanged++
      continue
    }
    count.variantsUpdated++
    // BR-04: số đổi thì phải xác nhận lại.
    if (specChanged && existing.specStatus !== 'proposed') count.specReset++
    if (!WRITE) continue
    await payload.update({
      collection: 'variants',
      id: existing.id,
      locale: 'vi',
      overrideAccess: true,
      context: ctx,
      data: { ...data, ...(specChanged ? { specStatus: 'proposed' } : {}) } as never,
    })
    await payload.update({ collection: 'variants', id: existing.id, locale: 'en', overrideAccess: true, context: ctx, data: { sizeLabel: v.size.en } })
  }
  // Quy cách của sản phẩm này mà catalog không có.
  const stale = await payload.find({ collection: 'variants', where: { product: { equals: productId } }, depth: 0, limit: 1000, pagination: false, overrideAccess: true })
  for (const s of stale.docs.filter((d) => !keep.has(d.sku))) {
    count.variantsDeleted++
    note(`  Xoá quy cách ${s.sku} (${s.sizeLabel}) của ${p.code} — catalog không có`)
    if (WRITE) await payload.delete({ collection: 'variants', id: s.id, overrideAccess: true, context: ctx })
  }
}

/** Tiêu đề trang Sản phẩm còn ghi "Năm dòng" (bản yêu cầu v0.1): chỉ thay đúng chữ đó, không đụng phần khác của trang. */
async function fixProductsTitle(payload: Payload) {
  const res = await payload.find({ collection: 'pages', where: { key: { equals: 'products' } }, depth: 0, limit: 1, overrideAccess: true, locale: 'all' })
  const page = res.docs[0] as unknown as { id: number; title?: Record<string, string> } | undefined
  if (!page?.title) return
  const next: Record<string, string> = {}
  if (page.title.vi?.includes('Năm dòng')) next.vi = page.title.vi.replace('Năm dòng', 'Bốn dòng')
  if (page.title.en?.includes('Five')) next.en = page.title.en.replace('Five', 'Four')
  for (const [locale, title] of Object.entries(next)) {
    note(`Trang Sản phẩm (${locale}): tiêu đề «${page.title[locale]}» → «${title}»`)
    if (WRITE) await payload.update({ collection: 'pages', id: page.id, locale: locale as 'vi' | 'en', overrideAccess: true, context: ctx, data: { title } })
  }
}

async function retire(payload: Payload) {
  for (const code of RETIRED_CODES) {
    const p = await findOne<Product>(payload, 'products', 'code', code)
    if (!p || p._status !== 'published') continue
    count.productsRetired++
    note(`Sản phẩm cũ ${code} «${p.name}»: chuyển về nháp (ẩn khỏi web)`)
    if (WRITE) await payload.update({ collection: 'products', id: p.id, overrideAccess: true, context: ctx, data: { _status: 'draft' } })
  }
}

const payload = await getPayload({ config })
payload.logger.info(WRITE ? `NHẬP CATALOG v3.0 — GHI THẬT${PUBLISH ? ' + XUẤT BẢN' : ''}` : 'NHẬP CATALOG v3.0 — CHẠY THỬ (không ghi gì)')

const lineIds = await syncLines(payload)
// Trạng thái bán của sản phẩm mới: lấy theo sản phẩm đang có cùng dòng; ống PVC-U luôn "Sắp ra mắt" (BR-01 cần hồ sơ hợp quy).
const statusOf = async (lineCode: string): Promise<Product['saleStatus']> => {
  if (lineCode === 'RC-P') return 'coming_soon'
  const res = await payload.find({ collection: 'products', where: { line: { equals: lineIds[lineCode] } }, depth: 0, limit: 1, sort: 'order', overrideAccess: true })
  const s = res.docs[0]?.saleStatus
  return s && s !== 'draft' ? s : 'coming_soon'
}
const statusByLine: Record<string, Product['saleStatus']> = {}
for (const code of Object.keys(lineIds)) statusByLine[code] = await statusOf(code)

let order = 0
for (const p of PRODUCTS) await syncProduct(payload, p, lineIds[p.line], (order += 10), statusByLine[p.line])
await retire(payload)
await fixProductsTitle(payload)

payload.logger.info(log.join('\n'))
payload.logger.info(`Tổng: ${JSON.stringify(count)}`)
payload.logger.info(WRITE ? 'Xong. Khởi động lại web để xoá bộ nhớ đệm.' : 'Chạy thử xong — chưa ghi gì. Thêm NHAP_GHI=1 để ghi thật.')
process.exit(0)
