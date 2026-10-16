import type { CollectionConfig } from 'payload'

import { fieldRoles, publishedOrInternal, roles } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { legalGate, legalReviewField } from '../hooks/legalGate'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'

/** Mỗi trang cố định của website có một bản ghi theo khoá (key). Bố cục nằm trong code, chữ nằm ở đây. */
export const PAGE_KEYS = [
  { value: 'home', label: { vi: 'Trang chủ', en: 'Home' } },
  { value: 'about', label: { vi: 'Về RENCO', en: 'About' } },
  { value: 'factory', label: { vi: 'Nhà máy và tái chế', en: 'Factory' } },
  { value: 'products', label: { vi: 'Sản phẩm', en: 'Products' } },
  { value: 'partners', label: { vi: 'Hợp tác', en: 'Partners' } },
  { value: 'samples', label: { vi: 'Bộ mẫu', en: 'Samples' } },
  { value: 'downloads', label: { vi: 'Tài liệu', en: 'Downloads' } },
  { value: 'contact', label: { vi: 'Liên hệ', en: 'Contact' } },
  { value: 'terms', label: { vi: 'Điều khoản sử dụng (WB01)', en: 'Terms of use (WB01)' } },
  { value: 'privacy', label: { vi: 'Chính sách dữ liệu cá nhân (WB02)', en: 'Privacy policy (WB02)' } },
]

export const Pages: CollectionConfig = {
  // Khách đọc được nội dung công khai: không bọc quyền đọc bằng TOTP (quyền gốc vẫn lọc bản nháp, số liệu chưa xác nhận).
  custom: { totp: { disableAccessWrapper: { read: true } } },
  slug: 'pages',
  labels: { singular: { vi: 'Trang', en: 'Page' }, plural: { vi: 'Trang', en: 'Pages' } },
  admin: {
    useAsTitle: 'title',
    group: { vi: 'Nội dung', en: 'Content' },
    defaultColumns: ['key', 'title', 'kind', '_status', 'updatedAt'],
  },
  versions: { drafts: true, maxPerDoc: 50 },
  access: {
    read: publishedOrInternal,
    create: roles('director', 'marketing', 'editor', 'legal'),
    update: roles('director', 'marketing', 'editor', 'legal'),
    delete: roles('director'),
  },
  hooks: {
    beforeChange: [
      // Trang pháp lý luôn cần Pháp chế, kể cả khi ai đó đổi "Loại" sang trang thường.
      async (args) => {
        const { data, originalDoc } = args
        const legalKey = ['terms', 'privacy'].includes(String(data.key ?? originalDoc?.key))
        if (legalKey) data.kind = 'legal'
        return legalGate({ requiresLegal: () => legalKey || data.kind === 'legal' || originalDoc?.kind === 'legal' })(args)
      },
    ],
    afterChange: [auditAfterChange('pages'), revalidateAfterChange],
    afterDelete: [auditAfterDelete('pages'), revalidateAfterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'key', type: 'select', required: true, unique: true, options: PAGE_KEYS, label: { vi: 'Trang', en: 'Page' } },
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'standard',
          access: { create: fieldRoles('legal', 'director'), update: fieldRoles('legal', 'director') },
          label: { vi: 'Loại', en: 'Kind' },
          options: [
            { value: 'standard', label: { vi: 'Trang thường', en: 'Standard' } },
            { value: 'legal', label: { vi: 'Trang pháp lý (cần Pháp chế duyệt)', en: 'Legal page (needs legal review)' } },
          ],
        },
      ],
    },
    { name: 'kicker', type: 'text', localized: true, label: { vi: 'Dòng nhỏ trên tiêu đề', en: 'Kicker' } },
    { name: 'title', type: 'text', required: true, localized: true, label: { vi: 'Tiêu đề', en: 'Title' } },
    {
      name: 'titleAccent',
      type: 'text',
      localized: true,
      label: { vi: 'Cụm nhấn màu xanh', en: 'Accent phrase' },
      admin: { description: { vi: 'Phần cuối tiêu đề, hiển thị màu xanh thương hiệu.', en: 'Shown in brand green after the title.' } },
    },
    { name: 'summary', type: 'textarea', localized: true, label: { vi: 'Đoạn mở đầu', en: 'Lead paragraph' } },
    { name: 'body', type: 'richText', localized: true, label: { vi: 'Nội dung', en: 'Body' } },
    {
      name: 'blocks',
      type: 'array',
      localized: true,
      label: { vi: 'Khối nội dung (tiêu đề + đoạn + số liệu)', en: 'Content blocks' },
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
        { name: 'figure', type: 'text', label: { vi: 'Số liệu (có nguồn)', en: 'Figure (sourced)' } },
        { name: 'figureLabel', type: 'text' },
        { name: 'source', type: 'text', label: { vi: 'Nguồn số liệu', en: 'Source' } },
      ],
    },
    { name: 'hero', type: 'upload', relationTo: 'media', label: { vi: 'Ảnh đầu trang', en: 'Hero image' } },
    {
      type: 'row',
      admin: { condition: (_, s) => s?.kind === 'legal' },
      fields: [
        { name: 'effectiveDate', type: 'date', label: { vi: 'Ngày hiệu lực', en: 'Effective date' } },
        { name: 'policyVersion', type: 'text', label: { vi: 'Phiên bản', en: 'Version' } },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text', localized: true, maxLength: 60 },
        { name: 'description', type: 'textarea', localized: true, maxLength: 155 },
      ],
    },
    legalReviewField,
  ],
}
