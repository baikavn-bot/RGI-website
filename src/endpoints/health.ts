import type { Endpoint } from 'payload'

/** GET /api/health — kiểm tra sống cho giám sát; không lộ chi tiết lỗi. */
export const healthEndpoint: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req) => {
    try {
      await req.payload.count({ collection: 'product-lines', overrideAccess: true })
      return Response.json({ ok: true, db: 'ok' }, { headers: { 'cache-control': 'no-store' } })
    } catch {
      return Response.json({ ok: false }, { status: 503, headers: { 'cache-control': 'no-store' } })
    }
  },
}
