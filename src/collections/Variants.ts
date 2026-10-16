import type { CollectionBeforeChangeHook, CollectionConfig, Field, FieldAccess } from 'payload'

import { fieldRoles, hasRole, isInternal, roles } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'
import { options, SPEC_STATUSES } from '../lib/constants'

/** BR-04: số liệu quy cách chỉ hiện công khai khi nhà máy đã xác nhận. */
const specRead: FieldAccess = ({ req, doc }) => isInternal(req) || doc?.specStatus === 'factory_confirmed'

const SPEC_FIELDS = ['dnMm', 'eMm', 'idMm', 'odMm', 'lengthM', 'lengthMm', 'widthMm', 'thicknessMm', 'pnBar', 'weightKgPerM', 'coilLengthM'] as const

const spec = (name: (typeof SPEC_FIELDS)[number], vi: string, en: string): Field => ({
  name,
  type: 'number',
  label: { vi, en },
  access: { read: specRead },
  admin: { step: 0.01, width: '25%' },
})

/** Ai sửa số liệu (trừ Pháp chế, Giám đốc) thì quy cách quay về "đề xuất". */
const resetSpecStatus: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (!originalDoc || !req.user || hasRole(req, 'legal', 'director')) return data
  const changed = SPEC_FIELDS.some((k) => k in data && data[k] !== originalDoc[k])
  if (changed) data.specStatus = 'proposed'
  return data
}

export const Variants: CollectionConfig = {
  // Khách đọc được nội dung công khai: không bọc quyền đọc bằng TOTP (quyền gốc vẫn lọc bản nháp, số liệu chưa xác nhận).
  custom: { totp: { disableAccessWrapper: { read: true } } },
  slug: 'variants',
  labels: { singular: { vi: 'Quy cách', en: 'Variant' }, plural: { vi: 'Quy cách', en: 'Variants' } },
  admin: {
    useAsTitle: 'sku',
    group: { vi: 'Sản phẩm', en: 'Products' },
    defaultColumns: ['sku', 'product', 'sizeLabel', 'specStatus', 'updatedAt'],
    listSearchableFields: ['sku', 'sizeLabel'],
  },
  defaultSort: 'order',
  access: {
    // Khách chỉ thấy quy cách của sản phẩm đã xuất bản.
    read: ({ req }) => (isInternal(req) ? true : { 'product._status': { equals: 'published' } }),
    create: roles('director', 'marketing', 'editor', 'legal'),
    update: roles('director', 'marketing', 'editor', 'legal'),
    delete: roles('director'),
  },
  hooks: {
    beforeChange: [resetSpecStatus],
    afterChange: [auditAfterChange('variants'), revalidateAfterChange],
    afterDelete: [auditAfterDelete('variants'), revalidateAfterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'sku', type: 'text', required: true, unique: true, index: true, label: { vi: 'Mã quy cách', en: 'SKU' } },
        { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true, label: { vi: 'Sản phẩm', en: 'Product' } },
        { name: 'order', type: 'number', defaultValue: 0, label: { vi: 'Thứ tự', en: 'Order' } },
      ],
    },
    {
      name: 'sizeLabel',
      type: 'text',
      required: true,
      localized: true,
      label: { vi: 'Tên cỡ (luôn hiện)', en: 'Size label (always shown)' },
      admin: { description: { vi: 'Tên gọi thị trường, ví dụ Ø114, 5/8", 1220 × 2440.', en: 'Market name, e.g. Ø114, 5/8".' } },
    },
    {
      name: 'specStatus',
      type: 'select',
      required: true,
      defaultValue: 'proposed',
      options: options(SPEC_STATUSES),
      label: { vi: 'Trạng thái số liệu', en: 'Spec status' },
      access: { create: fieldRoles('legal', 'director'), update: fieldRoles('legal', 'director') },
      admin: { position: 'sidebar' },
    },
    {
      type: 'collapsible',
      label: { vi: 'Số liệu kỹ thuật', en: 'Specifications' },
      fields: [
        {
          type: 'row',
          fields: [
            spec('dnMm', 'Đường kính ngoài danh nghĩa (mm)', 'Nominal OD (mm)'),
            spec('eMm', 'Chiều dày (mm)', 'Wall thickness (mm)'),
            spec('pnBar', 'Áp suất danh nghĩa PN (bar)', 'PN (bar)'),
            spec('lengthM', 'Chiều dài cây (m)', 'Length (m)'),
          ],
        },
        {
          type: 'row',
          fields: [
            spec('idMm', 'Đường kính trong (mm)', 'Inner diameter (mm)'),
            spec('odMm', 'Đường kính ngoài (mm)', 'Outer diameter (mm)'),
            spec('coilLengthM', 'Dài cuộn (m)', 'Coil length (m)'),
            spec('weightKgPerM', 'Khối lượng (kg/m)', 'Weight (kg/m)'),
          ],
        },
        {
          type: 'row',
          fields: [
            spec('lengthMm', 'Chiều dài tấm (mm)', 'Sheet length (mm)'),
            spec('widthMm', 'Khổ rộng (mm)', 'Width (mm)'),
            spec('thicknessMm', 'Chiều dày tấm (mm)', 'Sheet thickness (mm)'),
          ],
        },
        { name: 'color', type: 'text', localized: true, label: { vi: 'Màu', en: 'Colour' } },
        { name: 'note', type: 'text', localized: true, label: { vi: 'Ghi chú', en: 'Note' } },
      ],
    },
  ],
}
