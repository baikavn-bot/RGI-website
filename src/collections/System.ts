import type { CollectionConfig } from 'payload'

import { anyone, nobody, roles } from '../access'
import { auditAfterChange } from '../hooks/audit'

/** Nhật ký chỉ ghi thêm. Không ai sửa, xoá qua giao diện hay API. */
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: { singular: { vi: 'Nhật ký', en: 'Audit log' }, plural: { vi: 'Nhật ký', en: 'Audit logs' } },
  admin: {
    group: { vi: 'Hệ thống', en: 'System' },
    defaultColumns: ['createdAt', 'actorLabel', 'action', 'collectionSlug', 'docId'],
    listSearchableFields: ['actorLabel', 'collectionSlug', 'docId', 'action'],
  },
  defaultSort: '-createdAt',
  access: {
    read: roles('legal', 'director'),
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  fields: [
    { name: 'action', type: 'text', required: true, index: true },
    { name: 'collectionSlug', type: 'text', required: true, index: true },
    { name: 'docId', type: 'text', index: true },
    { name: 'actor', type: 'relationship', relationTo: 'users' },
    { name: 'actorLabel', type: 'text' },
    { name: 'changes', type: 'json' },
    { name: 'note', type: 'text' },
  ],
}

export const Redirects: CollectionConfig = {
  custom: { totp: { disableAccessWrapper: { read: true } } },
  slug: 'redirects',
  labels: { singular: { vi: 'Chuyển hướng URL', en: 'Redirect' }, plural: { vi: 'Chuyển hướng URL', en: 'Redirects' } },
  admin: { group: { vi: 'Hệ thống', en: 'System' }, useAsTitle: 'from', defaultColumns: ['from', 'to', 'permanent'] },
  access: {
    read: anyone,
    create: roles('tech', 'marketing', 'director'),
    update: roles('tech', 'marketing', 'director'),
    delete: roles('tech', 'director'),
  },
  hooks: { afterChange: [auditAfterChange('redirects')] },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: (v: unknown) => (typeof v === 'string' && v.startsWith('/')) || 'Bắt đầu bằng /',
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      validate: (v: unknown) => (typeof v === 'string' && (v.startsWith('/') || v.startsWith('https://'))) || 'Bắt đầu bằng / hoặc https://',
    },
    { name: 'permanent', type: 'checkbox', defaultValue: true, label: '301' },
  ],
}
