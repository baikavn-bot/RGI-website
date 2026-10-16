/**
 * Test hồi quy cho các lỗi tìm thấy ở lượt rà soát độc lập (16/10/2026).
 */
import config from '@payload-config'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { submitLead } from '../../src/endpoints/submitLead'

let payload: Payload
type U = { id: number; email: string; role: string; collection: 'users' }
const users: Record<string, U> = {}
const as = (u: U) => ({ user: u, overrideAccess: false })
const meta = { ip: '10.9.9.9', userAgent: 'vitest' }
let pipeLine: number
let pipe: number

async function rejects(p: Promise<unknown>) {
  let err: unknown
  try {
    await p
  } catch (e) {
    err = e
  }
  expect(err, 'phải bị từ chối').toBeTruthy()
}

beforeAll(async () => {
  payload = await getPayload({ config })
  for (const slug of ['lead-activities', 'leads', 'consents', 'variants', 'compliance-records', 'products', 'product-lines', 'pages', 'users'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } }, overrideAccess: true, trash: slug === 'leads' ? true : undefined, context: { skipAudit: true } })
  }
  for (const role of ['director', 'marketing', 'sales', 'editor', 'legal', 'tech']) {
    const email = `h-${role}@renco.test`
    const u = await payload.create({ collection: 'users', overrideAccess: true, data: { email, password: 'Test-password-123', name: role, role: role as never } })
    users[role] = { id: u.id, email, role, collection: 'users' }
  }
  pipeLine = (await payload.create({ collection: 'product-lines', overrideAccess: true, data: { code: 'RC-P', color: '#1846D6', name: 'Ống uPVC', slug: 'ong-upvc-h' } })).id
  pipe = (
    await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: { code: 'RC-P-H', line: pipeLine, name: 'Ống', slug: 'ong-h', manufacturerText: 'Nhà máy REN Group', saleStatus: 'coming_soon', claimLevel: 'none', legalReview: { status: 'approved' }, _status: 'published' },
    })
  ).id
}, 240_000)

afterAll(async () => {
  await payload?.destroy?.()
})

describe('Khoá trường nhạy cảm', () => {
  it('Sales không tự bật nhận email mọi lead', async () => {
    const r = await payload.update({ collection: 'users', id: users.sales.id, data: { notifyLeads: true }, ...as(users.sales) })
    expect(r.notifyLeads).toBe(false)
  })

  it('Quản lý marketing không đổi được mã dòng RC-P', async () => {
    const r = await payload.update({ collection: 'product-lines', id: pipeLine, data: { code: 'RC-X' }, ...as(users.marketing) })
    expect(r.code).toBe('RC-P')
  })

  it('Trang Chính sách dữ liệu luôn cần Pháp chế, dù đổi loại trang', async () => {
    await payload.create({ collection: 'pages', overrideAccess: true, draft: true, data: { key: 'privacy', kind: 'legal', title: 'Chính sách', _status: 'draft' } as never })
    const page = (await payload.find({ collection: 'pages', where: { key: { equals: 'privacy' } }, overrideAccess: true, draft: true })).docs[0]
    await rejects(payload.update({ collection: 'pages', id: page.id, data: { kind: 'standard', _status: 'published' } as never, ...as(users.marketing) }))
  })

  it('Ghi chú duyệt của Pháp chế không lộ ra API công khai', async () => {
    const anon = await payload.findByID({ collection: 'products', id: pipe, overrideAccess: false })
    expect(anon.legalReview).toBeUndefined()
  })

  it('Sales không sửa được bằng chứng đồng ý, mã yêu cầu của lead', async () => {
    const r = await submitLead(payload, { type: 'contact', locale: 'vi', contactName: 'Chị H', phone: '0911222333', consent: true }, meta)
    if (!r.ok) throw new Error('lead')
    await payload.update({ collection: 'leads', id: r.leadId, overrideAccess: true, data: { owner: users.sales.id } })
    const after = await payload.update({ collection: 'leads', id: r.leadId, data: { refCode: 'FAKE', consent: null, mergedCount: 99 } as never, ...as(users.sales) })
    expect(after.refCode).toBe(r.refCode)
    expect(after.consent).toBeTruthy()
    expect(after.mergedCount).toBe(0)
  })

  it('Gửi lại form tạo bằng chứng đồng ý mới cho lần gửi đó', async () => {
    const r = await submitLead(payload, { type: 'contact', locale: 'vi', contactName: 'Chị H', phone: '0911222333', email: 'h@example.com', consent: true }, meta)
    expect(r.ok && r.merged).toBe(true)
    if (!r.ok) return
    const act = await payload.find({ collection: 'lead-activities', where: { and: [{ lead: { equals: r.leadId } }, { kind: { equals: 'form_resubmit' } }] }, overrideAccess: true })
    expect(act.docs[0].consent).toBeTruthy()
    const lead = await payload.findByID({ collection: 'leads', id: r.leadId, overrideAccess: true })
    expect(lead.email).toBe('h@example.com')
  })
})

