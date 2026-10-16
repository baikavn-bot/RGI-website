import type { CollectionConfig } from 'payload'

import { fieldRoles, internalField, isInternal, roles } from '../access'
import { downloadEndpoint } from '../endpoints/documentDownload'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { revalidateAfterChange } from '../hooks/revalidate'
import { DOCUMENT_KINDS, options } from '../lib/constants'
import { uploadDir } from '../lib/paths'

/**
 * Tài liệu PDF. BR-07: tài liệu nội bộ không bao giờ có liên kết công khai;
 * tài liệu gated chỉ tải qua liên kết có chữ ký.
 */
export const Documents: CollectionConfig = {
  // Khách đọc được nội dung công khai: không bọc quyền đọc bằng TOTP (quyền gốc vẫn lọc bản nháp, số liệu chưa xác nhận).
  custom: { totp: { disableAccessWrapper: { read: true } } },
  slug: 'documents',
  labels: { singular: { vi: 'Tài liệu', en: 'Document' }, plural: { vi: 'Tài liệu', en: 'Documents' } },
  admin: {
    useAsTitle: 'title',
    group: { vi: 'Nội dung', en: 'Content' },
    defaultColumns: ['title', 'kind', 'locale', 'visibility', 'version', 'publishedOn'],
  },
  access: {
    read: ({ req }) => (isInternal(req) ? true : { visibility: { equals: 'public' } }),
    create: roles('director', 'marketing', 'editor', 'legal'),
    update: roles('director', 'marketing', 'editor', 'legal'),
    delete: roles('director'),
  },
  hooks: {
    afterChange: [auditAfterChange('documents'), revalidateAfterChange],
    afterDelete: [auditAfterDelete('documents')],
  },
  endpoints: [downloadEndpoint],
  upload: {
    mimeTypes: ['application/pdf'],
    staticDir: uploadDir('documents'),
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: { vi: 'Tên tài liệu', en: 'Title' } },
    { name: 'kind', type: 'select', required: true, options: options(DOCUMENT_KINDS), label: { vi: 'Loại', en: 'Kind' } },
    {
      name: 'locale',
      type: 'select',
      required: true,
      defaultValue: 'vi',
      label: { vi: 'Ngôn ngữ', en: 'Language' },
      options: [
        { value: 'vi', label: 'Tiếng Việt' },
        { value: 'en', label: 'English' },
        { value: 'both', label: { vi: 'Song ngữ', en: 'Bilingual' } },
      ],
    },
    { name: 'version', type: 'text', label: { vi: 'Phiên bản', en: 'Version' } },
    { name: 'publishedOn', type: 'date', label: { vi: 'Ngày phát hành', en: 'Release date' } },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'internal',
      label: { vi: 'Hiển thị', en: 'Visibility' },
      options: [
        { value: 'public', label: { vi: 'Công khai', en: 'Public' } },
        { value: 'gated', label: { vi: 'Cần để lại thông tin (liên kết có chữ ký)', en: 'Gated (signed link)' } },
        { value: 'internal', label: { vi: 'Nội bộ', en: 'Internal' } },
      ],
      access: { update: fieldRoles('director', 'marketing', 'legal'), create: fieldRoles('director', 'marketing', 'legal') },
      admin: { position: 'sidebar' },
    },
    {
      name: 'downloadCount',
      type: 'number',
      defaultValue: 0,
      label: { vi: 'Lượt tải', en: 'Downloads' },
      access: { read: internalField, update: () => false, create: () => false },
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
