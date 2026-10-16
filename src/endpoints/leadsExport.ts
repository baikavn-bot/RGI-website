import type { Endpoint, Where } from 'payload'

import { hasRole } from '../access'
import { writeAudit } from '../hooks/audit'
import { LEAD_STATUSES, LEAD_TYPES } from '../lib/constants'
import type { Lead } from '../payload-types'
import { apiError } from './respond'

const label = (list: readonly { value: string; label: { vi: string } }[], v: unknown) =>
  list.find((o) => o.value === v)?.label.vi ?? String(v ?? '')

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  // Chặn CSV injection khi mở bằng Excel; số điện thoại dạng +84… giữ nguyên.
  const safe = /^[=@\t\r]/.test(s) || /^[+-](?![\d\s]+$)/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

/** GET /api/leads/export?status=&type=&from=&to= — chỉ Quản lý marketing, Giám đốc. Mỗi lần xuất ghi nhật ký. */
export const exportLeadsEndpoint: Endpoint = {
  path: '/export',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req, 'director', 'marketing')) return apiError(403, 'forbidden', 'Bạn không có quyền xuất danh sách lead.')
    const url = new URL(req.url ?? 'http://localhost')
    const and: Where[] = []
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    if (status) and.push({ status: { equals: status } })
    if (type) and.push({ type: { equals: type } })
    const validDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
    if ((from && !validDate(from)) || (to && !validDate(to))) {
      return apiError(400, 'invalid_date', 'Ngày lọc phải có dạng YYYY-MM-DD.')
    }
    if (from) and.push({ createdAt: { greater_than_equal: new Date(from).toISOString() } })
    if (to) and.push({ createdAt: { less_than_equal: new Date(`${to}T23:59:59.999+07:00`).toISOString() } })

    // Đọc theo trang để không cắt cụt danh sách
    const docs: Lead[] = []
    for (let page = 1; ; page++) {
      const res = await req.payload.find({
        collection: 'leads',
        where: and.length ? { and } : undefined,
        depth: 1,
        limit: 500,
        page,
        sort: '-createdAt',
        overrideAccess: false,
        user: req.user,
        req,
      })
      docs.push(...res.docs)
      if (!res.hasNextPage) break
    }
    const result = { docs }

    const header = ['Mã', 'Ngày', 'Loại', 'Trạng thái', 'Doanh nghiệp', 'Người liên hệ', 'Điện thoại', 'Email', 'Tỉnh/thành', 'Dòng quan tâm', 'Mã quan tâm', 'Sales', 'Nguồn', 'Chiến dịch']
    const rows = result.docs.map((d) => [
      d.refCode,
      d.createdAt?.slice(0, 10),
      label(LEAD_TYPES, d.type),
      label(LEAD_STATUSES, d.status),
      d.company,
      d.contactName,
      d.phoneNormalized,
      d.email,
      d.province,
      ((d.interestLines ?? []) as { code?: string }[]).map((l) => (typeof l === 'object' ? l.code : l)).join(', '),
      ((d.interestSkus ?? []) as string[]).join(', '),
      typeof d.owner === 'object' && d.owner ? (d.owner as { name?: string }).name : '',
      d.utmSource,
      d.utmCampaign,
    ])
    const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')

    await writeAudit(req, {
      action: 'export',
      collectionSlug: 'leads',
      changes: { count: result.docs.length, filters: { status, type, from, to } },
    })

    const stamp = new Date().toISOString().slice(0, 10)
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="RENCO_Lead_${stamp}.csv"`,
        'cache-control': 'no-store',
      },
    })
  },
}
