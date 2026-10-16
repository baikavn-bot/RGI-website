/**
 * Tác vụ nền (mục 10, 20 blueprint): email lead, nhắc lead quá hạn, kiểm tra hồ sơ hợp quy, ẩn danh hoá lead cũ.
 */
import type { Payload, PayloadRequest, TaskConfig } from 'payload'

import { LEAD_TYPES, SAMPLE_KITS } from '../lib/constants'
import { businessDaysSince } from '../lib/security'
import { formatPhoneVN } from '../lib/validators'
import { checkComplianceExpiry } from './complianceExpiry'

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
const adminUrl = () => (process.env.ADMIN_URL || `${siteUrl()}/admin`).replace(/\/$/, '')

async function recipients(payload: Payload): Promise<string[]> {
  const settings = await payload.findGlobal({ slug: 'settings', overrideAccess: true, depth: 0 })
  const fromSettings = ((settings.leadNotifyEmails ?? []) as string[]).filter(Boolean)
  const users = await payload.find({
    collection: 'users',
    where: { and: [{ notifyLeads: { equals: true } }, { role: { in: ['director', 'marketing'] } }] },
    overrideAccess: true,
    depth: 0,
    limit: 50,
  })
  return Array.from(new Set([...fromSettings, ...users.docs.map((u) => u.email)]))
}

const typeLabel = (v: string) => LEAD_TYPES.find((t) => t.value === v)?.label.vi ?? v

export const sendLeadEmailsTask: TaskConfig<{ input: { leadId: number; merged?: boolean }; output: { sent: number } }> = {
  slug: 'sendLeadEmails',
  label: 'Gửi email lead',
  retries: 3,
  inputSchema: [
    { name: 'leadId', type: 'number', required: true },
    { name: 'merged', type: 'checkbox' },
  ],
  outputSchema: [{ name: 'sent', type: 'number' }],
  handler: async ({ input, req }) => {
    const { payload } = req
    const lead = await payload.findByID({ collection: 'leads', id: input.leadId, overrideAccess: true, depth: 1 })
    const to = await recipients(payload)
    let sent = 0

    if (to.length) {
      const lines = [
        `${input.merged ? 'Khách gửi lại form' : 'Lead mới'}: ${lead.refCode}`,
        `Loại: ${typeLabel(String(lead.type))}`,
        `Người liên hệ: ${lead.contactName}`,
        `Điện thoại: ${lead.phoneNormalized ? formatPhoneVN(lead.phoneNormalized) : lead.phone}`,
        lead.company ? `Doanh nghiệp: ${lead.company}` : '',
        lead.province ? `Tỉnh/thành: ${lead.province}` : '',
        lead.kits?.length ? `Bộ mẫu: ${lead.kits.map((k) => SAMPLE_KITS.find((s) => s.value === k)?.label.vi ?? k).join('; ')}` : '',
        '',
        `Mở trên trang quản trị: ${adminUrl()}/collections/leads/${lead.id}`,
      ].filter((l) => l !== '')
      await payload.sendEmail({
        to,
        subject: `[RENCO] ${input.merged ? 'Gửi lại' : 'Lead mới'} · ${typeLabel(String(lead.type))} · ${lead.province ?? ''}`.trim(),
        text: lines.join('\n'),
      })
      sent++
    } else {
      payload.logger.warn('Chưa cấu hình email nhận lead (Cài đặt website → Liên hệ).')
    }

    // Email xác nhận cho khách (chỉ lần đầu, khi khách để lại email)
    if (!input.merged && lead.email) {
      const vi = lead.locale !== 'en'
      const settings = await payload.findGlobal({ slug: 'settings', overrideAccess: true, locale: vi ? 'vi' : 'en', depth: 0 })
      await payload.sendEmail({
        to: lead.email,
        subject: vi ? `RENCO đã nhận yêu cầu ${lead.refCode}` : `RENCO received your request ${lead.refCode}`,
        text: vi
          ? `Chào anh/chị,\n\nRENCO đã nhận yêu cầu ${lead.refCode}. Bộ phận kinh doanh sẽ liên hệ lại${settings.responseTime ? ' ' + settings.responseTime : ''}.\nCần gấp, anh/chị gọi hotline ${settings.hotline}.\n\n${settings.companyName}\n${settings.address}`
          : `Hello,\n\nRENCO has received request ${lead.refCode}. Our sales team will contact you${settings.responseTime ? ' ' + settings.responseTime : ''}.\nFor urgent matters, call ${settings.hotline}.\n\n${settings.companyName}\n${settings.address}`,
      })
      sent++
    }

    await payload.update({
      collection: 'leads',
      id: lead.id,
      overrideAccess: true,
      context: { skipAudit: true, skipTransition: true },
      data: { notifiedAt: new Date().toISOString() },
    })
    return { output: { sent } }
  },
}

export const notifyDataRequestTask: TaskConfig<{ input: { refCode: string }; output: Record<string, never> }> = {
  slug: 'notifyDataRequest',
  label: 'Báo Pháp chế có yêu cầu dữ liệu cá nhân',
  retries: 3,
  inputSchema: [{ name: 'refCode', type: 'text', required: true }],
  handler: async ({ input, req }) => {
    const legal = await req.payload.find({
      collection: 'users',
      where: { role: { in: ['legal', 'director'] } },
      overrideAccess: true,
      depth: 0,
      limit: 20,
    })
    const to = legal.docs.map((u) => u.email)
    if (to.length) {
      await req.payload.sendEmail({
        to,
        subject: `[RENCO] Yêu cầu về dữ liệu cá nhân ${input.refCode}`,
        text: `Có yêu cầu mới ${input.refCode}. Xác minh danh tính và xử lý trước hạn.\n${adminUrl()}/collections/data-requests`,
      })
    }
    return { output: {} }
  },
}

