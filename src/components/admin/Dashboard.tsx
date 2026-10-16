import type { ServerProps } from 'payload'

import { businessDaysSince } from '../../lib/security'

/**
 * Bảng tổng quan trên trang quản trị (mục 15 blueprint): lead mới, lead quá hạn,
 * nội dung chờ Pháp chế, hồ sơ hợp quy sắp hết hạn, yêu cầu dữ liệu cá nhân đang mở.
 * Mỗi con số chỉ hiện với vai trò được xem dữ liệu đó.
 */
const isoDaysFromNow = (days: number) => new Date(Date.now() + days * 864e5).toISOString()

export default async function Dashboard({ payload, user }: ServerProps) {
  if (!user) return null
  const role = (user as { role?: string }).role
  const tiles: { label: string; value: number; href: string; warn?: boolean }[] = []
  const since7 = isoDaysFromNow(-7)
  const in60 = isoDaysFromNow(60)

  if (role === 'director' || role === 'marketing' || role === 'sales') {
    const newLeads = await payload.find({
      collection: 'leads',
      where: { status: { equals: 'new' } },
      depth: 0,
      limit: 200,
      overrideAccess: false,
      user,
      select: { createdAt: true },
    })
    const overdue = newLeads.docs.filter((l) => businessDaysSince(new Date(l.createdAt)) >= 1).length
    const week = await payload.count({ collection: 'leads', where: { createdAt: { greater_than: since7 } }, overrideAccess: false, user })
    tiles.push(
      { label: 'Lead mới chưa liên hệ', value: newLeads.totalDocs, href: '/admin/collections/leads?where[status][equals]=new' },
      { label: 'Lead quá 1 ngày làm việc', value: overdue, href: '/admin/collections/leads?where[status][equals]=new', warn: overdue > 0 },
      { label: 'Lead 7 ngày qua', value: week.totalDocs, href: '/admin/collections/leads' },
    )
  }
  if (role === 'director' || role === 'legal' || role === 'marketing' || role === 'editor') {
    const pendingProducts = await payload.count({ collection: 'products', where: { 'legalReview.status': { equals: 'pending' } }, overrideAccess: true })
    const pendingPages = await payload.count({
      collection: 'pages',
      where: { and: [{ kind: { equals: 'legal' } }, { 'legalReview.status': { equals: 'pending' } }] },
      overrideAccess: true,
    })
    tiles.push({
      label: 'Nội dung chờ Pháp chế duyệt',
      value: pendingProducts.totalDocs + pendingPages.totalDocs,
      href: '/admin/collections/products?where[legalReview.status][equals]=pending',
      warn: role === 'legal' && pendingProducts.totalDocs + pendingPages.totalDocs > 0,
    })
  }
  if (role === 'director' || role === 'legal' || role === 'marketing') {
    // Form thu dữ liệu cá nhân dẫn tới trang Chính sách dữ liệu: phải xuất bản trước khi ra mắt.
    const legalLive = await payload.count({
      collection: 'pages',
      where: { and: [{ key: { in: ['terms', 'privacy'] } }, { _status: { equals: 'published' } }] },
      overrideAccess: true,
    })
    if (legalLive.totalDocs < 2) {
      tiles.push({ label: 'Trang Điều khoản / Chính sách dữ liệu chưa xuất bản', value: 2 - legalLive.totalDocs, href: '/admin/collections/pages', warn: true })
    }
  }
  if (role === 'director' || role === 'legal') {
    const expiring = await payload.count({
      collection: 'compliance-records',
      where: { and: [{ status: { equals: 'approved' } }, { expiresOn: { less_than_equal: in60 } }] },
      overrideAccess: true,
    })
    const dsr = await payload.count({ collection: 'data-requests', where: { status: { in: ['received', 'verifying', 'in_progress'] } }, overrideAccess: true })
    tiles.push(
      { label: 'Hồ sơ hợp quy hết hạn trong 60 ngày', value: expiring.totalDocs, href: '/admin/collections/compliance-records', warn: expiring.totalDocs > 0 },
      { label: 'Yêu cầu dữ liệu cá nhân đang mở', value: dsr.totalDocs, href: '/admin/collections/data-requests', warn: dsr.totalDocs > 0 },
    )
  }
  if (!tiles.length) return null

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ marginBottom: 12, fontSize: 18 }}>Tổng quan</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {tiles.map((t) => (
          <a
            key={t.label}
            href={t.href}
            style={{
              display: 'block',
              padding: 16,
              borderRadius: 8,
              textDecoration: 'none',
              border: `1px solid ${t.warn ? 'var(--theme-error-400)' : 'var(--theme-elevation-150)'}`,
              background: t.warn ? 'var(--theme-error-50)' : 'var(--theme-elevation-50)',
              color: 'var(--theme-text)',
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.1 }}>{t.value}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{t.label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
