/**
 * Chuẩn hoá và kiểm tra dữ liệu nhập. Dùng chung cho form (trình duyệt) và API (server).
 */

/** Chuẩn hoá số điện thoại về dạng +84… (Việt Nam) hoặc +… (quốc tế). Trả null nếu không hợp lệ. */
export function normalizePhone(raw: string, country: string = 'VN'): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/[^\d]/g, '')
  if (!digits) return null

  // Số Việt Nam: 0xxxxxxxxx, 84xxxxxxxxx, +84xxxxxxxxx
  let local: string | null = null
  if (digits.startsWith('84') && (hasPlus || digits.length >= 11)) local = '0' + digits.slice(2)
  else if (digits.startsWith('0')) local = digits

  if (local) {
    const mobile = /^0(3|5|7|8|9)\d{8}$/
    const landline = /^02\d{9}$/
    if (mobile.test(local) || landline.test(local)) return '+84' + local.slice(1)
    if (country === 'VN') return null
  }

  if (country !== 'VN' || hasPlus) {
    if (hasPlus && digits.length >= 8 && digits.length <= 15 && !digits.startsWith('84')) return '+' + digits
  }
  return null
}

/**
 * Hiển thị số đã chuẩn hoá theo kiểu Việt Nam: 0948 438 218.
 * Chưa có số (ví dụ Cài đặt chưa nhập hotline trên database mới) thì trả chuỗi rỗng, không làm sập trang.
 */
export function formatPhoneVN(normalized?: string | null): string {
  if (!normalized) return ''
  if (!normalized.startsWith('+84')) return normalized
  const local = '0' + normalized.slice(3)
  if (local.startsWith('02') && local.length === 11) return `${local.slice(0, 3)} ${local.slice(3, 7)} ${local.slice(7)}`
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
}

/** Mã số thuế: 10 chữ số, hoặc 10 chữ số kèm 3 chữ số chi nhánh (có hoặc không gạch nối). */
export function isValidTaxCode(raw: string): boolean {
  return /^\d{10}(-?\d{3})?$/.test(raw.trim())
}

export function isValidEmail(raw: string): boolean {
  return raw.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)
}

/** Bỏ thẻ HTML và ký tự điều khiển trong nội dung tự do. */
export function stripTags(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
}
