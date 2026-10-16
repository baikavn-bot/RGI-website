/**
 * BR-05: còn 60 ngày thì báo Pháp chế; hết hạn thì chuyển hồ sơ sang "Hết hiệu lực",
 * đưa sản phẩm đang bán về "Sắp ra mắt", ẩn nhãn Hợp quy, ghi nhật ký.
 */
import type { PayloadRequest } from 'payload'

import { writeAudit } from '../hooks/audit'

export async function demoteProductIfNoValidRecord(req: PayloadRequest, productId: string | number, reason: string) {
  const { payload } = req
  const valid = await payload.count({
    collection: 'compliance-records',
    overrideAccess: true,
    req,
    where: {
      and: [
        { product: { equals: productId } },
        { type: { equals: 'cr_declaration' } },
        { status: { equals: 'approved' } },
        { expiresOn: { greater_than: new Date().toISOString() } },
      ],
    },
  })
  if (valid.totalDocs > 0) return false
  // Đọc bản đang xuất bản (không lấy bản nháp mới nhất).
  const product = await payload.findByID({ collection: 'products', id: productId, overrideAccess: true, depth: 1, draft: false, req })
  const lineCode = typeof product.line === 'object' ? product.line?.code : undefined
  if (product.saleStatus !== 'on_sale' || lineCode !== 'RC-P') return false
  // Ghi thẳng vào bản đang xuất bản để không trộn bản nháp chưa duyệt vào trang công khai.
  // Bản nháp (nếu có) vẫn ghi "Đang bán" nhưng không xuất bản được khi chưa có hồ sơ hợp lệ (BR-01).
  await payload.db.updateOne({ collection: 'products', id: productId, data: { saleStatus: 'coming_soon' }, req })
  const { revalidateSite } = await import('../hooks/revalidate')
  await revalidateSite(req)
  await writeAudit(req, { action: 'auto_demote', collectionSlug: 'products', docId: productId, note: reason })
  return true
}

export async function checkComplianceExpiry(req: PayloadRequest) {
  const { payload } = req
  const now = new Date()
  const in60 = new Date(now.getTime() + 60 * 24 * 3600 * 1000)

  const expiring = await payload.find({
    collection: 'compliance-records',
    overrideAccess: true,
    depth: 1,
    limit: 200,
    req,
    where: {
      and: [
        { status: { equals: 'approved' } },
        { expiresOn: { greater_than: now.toISOString() } },
        { expiresOn: { less_than_equal: in60.toISOString() } },
      ],
    },
  })

  const expired = await payload.find({
    collection: 'compliance-records',
    overrideAccess: true,
    depth: 0,
    limit: 200,
    req,
    where: { and: [{ status: { equals: 'approved' } }, { expiresOn: { less_than_equal: now.toISOString() } }] },
  })

  let demoted = 0
  for (const rec of expired.docs) {
    await payload.update({
      collection: 'compliance-records',
      id: rec.id,
      overrideAccess: true,
      req,
      data: { status: 'expired' },
    })
    const productId = typeof rec.product === 'object' ? rec.product?.id : rec.product
    if (productId && (await demoteProductIfNoValidRecord(req, productId, `Hồ sơ ${rec.registrationNo ?? rec.id} hết hạn`))) demoted++
  }

  const legal = await payload.find({ collection: 'users', where: { role: { in: ['legal', 'director'] } }, overrideAccess: true, depth: 0, limit: 20, req })
  const to = legal.docs.map((u) => u.email)
  if (to.length && (expiring.docs.length || expired.docs.length)) {
    const lines = [
      ...expiring.docs.map((r) => `Sắp hết hạn ${String(r.expiresOn).slice(0, 10)}: ${r.registrationNo ?? r.id}`),
      ...expired.docs.map((r) => `Đã hết hạn, sản phẩm đã về "Sắp ra mắt": ${r.registrationNo ?? r.id}`),
    ]
    await payload.sendEmail({ to, subject: '[RENCO] Hồ sơ hợp quy cần xử lý', text: lines.join('\n') })
  }
  return { warned: expiring.docs.length, demoted }
}
