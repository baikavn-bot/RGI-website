import type { CollectionConfig } from 'payload'

import { anyone, fieldRoles, roles } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'

/** Năm dòng sản phẩm: RC-P, RC-H, RC-S, RC-R, RC-W (mã tạm). */
export const ProductLines: CollectionConfig = {
  // Khách đọc được nội dung công khai: không bọc quyền đọc bằng TOTP (quyền gốc vẫn lọc bản nháp, số liệu chưa xác nhận).
  custom: { totp: { disableAccessWrapper: { read: true } } },
  slug: 'product-lines',
  labels: { singular: { vi: 'Dòng sản phẩm', en: 'Product line' }, plural: { vi: 'Dòng sản phẩm', en: 'Product lines' } },
  admin: {
    useAsTitle: 'name',
    group: { vi: 'Sản phẩm', en: 'Products' },
    defaultColumns: ['code', 'name', 'order', 'color'],
  },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: roles('director', 'marketing'),
    update: roles('director', 'marketing', 'legal'),
    delete: roles('director'),
  },
  hooks: {
    afterChange: [auditAfterChange('product-lines'), revalidateAfterChange],
    afterDelete: [auditAfterDelete('product-lines'), revalidateAfterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: { vi: 'Mã dòng', en: 'Line code' },
          // Quy tắc BR-01, BR-02 dựa vào mã RC-P: chỉ Giám đốc, Quản trị kỹ thuật đổi được.
          access: { update: fieldRoles('director', 'tech') },
        },
        { name: 'order', type: 'number', defaultValue: 0, label: { vi: 'Thứ tự', en: 'Order' } },
        {
          name: 'color',
          type: 'text',
          required: true,
          label: { vi: 'Màu dòng (hex)', en: 'Line colour (hex)' },
          validate: (v: unknown) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)) || 'Dạng #RRGGBB',
        },
      ],
    },
    { name: 'name', type: 'text', required: true, localized: true, label: { vi: 'Tên dòng', en: 'Name' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      localized: true,
      index: true,
      label: { vi: 'Đường dẫn', en: 'Slug' },
      validate: (v: unknown) => (typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)) || 'Chữ thường không dấu, nối bằng gạch',
    },
    { name: 'tagline', type: 'text', localized: true, label: { vi: 'Câu ngắn', en: 'Tagline' } },
    { name: 'description', type: 'textarea', localized: true, label: { vi: 'Mô tả', en: 'Description' } },
    { name: 'image', type: 'upload', relationTo: 'media', label: { vi: 'Ảnh đại diện', en: 'Cover image' } },
    {
      name: 'note',
      type: 'textarea',
      localized: true,
      label: { vi: 'Ghi chú hiển thị', en: 'Public note' },
      admin: { description: { vi: 'Ví dụ: điều kiện mở bán ống uPVC.', en: 'e.g. conditions for uPVC pipe sales.' } },
    },
  ],
}
