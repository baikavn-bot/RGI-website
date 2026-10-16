import path from 'path'

/** Thư mục lưu tệp tải lên. Trên máy chủ, gắn volume vào UPLOAD_DIR và sao lưu hằng ngày. */
export const uploadRoot = () => path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'))
export const uploadDir = (slug: 'media' | 'documents') => path.join(uploadRoot(), slug)
