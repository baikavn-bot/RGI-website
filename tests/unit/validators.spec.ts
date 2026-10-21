import { describe, expect, it } from 'vitest'

import { LEAD_TRANSITIONS } from '../../src/lib/constants'
import { leadSchema } from '../../src/lib/schemas'
import { businessDaysSince, signDownload, verifyDownload } from '../../src/lib/security'
import { formatPhoneVN, isValidTaxCode, normalizePhone, stripTags } from '../../src/lib/validators'

describe('T08 · chuẩn hoá số điện thoại', () => {
  it.each([
    ['0912345678', '+84912345678'],
    ['+84912345678', '+84912345678'],
    ['84 912 345 678', '+84912345678'],
    ['0948 391 202', '+84948391202'],
    ['028 3822 1234', '+842838221234'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected)
  })
  it('từ chối số sai', () => {
    expect(normalizePhone('012345')).toBeNull()
    expect(normalizePhone('0112345678')).toBeNull()
    expect(normalizePhone('abc')).toBeNull()
  })
  it('hiển thị kiểu Việt Nam', () => {
    expect(formatPhoneVN('+84948391202')).toBe('0948 391 202')
  })
  it('chưa có hotline (database mới) thì trả rỗng, không làm sập trang', () => {
    expect(formatPhoneVN(undefined)).toBe('')
    expect(formatPhoneVN(null)).toBe('')
    expect(formatPhoneVN('')).toBe('')
  })
})

describe('Mã số thuế, làm sạch nội dung', () => {
  it('10 hoặc 13 chữ số', () => {
    expect(isValidTaxCode('0319717793')).toBe(true)
    expect(isValidTaxCode('0319717793-001')).toBe(true)
    expect(isValidTaxCode('031971779')).toBe(false)
  })
  it('T15 · bỏ thẻ HTML', () => {
    expect(stripTags('<script>alert(1)</script>Xin chào')).toBe('alert(1)Xin chào')
  })
})

describe('Schema form', () => {
  const base = { type: 'contact', locale: 'vi', contactName: 'Nguyễn Văn A', phone: '0912345678', consent: true }
  it('hợp lệ với form liên hệ tối thiểu', () => {
    expect(leadSchema.safeParse(base).success).toBe(true)
  })
  it('thiếu đồng ý → consent_required', () => {
    const r = leadSchema.safeParse({ ...base, consent: undefined })
    expect(r.success).toBe(false)
    expect(r.error?.issues.some((i) => i.message === 'consent_required')).toBe(true)
  })
  it('nhà phân phối cần tên doanh nghiệp, tỉnh, dòng quan tâm', () => {
    const r = leadSchema.safeParse({ ...base, type: 'distributor' })
    const codes = r.error?.issues.map((i) => i.message)
    expect(codes).toEqual(expect.arrayContaining(['company_required', 'province_required', 'lines_required']))
  })
  it('bộ mẫu cần chọn bộ và địa chỉ', () => {
    const r = leadSchema.safeParse({ ...base, type: 'sample', company: 'Cửa hàng A', province: 'Đồng Nai' })
    const codes = r.error?.issues.map((i) => i.message)
    expect(codes).toEqual(expect.arrayContaining(['kits_required', 'address_required']))
  })
  it('form tiếng Anh bắt buộc email', () => {
    const r = leadSchema.safeParse({ ...base, locale: 'en' })
    expect(r.error?.issues.map((i) => i.message)).toContain('email_required')
  })
})

describe('Liên kết tải có chữ ký (BR-07)', () => {
  it('đúng chữ ký thì qua, sai thì không', () => {
    const { exp, sig } = signDownload(12, 60)
    expect(verifyDownload(12, exp, sig)).toBe(true)
    expect(verifyDownload(13, exp, sig)).toBe(false)
    expect(verifyDownload(12, exp - 120, sig)).toBe(false)
  })
})

describe('Vòng đời lead, ngày làm việc', () => {
  it('lead đã thành đối tác không chuyển tiếp', () => {
    expect(LEAD_TRANSITIONS.won).toEqual([])
    expect(LEAD_TRANSITIONS.new).toContain('contacted')
  })
  it('thứ Sáu → thứ Hai là 1 ngày làm việc', () => {
    expect(businessDaysSince(new Date('2026-10-16T09:00:00'), new Date('2026-10-19T09:00:00'))).toBe(1)
  })
})

import { diff } from '../../src/hooks/audit'

describe('Nhật ký không chứa bí mật', () => {
  it('bỏ qua totpSecret, mật khẩu', () => {
    const d = diff({ name: 'A' }, { name: 'B', totpSecret: 'SECRET', hash: 'x', password: 'p' })
    expect(Object.keys(d)).toEqual(['name'])
  })
})
