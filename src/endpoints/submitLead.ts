import type { Endpoint, Payload } from 'payload'

import type { LeadInput } from '../lib/schemas'
import { fieldErrors, leadSchema } from '../lib/schemas'
import { clientIp, hashIp, rateLimit, refCode, verifyTurnstile } from '../lib/security'
import { normalizePhone, stripTags } from '../lib/validators'
import { apiError, apiOk } from './respond'

type Meta = { ip: string; userAgent?: string }

export type SubmitResult =
  | { ok: true; refCode: string; merged: boolean; leadId: number | string }
  | { ok: false; status: number; code: string; message: string; fields?: Record<string, string> }

/**
 * Nhận form công khai (mục 5, 10, 14 blueprint).
 * BR-09: không có đồng ý thì không lưu. BR-08: cùng số điện thoại trong 30 ngày thì gộp.
 * Email báo sales chạy qua hàng đợi, form trả kết quả trước.
 */
export async function submitLead(payload: Payload, raw: unknown, meta: Meta): Promise<SubmitResult> {
  const parsed = leadSchema.safeParse(raw)
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error)
    if (fields.website) return { ok: true, refCode: refCode(), merged: false, leadId: 0 } // bot: trả như thành công, không lưu
    if (fields.consent) return { ok: false, status: 422, code: 'consent_required', message: 'Cần đồng ý xử lý dữ liệu.', fields }
    return { ok: false, status: 400, code: 'validation_failed', message: 'Dữ liệu chưa hợp lệ.', fields }
  }
  const input: LeadInput = parsed.data

  const settings = await payload.findGlobal({ slug: 'settings', locale: input.locale, overrideAccess: true, depth: 0 })
  const formsEnabled = (settings.forms ?? {}) as Record<string, boolean | undefined>
  if (formsEnabled[input.type] === false) {
    return { ok: false, status: 403, code: 'form_disabled', message: 'Form này đang tạm đóng.' }
  }

  const country = input.locale === 'en' ? input.country || 'VN' : 'VN'
  const phoneNormalized = normalizePhone(input.phone, country === 'VN' ? 'VN' : 'INTL')!

  // Map mã dòng (RC-P…) sang id
  let lineIds: (number | string)[] = []
  if (input.interestLines?.length) {
    const lines = await payload.find({
      collection: 'product-lines',
      where: { code: { in: input.interestLines } },
      overrideAccess: true,
      depth: 0,
      limit: 10,
    })
    lineIds = lines.docs.map((l) => l.id)
  }

  const clean = (v?: string) => (v ? stripTags(v) : undefined)
  const message = clean(input.message)

  const settingsConsent = settings.consent ?? {}
  const recordConsent = () =>
    payload.create({
      collection: 'consents',
      overrideAccess: true,
      data: {
        policyVersion: String(settingsConsent.policyVersion ?? 'WB02'),
        textShown: String(settingsConsent.text ?? '') || 'Đồng ý xử lý dữ liệu theo Chính sách dữ liệu cá nhân',
        locale: input.locale,
        grantedAt: new Date().toISOString(),
        ipHash: hashIp(meta.ip),
        userAgent: meta.userAgent?.slice(0, 300),
        sourcePath: input.sourcePath,
      },
    })

  // BR-08: gộp lead trùng số điện thoại trong 30 ngày
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const existing = await payload.find({
    collection: 'leads',
    where: { and: [{ phoneNormalized: { equals: phoneNormalized } }, { createdAt: { greater_than: since } }] },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs.length) {
    const lead = existing.docs[0]
    const prevLines = ((lead.interestLines ?? []) as unknown[]).map((l) => (typeof l === 'object' && l ? (l as { id: number }).id : l))
    const prevSkus = (lead.interestSkus ?? []) as string[]
    await payload.update({
      collection: 'leads',
      id: lead.id,
      overrideAccess: true,
      context: { skipTransition: true },
      data: {
        interestLines: Array.from(new Set([...prevLines, ...lineIds])) as number[],
        interestSkus: Array.from(new Set([...prevSkus, ...(input.interestSkus ?? [])])),
        kits: Array.from(new Set([...((lead.kits ?? []) as string[]), ...(input.kits ?? [])])) as never,
        mergedCount: (lead.mergedCount ?? 0) + 1,
        // Bổ sung thông tin còn thiếu, không ghi đè thông tin cũ
        ...(lead.email ? {} : input.email ? { email: input.email.toLowerCase() } : {}),
        ...(lead.company ? {} : input.company ? { company: clean(input.company) } : {}),
      },
    })
    const resubmitConsent = await recordConsent()
    const summary = [
      `Loại form: ${input.type}`,
      input.company && `Doanh nghiệp: ${clean(input.company)}`,
      input.projectName && `Công trình: ${clean(input.projectName)}`,
      input.interestSkus?.length && `Mã: ${input.interestSkus.join(', ')}`,
      input.kits?.length && `Bộ mẫu: ${input.kits.join(', ')}`,
      message && `Nội dung: ${message}`,
    ]
      .filter(Boolean)
      .join('\n')
    await payload.create({
      collection: 'lead-activities',
      overrideAccess: true,
      data: { lead: lead.id, kind: 'form_resubmit', note: `${summary}\nNgười gửi: ${clean(input.contactName)}`, consent: resubmitConsent.id },
    })
    await payload.jobs.queue({ task: 'sendLeadEmails', input: { leadId: lead.id, merged: true } })
    return { ok: true, refCode: String(lead.refCode), merged: true, leadId: lead.id }
  }

  const consent = await recordConsent()

  const code = refCode()
  const lead = await payload.create({
    collection: 'leads',
    overrideAccess: true,
    data: {
      refCode: code,
      type: input.type as never,
      locale: input.locale,
      contactName: clean(input.contactName)!,
      position: clean(input.position),
      phone: input.phone,
      phoneNormalized,
      email: input.email?.toLowerCase(),
      company: clean(input.company),
      taxCode: input.taxCode,
      province: input.province,
      country: input.locale === 'en' ? clean(input.country) : 'Việt Nam',
      interestLines: lineIds as number[],
      interestSkus: input.interestSkus,
      warehouseArea: input.warehouseArea,
      projectName: clean(input.projectName),
      volumeBand: input.volumeBand as never,
      neededBy: input.neededBy,
      kits: input.kits as never,
      deliveryAddress: clean(input.deliveryAddress),
      message,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      sourcePath: input.sourcePath,
      referrer: input.referrer,
      consent: consent.id,
      status: 'new',
    },
  })

  await payload.jobs.queue({ task: 'sendLeadEmails', input: { leadId: lead.id, merged: false } })
  return { ok: true, refCode: code, merged: false, leadId: lead.id }
}