describe('Hồ sơ hợp quy', () => {
  let rec: number
  beforeAll(async () => {
    rec = (
      await payload.create({
        collection: 'compliance-records',
        overrideAccess: true,
        data: { product: pipe, type: 'cr_declaration', certNo: 'G', certBody: 'B', registrationNo: 'R', issuedOn: '2026-01-01', expiresOn: '2030-01-01', status: 'approved' } as never,
      })
    ).id
    await payload.update({ collection: 'products', id: pipe, data: { saleStatus: 'on_sale' }, ...as(users.director) })
  })

  it('Pháp chế sửa hồ sơ đã duyệt → về nháp, sản phẩm về "Sắp ra mắt"', async () => {
    const r = await payload.update({ collection: 'compliance-records', id: rec, data: { registrationNo: 'R2' }, ...as(users.legal) })
    expect(r.status).toBe('draft')
    const p = await payload.findByID({ collection: 'products', id: pipe, overrideAccess: true })
    expect(p.saleStatus).toBe('coming_soon')
  })

  it('Tự hạ trạng thái không trộn bản nháp chưa duyệt vào trang công khai', async () => {
    await payload.update({ collection: 'compliance-records', id: rec, data: { status: 'approved' }, ...as(users.director) })
    await payload.update({ collection: 'products', id: pipe, data: { saleStatus: 'on_sale' }, ...as(users.director) })
    await payload.update({ collection: 'products', id: pipe, draft: true, data: { name: 'Tên nháp chưa duyệt' }, ...as(users.editor) })
    await payload.delete({ collection: 'compliance-records', id: rec, ...as(users.director) })
    const published = await payload.findByID({ collection: 'products', id: pipe, overrideAccess: false })
    expect(published.saleStatus).toBe('coming_soon')
    expect(published.name).toBe('Ống')
    expect(published._status).toBe('published')
  })
})

describe('Quy cách của sản phẩm chưa xuất bản', () => {
  it('khách không thấy', async () => {
    const draft = await payload.create({
      collection: 'products',
      overrideAccess: true,
      draft: true,
      data: { code: 'RC-P-D', line: pipeLine, name: 'Nháp', slug: 'nhap', manufacturerText: 'x', saleStatus: 'coming_soon', claimLevel: 'none', _status: 'draft' } as never,
    })
    await payload.create({ collection: 'variants', overrideAccess: true, data: { sku: 'RC-P-D1', product: draft.id, sizeLabel: 'Ø1', specStatus: 'proposed' } })
    const anon = await payload.find({ collection: 'variants', where: { sku: { equals: 'RC-P-D1' } }, overrideAccess: false })
    expect(anon.docs).toHaveLength(0)
  })
})

describe('Quyền dùng ảnh', () => {
  it('Quản lý marketing tải ảnh mới, xác nhận quyền ngay thì giữ nguyên', async () => {
    const m = await payload.create({
      collection: 'media',
      filePath: path.resolve(process.cwd(), 'src/seed/images/RGI_hose_duct.jpg'),
      data: { alt: 'Ống', source: 'Test', rightsCleared: true },
      ...as(users.marketing),
    })
    expect(m.rightsCleared).toBe(true)
    // Sửa chữ thay thế không làm mất xác nhận
    const u = await payload.update({ collection: 'media', id: m.id, data: { alt: 'Ống gân' }, ...as(users.editor) })
    expect(u.rightsCleared).toBe(true)
    await payload.delete({ collection: 'media', id: m.id, overrideAccess: true })
  })
})
