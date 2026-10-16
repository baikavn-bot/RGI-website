import type { Endpoint, Payload } from 'payload'

import { dataRequestSchema, fieldErrors } from '../lib/schemas'
import { clientIp, rateLimit, refCode, verifyTurnstile } from '../lib/security'
import { stripTags } from '../lib/validators'
import { apiError, apiOk } from './respond'

/** Hạn xử lý mặc định [ĐX] — Pháp chế chốt theo WB02. */
const DEFAULT_DUE_DAYS = 15

export async function submitDataRequest(payload: Payload, raw: unknown) {
  const parsed = dataRequestSchema.safeParse(raw)
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error)
    if (fields.website) return { ok: true as const, refCode: refCode('DR') }
    return { ok: false as const, status: 400, code: 'validation_failed', message: 'Dữ liệu chưa hợp lệ.', fields }
  }
  const d = parsed.data
  const code = refCode('DR')
  await payload.create({
    collection: 'data-requests',
    overrideAccess: true,
    data: {
      refCode: code,
      kind: d.kind as never,
      contactName: stripTags(d.contactName),
      contact: d.contact,
      detail: d.detail ? stripTags(d.detail) : undefined,
      locale: d.locale,
      status: 'received',
      dueAt: new Date(Date.now() + DEFAULT_DUE_DAYS * 24 * 3600 * 1000).toISOString(),
    },
  })
  await payload.jobs.queue({ task: 'notifyDataRequest', input: { refCode: code } })
  return { ok: true as const, refCode: code }
}

/** POST /api/data-requests/submit */
export const submitDataRequestEndpoint: Endpoint = {
  path: '/submit',
  method: 'post',
  handler: async (req) => {
    const ip = clientIp(req.headers)
    const limit = rateLimit(`dsr:${ip}`, 3, 10 * 60 * 1000)
    if (!limit.ok) return apiError(429, 'rate_limited', 'Bạn gửi quá nhiều lần. Vui lòng thử lại sau.')
    let body: Record<string, unknown>
    try {
      body = (await req.json?.()) as Record<string, unknown>
    } catch {
      return apiError(400, 'invalid_json', 'Dữ liệu gửi lên không đọc được.')
    }
    if (!(await verifyTurnstile(body?.turnstileToken as string | undefined, ip))) {
      return apiError(400, 'captcha_failed', 'Không xác minh được người gửi.')
    }
    const result = await submitDataRequest(req.payload, body)
    if (!result.ok) return apiError(result.status, result.code, result.message, result.fields)
    return apiOk({ refCode: result.refCode }, 201)
  },
}
