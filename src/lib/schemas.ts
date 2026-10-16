/**
 * Schema form dùng chung cho trình duyệt và API (mục 14 blueprint).
 * Thông báo lỗi là mã; giao diện dịch mã sang tiếng Việt hoặc tiếng Anh (lib/i18n.ts).
 */
import { z } from 'zod'

import { DATA_REQUEST_KINDS, LEAD_TYPES, PROVINCES, SAMPLE_KITS, VOLUME_BANDS } from './constants'
import { isValidEmail, isValidTaxCode, normalizePhone } from './validators'

const values = <T extends { value: string }>(list: readonly T[]) =>
  list.map((o) => o.value) as [string, ...string[]]

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'too_long')
    .optional()
    .transform((v) => (v ? v : undefined))

export const leadSchema = z
  .object({
    type: z.enum(values(LEAD_TYPES), { errorMap: () => ({ message: 'invalid_type' }) }),
    locale: z.enum(['vi', 'en']).default('vi'),
    contactName: z
      .string({ required_error: 'name_required' })
      .trim()
      .min(2, 'name_required')
      .max(80, 'too_long')
      .refine((v) => /\p{L}/u.test(v), 'name_required'),
    phone: z.string({ required_error: 'phone_invalid' }).trim().min(6, 'phone_invalid').max(30, 'phone_invalid'),
    email: optionalText(254),
    country: optionalText(60),
    province: optionalText(60),
    position: optionalText(80),
    company: optionalText(200),
    taxCode: optionalText(20),
    interestLines: z.array(z.string().max(10)).max(10).optional(),
    interestSkus: z.array(z.string().max(40)).max(50).optional(),
    warehouseArea: z.coerce.number().min(0, 'area_invalid').max(100000, 'area_invalid').optional(),
    projectName: optionalText(200),
    volumeBand: z.enum(values(VOLUME_BANDS)).optional(),
    neededBy: optionalText(7),
    kits: z.array(z.enum(values(SAMPLE_KITS))).max(5).optional(),
    deliveryAddress: optionalText(250),
    message: optionalText(1000),
    consent: z.literal(true, { errorMap: () => ({ message: 'consent_required' }) }),
    // Trường ẩn
    website: z.string().max(0, 'spam').optional(), // ô bẫy chống bot
    turnstileToken: optionalText(4096),
    utmSource: optionalText(100),
    utmMedium: optionalText(100),
    utmCampaign: optionalText(150),
    sourcePath: optionalText(300),
    referrer: optionalText(500),
  })
  .superRefine((d, ctx) => {
    const add = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
    const country = d.locale === 'en' ? d.country || 'VN' : 'VN'

    if (!normalizePhone(d.phone, country === 'VN' || country === 'Vietnam' ? 'VN' : 'INTL')) add('phone', 'phone_invalid')
    if (d.email && !isValidEmail(d.email)) add('email', 'email_invalid')
    if (d.locale === 'en' && !d.email) add('email', 'email_required')
    if (d.taxCode && !isValidTaxCode(d.taxCode)) add('taxCode', 'tax_code_invalid')

    const needsProvince = d.type !== 'contact' && (d.locale === 'vi' || !d.country || d.country === 'VN')
    if (needsProvince && !d.province) add('province', 'province_required')
    if (d.province && d.locale === 'vi' && !(PROVINCES as readonly string[]).includes(d.province))
      add('province', 'province_required')
    if (d.locale === 'en' && d.type !== 'contact' && !d.country && !d.province) add('country', 'country_required')

    if ((d.type === 'distributor' || d.type === 'retailer' || d.type === 'sample') && !d.company)
      add('company', 'company_required')
    if ((d.type === 'distributor' || d.type === 'retailer') && !d.interestLines?.length)
      add('interestLines', 'lines_required')
    if (d.type === 'contractor' && !d.projectName) add('projectName', 'project_required')
    if (d.type === 'contractor' && d.neededBy) {
      const ok = /^\d{4}-\d{2}$/.test(d.neededBy)
      const now = new Date()
      const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      if (!ok) add('neededBy', 'month_invalid')
      else if (d.neededBy < current) add('neededBy', 'month_past')
    }
    if (d.type === 'sample') {
      if (!d.kits?.length) add('kits', 'kits_required')
      if (!d.deliveryAddress || d.deliveryAddress.length < 10) add('deliveryAddress', 'address_required')
    }
  })

export type LeadInput = z.infer<typeof leadSchema>

export const dataRequestSchema = z.object({
  kind: z.enum(values(DATA_REQUEST_KINDS), { errorMap: () => ({ message: 'invalid_type' }) }),
  locale: z.enum(['vi', 'en']).default('vi'),
  contactName: z.string().trim().min(2, 'name_required').max(80, 'too_long'),
  contact: z
    .string()
    .trim()
    .min(6, 'contact_required')
    .max(254, 'too_long')
    .refine((v) => isValidEmail(v) || !!normalizePhone(v, 'VN') || !!normalizePhone(v, 'INTL'), 'contact_required'),
  detail: optionalText(1000),
  website: z.string().max(0, 'spam').optional(),
  turnstileToken: optionalText(4096),
})

export type DataRequestInput = z.infer<typeof dataRequestSchema>

/** Gom lỗi zod thành { trường: mã lỗi } để trả về API và hiện cạnh ô nhập. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
