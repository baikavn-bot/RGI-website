/**
 * Test tích hợp quy tắc nghiệp vụ và phân quyền (mục 21 blueprint, các test "Chặn").
 * Chạy trên cơ sở dữ liệu TEST_DATABASE_URL; mỗi lần chạy xoá sạch dữ liệu trước.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { submitLead } from '../../src/endpoints/submitLead'
import { anonymizeStaleLeads } from '../../src/jobs'
import { checkComplianceExpiry } from '../../src/jobs/complianceExpiry'
import { resetRateLimits } from '../../src/lib/security'

let payload: Payload
type U = { id: number; email: string; role: string; collection: 'users' }
const users: Record<string, U> = {}
let pipeLine: number
let hoseLine: number
let pipeProduct: number
let hoseProduct: number

const meta = { ip: '127.0.0.1', userAgent: 'vitest' }
const asUser = (u: U) => ({ user: u, overrideAccess: false })

async function expectReject(p: Promise<unknown>, code?: string) {
  let err: unknown
  try {
    await p
  } catch (e) {
    err = e
  }
  expect(err, 'phải bị từ chối').toBeTruthy()
  if (code) expect(JSON.stringify((err as { data?: unknown }).data ?? (err as Error).message)).toContain(code)
}

beforeAll(async () => {
  payload = await getPayload({ config })
  for (const slug of ['lead-activities', 'leads', 'consents', 'data-requests', 'variants', 'compliance-records', 'products', 'product-lines', 'documents', 'audit-logs', 'pages', 'users'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } }, overrideAccess: true, trash: slug === 'leads' ? true : undefined, context: { skipAudit: true } })
  }
  await payload.updateGlobal({
    slug: 'settings',
    overrideAccess: true,
    data: {
      companyName: 'RGI',
      taxCode: '0319717793',
      address: 'TP. Hồ Chí Minh',
      hotline: '0948391202',
      email: 'sales@renco.test',
      forms: { distributor: true, retailer: true, contractor: true, sample: true, contact: true },
      consent: { policyVersion: 'WB02-test', text: 'Tôi đồng ý' },
    },
  })
  for (const role of ['director', 'marketing', 'sales', 'editor', 'legal', 'tech']) {
    for (const n of role === 'sales' ? [1, 2] : [1]) {
      const email = `${role}${n}@renco.test`
      const u = await payload.create({ collection: 'users', overrideAccess: true, data: { email, password: 'Test-password-123', name: email, role: role as never } })
      users[role === 'sales' ? `sales${n}` : role] = { id: u.id, email, role, collection: 'users' }
    }
  }
  pipeLine = (await payload.create({ collection: 'product-lines', overrideAccess: true, data: { code: 'RC-P', color: '#1846D6', name: 'Ống uPVC', slug: 'ong-upvc' } })).id
  hoseLine = (await payload.create({ collection: 'product-lines', overrideAccess: true, data: { code: 'RC-H', color: '#EF8307', name: 'Ống mềm', slug: 'ong-mem' } })).id
  pipeProduct = (
    await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: { code: 'RC-P', line: pipeLine, name: 'Ống uPVC', slug: 'ong-upvc-test', manufacturerText: 'Nhà máy REN Group', saleStatus: 'coming_soon', claimLevel: 'none', legalReview: { status: 'approved' }, _status: 'published' },
    })
  ).id
  hoseProduct = (
    await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: { code: 'RC-H01', line: hoseLine, name: 'Ống mềm', slug: 'ong-mem-test', manufacturerText: 'Nhà máy REN Group', saleStatus: 'on_sale', claimLevel: 'level1_factory', legalReview: { status: 'approved' }, _status: 'published' },
    })
  ).id
  resetRateLimits()
}, 240_000)

afterAll(async () => {
  await payload?.destroy?.()
})

describe('Quy tắc sản phẩm', () => {
  it('T01 · BR-01: ống uPVC không chuyển "Đang bán" khi chưa có hồ sơ hợp quy', async () => {
    await expectReject(payload.update({ collection: 'products', id: pipeProduct, data: { saleStatus: 'on_sale' }, ...asUser(users.director) }), 'compliance_required')
    const p = await payload.findByID({ collection: 'products', id: pipeProduct, overrideAccess: true })
    expect(p.saleStatus).toBe('coming_soon')
  })

  it('T01b · có hồ sơ đã duyệt, còn hạn thì Giám đốc mở bán được', async () => {
    const rec = await payload.create({
      collection: 'compliance-records',
      ...asUser(users.legal),
      data: { product: pipeProduct, type: 'cr_declaration', certNo: 'GCN-1', certBody: 'Tổ chức A', registrationNo: 'DK-1', issuedOn: '2026-10-01', expiresOn: '2029-10-01' } as never,
    })
    expect(rec.status).toBe('draft') // Pháp chế không tự duyệt được
    await payload.update({ collection: 'compliance-records', id: rec.id, data: { status: 'approved' }, ...asUser(users.director) })
    const p = await payload.update({ collection: 'products', id: pipeProduct, data: { saleStatus: 'on_sale' }, ...asUser(users.director) })
    expect(p.saleStatus).toBe('on_sale')
  })

  it('T03 · BR-05: hồ sơ hết hạn → sản phẩm về "Sắp ra mắt"', async () => {
    const rec = await payload.find({ collection: 'compliance-records', where: { product: { equals: pipeProduct } }, overrideAccess: true })
    await payload.update({ collection: 'compliance-records', id: rec.docs[0].id, overrideAccess: true, data: { expiresOn: '2026-10-02', issuedOn: '2026-01-01' } })
    // Hook sau khi lưu đã đưa sản phẩm về "Sắp ra mắt"; tác vụ hằng ngày chuyển hồ sơ sang "Hết hiệu lực".
    const req = { payload, context: {}, user: null } as never
    await checkComplianceExpiry(req)
    const after = await payload.findByID({ collection: 'compliance-records', id: rec.docs[0].id, overrideAccess: true })
    expect(after.status).toBe('expired')
    const p = await payload.findByID({ collection: 'products', id: pipeProduct, overrideAccess: true })
    expect(p.saleStatus).toBe('coming_soon')
    const anon = await payload.find({ collection: 'compliance-records', where: { product: { equals: pipeProduct } }, overrideAccess: false })
    expect(anon.docs).toHaveLength(0) // khách không còn thấy nhãn Hợp quy
  })

  it('T02 · BR-02: ống uPVC không mang nhãn tái chế', async () => {
    await expectReject(payload.update({ collection: 'products', id: pipeProduct, data: { claimLevel: 'level1_factory' }, ...asUser(users.director) }), 'claim_not_allowed_for_pipe')
  })

  it('BR-03: nhãn tái chế cấp 2 cần bằng chứng', async () => {
    await expectReject(payload.update({ collection: 'products', id: hoseProduct, data: { claimLevel: 'level2_product' }, ...asUser(users.legal) }), 'claim_evidence_required')
  })

  it('T04 · BR-04: số liệu chưa xác nhận không lộ ra API công khai', async () => {
    const v = await payload.create({ collection: 'variants', overrideAccess: true, data: { sku: 'RC-P21', product: pipeProduct, sizeLabel: 'Ø21', specStatus: 'proposed', dnMm: 21, eMm: 1.6 } })
    const anon = await payload.findByID({ collection: 'variants', id: v.id, overrideAccess: false })
    expect(anon.dnMm).toBeUndefined()
    expect(anon.sizeLabel).toBe('Ø21')
    const staff = await payload.findByID({ collection: 'variants', id: v.id, ...asUser(users.editor) })
    expect(staff.dnMm).toBe(21)
    await payload.update({ collection: 'variants', id: v.id, data: { specStatus: 'factory_confirmed' }, ...asUser(users.legal) })
    const anon2 = await payload.findByID({ collection: 'variants', id: v.id, overrideAccess: false })
    expect(anon2.dnMm).toBe(21)
    // Biên tập sửa số → quay về "đề xuất"
    const edited = await payload.update({ collection: 'variants', id: v.id, data: { eMm: 1.7 }, ...asUser(users.editor) })
    expect(edited.specStatus).toBe('proposed')
  })

  it('T05 · BR-06: Biên tập không xuất bản trang sản phẩm; sửa sau duyệt thì phải duyệt lại', async () => {
    await expectReject(payload.update({ collection: 'products', id: hoseProduct, data: { summary: 'Sửa', _status: 'published' }, ...asUser(users.editor) }), 'publish_forbidden')
    const draft = await payload.update({ collection: 'products', id: hoseProduct, draft: true, data: { summary: 'Sửa nháp' }, ...asUser(users.editor) })
    expect(draft.legalReview?.status).toBe('pending')
    await expectReject(payload.update({ collection: 'products', id: hoseProduct, data: { _status: 'published' }, ...asUser(users.legal) }), 'legal_review_required')
    const ok = await payload.update({ collection: 'products', id: hoseProduct, data: { legalReview: { status: 'approved' }, _status: 'published' }, ...asUser(users.legal) })
    expect(ok._status).toBe('published')
  })

  it('Chỉ Pháp chế, Giám đốc sửa được tên nhà sản xuất', async () => {
    const p = await payload.update({ collection: 'products', id: hoseProduct, draft: true, data: { manufacturerText: 'PT Dunia Plast Indonesia' }, ...asUser(users.editor) })
    expect(p.manufacturerText).toBe('Nhà máy REN Group')
  })
})

describe('Form và lead', () => {
  it('T06 · BR-09: không đồng ý thì không lưu', async () => {
    const before = await payload.count({ collection: 'leads', overrideAccess: true })
    const r = await submitLead(payload, { type: 'contact', locale: 'vi', contactName: 'Khách A', phone: '0912345678' }, meta)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('consent_required')
    const after = await payload.count({ collection: 'leads', overrideAccess: true })
    expect(after.totalDocs).toBe(before.totalDocs)
  })

  it('Lưu lead kèm bằng chứng đồng ý; T15 bỏ thẻ HTML', async () => {
    const r = await submitLead(
      payload,
      { type: 'distributor', locale: 'vi', contactName: 'Anh B', phone: '0987 654 321', company: 'NPP B', province: 'Đồng Nai', interestLines: ['RC-H'], message: '<b>Chào</b><script>x</script>', consent: true },
      meta,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const lead = await payload.findByID({ collection: 'leads', id: r.leadId, overrideAccess: true, depth: 1 })
    expect(lead.phoneNormalized).toBe('+84987654321')
    expect(lead.message).toBe('Chàox')
    expect(typeof lead.consent === 'object' && lead.consent?.policyVersion).toBe('WB02-test')
    expect((lead.interestLines as { code: string }[])[0].code).toBe('RC-H')
  })

  it('T07 · BR-08: cùng số điện thoại trong 30 ngày thì gộp', async () => {
    const r = await submitLead(payload, { type: 'contractor', locale: 'vi', contactName: 'Anh B', phone: '+84987654321', province: 'Đồng Nai', projectName: 'Nhà xưởng C', interestSkus: ['RC-H01-1/2'], consent: true }, meta)
    expect(r.ok && r.merged).toBe(true)
    const leads = await payload.find({ collection: 'leads', where: { phoneNormalized: { equals: '+84987654321' } }, overrideAccess: true })
    expect(leads.totalDocs).toBe(1)
    expect(leads.docs[0].mergedCount).toBe(1)
    expect(leads.docs[0].interestSkus).toContain('RC-H01-1/2')
  })

  it('Ô bẫy chống bot: trả như thành công nhưng không lưu', async () => {
    const before = await payload.count({ collection: 'leads', overrideAccess: true })
    const r = await submitLead(payload, { type: 'contact', locale: 'vi', contactName: 'Bot', phone: '0911111111', consent: true, website: 'http://spam' }, meta)
    expect(r.ok).toBe(true)
    expect((await payload.count({ collection: 'leads', overrideAccess: true })).totalDocs).toBe(before.totalDocs)
  })

  it('Form bị tắt trong Cài đặt thì từ chối', async () => {
    await payload.updateGlobal({ slug: 'settings', overrideAccess: true, data: { forms: { sample: false } } })
    const r = await submitLead(payload, { type: 'sample', locale: 'vi', contactName: 'Chị D', phone: '0901234567', company: 'CH D', province: 'Huế', kits: ['book'], deliveryAddress: '12 Lê Lợi, Huế', consent: true }, meta)
    expect(r.ok).toBe(false)
    await payload.updateGlobal({ slug: 'settings', overrideAccess: true, data: { forms: { sample: true } } })
  })
})

describe('Phân quyền', () => {
  let leadOfSales1: number
  beforeAll(async () => {
    const r = await submitLead(payload, { type: 'retailer', locale: 'vi', contactName: 'Chị E', phone: '0933333333', company: 'CH E', province: 'Cần Thơ', interestLines: ['RC-H'], consent: true }, meta)
    if (!r.ok) throw new Error('seed lead failed')
    leadOfSales1 = Number(r.leadId)
    await payload.update({ collection: 'leads', id: leadOfSales1, data: { owner: users.sales1.id }, ...asUser(users.marketing) })
  })

  it('T11 · Sales 2 không xem được lead giao cho Sales 1', async () => {
    await expectReject(payload.findByID({ collection: 'leads', id: leadOfSales1, ...asUser(users.sales2) }))
    const mine = await payload.findByID({ collection: 'leads', id: leadOfSales1, ...asUser(users.sales1) })
    expect(mine.id).toBe(leadOfSales1)
  })

  it('Sales không tự giao lại lead cho người khác', async () => {
    const r = await payload.update({ collection: 'leads', id: leadOfSales1, data: { owner: users.sales2.id }, ...asUser(users.sales1) })
    expect(typeof r.owner === 'object' ? r.owner?.id : r.owner).toBe(users.sales1.id)
  })

  it('Vòng đời lead: chuyển sai trả 409; "Không thành" phải có lý do', async () => {
    await expectReject(payload.update({ collection: 'leads', id: leadOfSales1, data: { status: 'won' }, ...asUser(users.sales1) }), 'invalid_transition')
    await payload.update({ collection: 'leads', id: leadOfSales1, data: { status: 'contacted' }, ...asUser(users.sales1) })
    await payload.update({ collection: 'leads', id: leadOfSales1, data: { status: 'qualified' }, ...asUser(users.sales1) })
    await expectReject(payload.update({ collection: 'leads', id: leadOfSales1, data: { status: 'lost' }, ...asUser(users.sales1) }), 'lost_reason_required')
    const acts = await payload.find({ collection: 'lead-activities', where: { lead: { equals: leadOfSales1 } }, overrideAccess: true })
    expect(acts.docs.filter((a) => a.kind === 'status_change')).toHaveLength(2)
  })

  it('T12 · Biên tập, Pháp chế, Quản trị kỹ thuật không đọc được lead', async () => {
    for (const role of ['editor', 'legal', 'tech']) {
      const res = await payload.find({ collection: 'leads', ...asUser(users[role]) }).catch(() => ({ docs: [] }))
      expect(res.docs).toHaveLength(0)
    }
  })

  it('Chỉ Giám đốc xoá lead (xoá mềm vào thùng rác)', async () => {
    await expectReject(payload.delete({ collection: 'leads', id: leadOfSales1, ...asUser(users.marketing) }))
    await payload.update({ collection: 'leads', id: leadOfSales1, data: { deletedAt: new Date().toISOString() }, ...asUser(users.director) })
    const visible = await payload.find({ collection: 'leads', where: { id: { equals: leadOfSales1 } }, ...asUser(users.director) })
    expect(visible.docs).toHaveLength(0)
    const trashed = await payload.find({ collection: 'leads', where: { id: { equals: leadOfSales1 } }, trash: true, ...asUser(users.director) })
    expect(trashed.docs).toHaveLength(1)
  })

  it('T14 · Tài liệu nội bộ không đọc được khi chưa đăng nhập', async () => {
    const doc = await payload.db.create({ collection: 'documents', data: { title: 'Nội bộ', kind: 'other', locale: 'vi', visibility: 'internal', filename: 'x.pdf', mimeType: 'application/pdf' } })
    const anon = await payload.find({ collection: 'documents', where: { id: { equals: doc.id } }, overrideAccess: false })
    expect(anon.docs).toHaveLength(0)
  })

  it('Nhật ký chỉ ghi thêm: không ai sửa, xoá', async () => {
    const logs = await payload.find({ collection: 'audit-logs', ...asUser(users.director), limit: 1 })
    expect(logs.totalDocs).toBeGreaterThan(0)
    await expectReject(payload.update({ collection: 'audit-logs', id: logs.docs[0].id, data: { note: 'x' }, ...asUser(users.director) }))
    await expectReject(payload.delete({ collection: 'audit-logs', id: logs.docs[0].id, ...asUser(users.director) }))
  })

  it('Mật khẩu dưới 12 ký tự bị từ chối', async () => {
    await expectReject(payload.create({ collection: 'users', overrideAccess: true, data: { email: 'weak@renco.test', password: 'short1', name: 'x', role: 'sales' } }), 'weak_password')
  })

  it('Người dùng thường không đổi được vai trò của mình', async () => {
    const r = await payload.update({ collection: 'users', id: users.sales2.id, data: { role: 'director' }, ...asUser(users.sales2) })
    expect(r.role).toBe('sales')
  })
})

describe('Dữ liệu cá nhân', () => {
  it('BR-10: thực hiện yêu cầu xoá → xoá hẳn lead, ẩn danh bằng chứng đồng ý, ghi nhật ký', async () => {
    const r = await submitLead(payload, { type: 'contact', locale: 'vi', contactName: 'Người cần xoá', phone: '0977777777', consent: true }, meta)
    if (!r.ok) throw new Error('lead failed')
    const lead = await payload.findByID({ collection: 'leads', id: r.leadId, overrideAccess: true })
    const consentId = typeof lead.consent === 'object' ? lead.consent?.id : lead.consent
    const dr = await payload.db.create({ collection: 'data-requests', data: { refCode: 'DR-T1', kind: 'erase', contactName: 'Người cần xoá', contact: '0977777777', status: 'received' } })
    await payload.update({ collection: 'data-requests', id: dr.id, data: { matchedLeads: [r.leadId as number], status: 'executed' }, ...asUser(users.legal) })
    const gone = await payload.find({ collection: 'leads', where: { id: { equals: r.leadId } }, overrideAccess: true, trash: true })
    expect(gone.docs).toHaveLength(0)
    const consent = await payload.findByID({ collection: 'consents', id: consentId as number, overrideAccess: true })
    expect(consent.anonymized).toBe(true)
    expect(consent.ipHash).toBeFalsy()
    const log = await payload.find({ collection: 'audit-logs', where: { action: { equals: 'erase' } }, overrideAccess: true })
    expect(log.totalDocs).toBe(1)
  })

  it('Ẩn danh hoá lead quá thời hạn lưu', async () => {
    const r = await submitLead(payload, { type: 'contact', locale: 'vi', contactName: 'Lead cũ', phone: '0966666666', consent: true }, meta)
    if (!r.ok) throw new Error('lead failed')
    await payload.db.updateOne({ collection: 'leads', id: r.leadId, data: { updatedAt: '2020-01-01T00:00:00.000Z' } })
    const req = { payload, context: {}, user: null } as never
    const res = await anonymizeStaleLeads(req, 24)
    expect(res.anonymized).toBeGreaterThanOrEqual(1)
    const lead = await payload.findByID({ collection: 'leads', id: r.leadId, overrideAccess: true })
    expect(lead.contactName).toBe('(đã ẩn danh)')
    expect(lead.phoneNormalized).toBeFalsy()
  })
})
