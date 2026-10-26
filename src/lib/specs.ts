import type { Product, Variant } from '../payload-types'
import type { SpecTemplate } from './constants'

/**
 * Một cột số liệu. `min` là trường chính; có `max` thì hiện dạng khoảng "15,6 – 16,0".
 * `scale` đổi đơn vị khi hiện (vd. lưu mm, hiện cm). `dp`: số chữ số thập phân cố định, như catalog ("25,0").
 */
export type SpecColumn = { key: string; min: keyof Variant; max?: keyof Variant; scale?: number; dp?: number }

const col = (key: string, min: keyof Variant, max?: keyof Variant, dp?: number): SpecColumn => ({ key, min, max, dp })

/** Bảng dạng danh sách: mỗi quy cách một dòng. Các kiểu còn lại vẽ riêng (ma trận, tên, hai cột độc lập). */
export const LIST_COLUMNS: Partial<Record<SpecTemplate, SpecColumn[]>> = {
  hose: [col('idMm', 'idMm', undefined, 1), col('odMm', 'odMm', 'odMaxMm', 1), col('coilLengthM', 'coilLengthM'), col('kgPerCoil', 'weightKgPerCoilMin', 'weightKgPerCoilMax', 1)],
  sheet: [col('lengthMm', 'lengthMm'), col('widthMm', 'widthMm')],
  panel: [col('lengthMm', 'lengthMm'), col('widthMm', 'widthMm'), col('thicknessMm', 'thicknessMm')],
}

/** Sản phẩm cũ chưa chọn kiểu bảng: chọn theo dòng như trước. */
const BY_LINE: Record<string, SpecTemplate> = { 'RC-P': 'pressure_pipe', 'RC-H': 'hose', 'RC-S': 'panel', 'RC-R': 'panel', 'RC-W': 'panel' }

export const templateFor = (product: Pick<Product, 'specTemplate'>, lineCode?: string): SpecTemplate =>
  product.specTemplate ?? BY_LINE[lineCode ?? ''] ?? 'panel'

export type SpecValue = { min: number | null; max: number | null; dp?: number }

export const valueOf = (v: Variant, c: SpecColumn): SpecValue => {
  const raw = v as unknown as Record<string, number | null | undefined>
  const s = c.scale ?? 1
  const min = raw[c.min as string]
  const max = c.max ? raw[c.max as string] : null
  return { min: min == null ? null : min / s, max: max == null ? null : max / s, dp: c.dp }
}

export function toRows(variants: Variant[], columns: SpecColumn[]) {
  return variants.map((v) => ({
    sku: v.sku,
    sizeLabel: v.sizeLabel,
    color: v.color,
    values: Object.fromEntries(columns.map((c) => [c.key, valueOf(v, c)])),
  }))
}

export const fmtNumber = (v: number, locale: string, dp?: number) =>
  new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN', dp == null ? { maximumFractionDigits: 2 } : { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v)

/** Một số, hoặc khoảng "15,6 – 16,0". Trả null khi số chưa được công bố (BR-04). */
export const fmtValue = ({ min, max, dp }: SpecValue, locale: string) => {
  if (min == null) return null
  if (max == null || max === min) return fmtNumber(min, locale, dp)
  return `${fmtNumber(min, locale, dp)} – ${fmtNumber(max, locale, dp)}`
}
