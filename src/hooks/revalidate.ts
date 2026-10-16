/**
 * Xoá cache website khi nội dung đổi (mục 17 blueprint). Trang công khai đọc dữ liệu qua
 * cache gắn thẻ "site"; thẻ bị xoá thì lượt xem kế tiếp lấy dữ liệu mới.
 */
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, PayloadRequest } from 'payload'

export async function revalidateSite(req: PayloadRequest) {
  if (req.context?.disableRevalidate || process.env.DISABLE_REVALIDATE === 'true') return
  try {
    const { revalidateTag } = await import('next/cache')
    revalidateTag('site', { expire: 0 })
  } catch (err) {
    // Chạy ngoài Next.js (script seed, test) thì bỏ qua.
    req.payload.logger.debug({ err, msg: 'revalidate skipped' })
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await revalidateSite(req)
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await revalidateSite(req)
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = async ({ doc, req }) => {
  await revalidateSite(req)
  return doc
}