/** Lead "Mới" quá 1 ngày làm việc: báo Quản lý marketing. Quá 3 ngày: báo Giám đốc [ĐX]. */
export async function checkOverdueLeads(req: PayloadRequest) {
  const { payload } = req
  const recent = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const leads = await payload.find({
    collection: 'leads',
    where: { and: [{ status: { equals: 'new' } }, { createdAt: { greater_than: recent } }] },
    overrideAccess: true,
    depth: 0,
    limit: 500,
  })
  const overdue1 = leads.docs.filter((l) => businessDaysSince(new Date(l.createdAt)) >= 1)
  const overdue3 = overdue1.filter((l) => businessDaysSince(new Date(l.createdAt)) >= 3 && !l.escalatedAt)
  if (!overdue1.length) return { overdue: 0, escalated: 0 }

  const marketing = await payload.find({ collection: 'users', where: { role: { equals: 'marketing' } }, overrideAccess: true, depth: 0, limit: 20 })
  const mTo = marketing.docs.map((u) => u.email)
  if (mTo.length) {
    await payload.sendEmail({
      to: mTo,
      subject: `[RENCO] ${overdue1.length} lead quá 1 ngày làm việc chưa liên hệ`,
      text: overdue1.map((l) => `${l.refCode} · ${typeLabel(String(l.type))} · ${l.province ?? ''}`).join('\n') + `\n\n${adminUrl()}/collections/leads?where[status][equals]=new`,
    })
  }
  if (overdue3.length) {
    const settings = await payload.findGlobal({ slug: 'settings', overrideAccess: true, depth: 0 })
    const directors = await payload.find({ collection: 'users', where: { role: { equals: 'director' } }, overrideAccess: true, depth: 0, limit: 5 })
    const dTo = Array.from(new Set([settings.directorEmail, ...directors.docs.map((u) => u.email)].filter(Boolean) as string[]))
    if (dTo.length) {
      await payload.sendEmail({
        to: dTo,
        subject: `[RENCO] ${overdue3.length} lead quá 3 ngày làm việc chưa liên hệ`,
        text: overdue3.map((l) => `${l.refCode} · ${typeLabel(String(l.type))}`).join('\n'),
      })
    }
    for (const l of overdue3) {
      await payload.update({
        collection: 'leads',
        id: l.id,
        overrideAccess: true,
        context: { skipAudit: true, skipTransition: true },
        data: { escalatedAt: new Date().toISOString() },
      })
    }
  }
  return { overdue: overdue1.length, escalated: overdue3.length }
}

/** Ẩn danh hoá lead không phát sinh liên hệ sau 24 tháng [ĐX] — giữ thống kê, bỏ dữ liệu nhận diện. */
export async function anonymizeStaleLeads(req: PayloadRequest, months = Number(process.env.LEAD_RETENTION_MONTHS ?? 24)) {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const stale = await req.payload.find({
    collection: 'leads',
    where: { and: [{ updatedAt: { less_than: cutoff.toISOString() } }, { contactName: { not_equals: '(đã ẩn danh)' } }] },
    overrideAccess: true,
    depth: 0,
    limit: 500,
    trash: true, // cả lead đã xoá mềm
  })
  for (const lead of stale.docs) {
    // Ghi chú hoạt động có thể chứa tên, số điện thoại, địa chỉ: xoá nội dung, giữ loại và thời điểm.
    await req.payload.update({
      collection: 'lead-activities',
      where: { lead: { equals: lead.id } },
      overrideAccess: true,
      context: { skipAudit: true },
      data: { note: '(đã ẩn danh)' },
    })
    const consentId = lead.consent && typeof lead.consent === 'object' ? lead.consent.id : lead.consent
    if (consentId) {
      await req.payload.db.updateOne({ collection: 'consents', id: consentId, data: { anonymized: true, ipHash: null, userAgent: null } })
    }
    await req.payload.update({
      collection: 'leads',
      id: lead.id,
      overrideAccess: true,
      context: { skipTransition: true },
      data: {
        contactName: '(đã ẩn danh)',
        phone: '—',
        phoneNormalized: null,
        email: null,
        position: null,
        taxCode: null,
        deliveryAddress: null,
        message: null,
        company: null,
        projectName: null,
        interestSkus: [],
      },
      trash: true,
    } as never)
  }
  return { anonymized: stale.docs.length }
}

export const leadOverdueTask: TaskConfig<{ input: Record<string, never>; output: { overdue: number; escalated: number } }> = {
  slug: 'leadOverdueCheck',
  label: 'Nhắc lead quá hạn',
  schedule: [{ cron: '0 * * * *', queue: 'hourly' }],
  handler: async ({ req }) => ({ output: await checkOverdueLeads(req) }),
}

export const complianceExpiryTask: TaskConfig<{ input: Record<string, never>; output: { warned: number; demoted: number } }> = {
  slug: 'complianceExpiryCheck',
  label: 'Kiểm tra hạn hồ sơ hợp quy',
  schedule: [{ cron: '0 * * * *', queue: 'hourly' }],
  handler: async ({ req }) => ({ output: await checkComplianceExpiry(req) }),
}

export const anonymizeTask: TaskConfig<{ input: Record<string, never>; output: { anonymized: number } }> = {
  slug: 'anonymizeStaleLeads',
  label: 'Ẩn danh hoá lead cũ',
  schedule: [{ cron: '0 2 1 * *', queue: 'daily' }],
  handler: async ({ req }) => ({ output: await anonymizeStaleLeads(req) }),
}

export const tasks = [sendLeadEmailsTask, notifyDataRequestTask, leadOverdueTask, complianceExpiryTask, anonymizeTask]
