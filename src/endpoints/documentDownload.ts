import fs from 'fs/promises'
import path from 'path'
import type { Endpoint } from 'payload'

import { uploadDir } from '../lib/paths'
import { verifyDownload } from '../lib/security'
import { apiError } from './respond'

/**
 * GET /api/documents/:id/download
 * - public: đếm lượt tải rồi chuyển tới tệp
 * - gated: cần ?exp=&sig= hợp lệ (BR-07)
 * - internal: luôn 404, không lộ tên tệp
 */
export const downloadEndpoint: Endpoint = {
  path: '/:id/download',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.id as string
    let doc: import('../payload-types').Document | null = null
    try {
      doc = await req.payload.findByID({ collection: 'documents', id, overrideAccess: true, depth: 0 })
    } catch {
      doc = null
    }
    if (!doc || doc.visibility === 'internal') return apiError(404, 'not_found', 'Không tìm thấy tài liệu.')

    if (doc.visibility === 'gated') {
      const url = new URL(req.url ?? 'http://localhost')
      const exp = Number(url.searchParams.get('exp'))
      const sig = url.searchParams.get('sig') ?? ''
      if (!verifyDownload(id, exp, sig)) {
        return apiError(exp && exp < Date.now() / 1000 ? 410 : 403, 'link_invalid', 'Liên kết đã hết hạn hoặc không hợp lệ.')
      }
    }

    await req.payload.update({
      collection: 'documents',
      id,
      overrideAccess: true,
      context: { skipAudit: true, disableRevalidate: true },
      data: { downloadCount: (Number(doc.downloadCount) || 0) + 1 },
    })

    if (doc.visibility === 'public') {
      return Response.redirect(new URL(String(doc.url), req.url ?? 'http://localhost'), 302)
    }

    // gated: phát tệp trực tiếp, không lộ đường dẫn lưu trữ
    const file = path.join(uploadDir('documents'), path.basename(String(doc.filename)))
    try {
      const data = await fs.readFile(file)
      return new Response(data, {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${encodeURIComponent(String(doc.filename))}"`,
          'cache-control': 'private, no-store',
        },
      })
    } catch {
      return apiError(404, 'not_found', 'Không tìm thấy tệp.')
    }
  },
}
