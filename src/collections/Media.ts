import type { CollectionConfig } from 'payload'

import { fieldRoles, hasRole, isInternal, roles } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { revalidateAfterChange } from '../hooks/revalidate'
import { uploadDir } from '../lib/paths'

/**
 * Ảnh. Khách chỉ thấy ảnh đã khai nguồn và đã xác nhận quyền dùng (chặn ảnh có nhãn bên thứ ba).
 */
export const Media: CollectionConfig = {
  // Khách đọc được nội dung công khai: không bọc quyền đọc bằng TOTP (quyền gốc vẫn lọc bản nháp, số liệu chưa xác nhận).
  custom: { totp: { disableAccessWrapper: { read: true } } },
  slug: 'media',
  labels: { singular: { vi: 'Ảnh', en: 'Image' }, plural: { vi: 'Ảnh', en: 'Images' } },
  admin: {
    group: { vi: 'Nội dung', en: 'Content' },
    defaultColumns: ['filename', 'alt', 'rightsCleared', 'updatedAt'],
  },
  access: {
    read: ({ req }) => (isInternal(req) ? true : { rightsCleared: { equals: true } }),
    create: roles('director', 'marketing', 'editor', 'legal'),
    update: roles('director', 'marketing', 'editor', 'legal'),
    delete: roles('director', 'marketing'),
  },
  hooks: {
    beforeChange: [
      // Thay tệp ảnh khác thì phải xác nhận quyền dùng lại (trừ Quản lý marketing, Pháp chế, Giám đốc).
      ({ data, operation, req }) => {
        if (operation === 'update' && req.file && !hasRole(req, 'director', 'marketing', 'legal')) {
          data.rightsCleared = false
        }
        return data
      },
    ],
    afterChange: [auditAfterChange('media'), revalidateAfterChange],
    afterDelete: [auditAfterDelete('media')],
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    staticDir: uploadDir('media'),
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumb', width: 480, formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'card', width: 960, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'hero', width: 1600, formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: { vi: 'Mô tả ảnh (alt)', en: 'Alt text' },
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      label: { vi: 'Nguồn ảnh', en: 'Source' },
      admin: { description: { vi: 'Ví dụ: ảnh nhà máy REN Group, RGI chụp 9/2026', en: 'e.g. REN Group factory, shot by RGI 09/2026' } },
    },
    { name: 'rightsNote', type: 'textarea', label: { vi: 'Ghi chú quyền dùng', en: 'Rights note' } },
    {
      name: 'rightsCleared',
      type: 'checkbox',
      defaultValue: false,
      label: { vi: 'Đã xác nhận quyền dùng, không có nhãn bên thứ ba', en: 'Rights cleared, no third-party marks' },
      access: { update: fieldRoles('director', 'marketing', 'legal'), create: fieldRoles('director', 'marketing', 'legal') },
      admin: { position: 'sidebar' },
    },
  ],
}