/** POST /api/leads/submit */
export const submitLeadEndpoint: Endpoint = {
  path: '/submit',
  method: 'post',
  handler: async (req) => {
    const ip = clientIp(req.headers)
    const limit = rateLimit(`lead:${ip}`, Number(process.env.FORM_RATE_LIMIT ?? 5), 10 * 60 * 1000)
    if (!limit.ok) {
      return apiError(429, 'rate_limited', 'Bạn gửi quá nhiều lần. Vui lòng thử lại sau ít phút hoặc gọi hotline.', undefined, {
        'retry-after': String(limit.retryAfter),
      })
    }
    let body: Record<string, unknown>
    try {
      body = (await req.json?.()) as Record<string, unknown>
    } catch {
      return apiError(400, 'invalid_json', 'Dữ liệu gửi lên không đọc được.')
    }
    if (!(await verifyTurnstile(body?.turnstileToken as string | undefined, ip))) {
      return apiError(400, 'captcha_failed', 'Không xác minh được người gửi. Vui lòng gọi hotline.')
    }
    try {
      const result = await submitLead(req.payload, body, { ip, userAgent: req.headers.get('user-agent') ?? undefined })
      if (!result.ok) return apiError(result.status, result.code, result.message, result.fields)
      return apiOk({ refCode: result.refCode }, 201)
    } catch (err) {
      req.payload.logger.error({ err, msg: 'lead submit failed' })
      return apiError(500, 'server_error', 'Hệ thống đang lỗi. Vui lòng gọi hotline.')
    }
  },
}
