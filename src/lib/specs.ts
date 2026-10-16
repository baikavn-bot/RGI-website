import type { Variant } from '../payload-types'

/** Cột số liệu hiển thị theo dòng sản phẩm. */
export const SPEC_COLUMNS: Record<string, (keyof Variant)[]> = {
  'RC-P': ['dnMm', 'eMm', 'pnBar', 'lengthM'],
  'RC-H': ['idMm', 'odMm', 'coilLengthM', 'weightKgPerM'],
  'RC-S': ['lengthMm', 'widthMm', 'thicknessMm'],
  'RC-R': ['lengthMm', 'widthMm', 'thicknessMm'],
  'RC-W': ['lengthMm', 'widthMm', 'thicknessMm'],
}

export const columnsFor = (lineCode?: string) => (SPEC_COLUMNS[lineCode ?? ''] ?? SPEC_COLUMNS['RC-S']) as string[]

export function toRows(variants: Variant[], columns: string[], productName?: (v: Variant) => string | undefined) {
  return variants.map((v) => ({
    sku: v.sku,
    sizeLabel: v.sizeLabel,
    product: productName?.(v),
    color: v.color,
    values: Object.fromEntries(columns.map((c) => [c, (v as unknown as Record<string, number | null | undefined>)[c]])),
  }))
}
