import { APIError, type CollectionConfig } from 'payload'

import { fieldRoles, hasRole, roles } from '../access'
import { auditAfterChange, auditAfterDelete, writeAudit } from '../hooks/audit'
import { options, ROLES } from '../lib/constants'

/** Tài khoản nội bộ. Mỗi người một tài khoản, không dùng chung (mục 3, 18). */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: { vi: 'Người dùng', en: 'User' }, plural: { vi: 'Người dùng', en: 'Users' } },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
    group: { vi: 'Hệ thống', en: 'System' },
  },
  auth: {
    tokenExpiration: 8 * 60 * 60, // 8 giờ [ĐX]
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // khoá 15 phút
    useSessions: true,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    // Người dùng nội bộ xem được danh sách đồng nghiệp (để giao lead, xem ai sửa gì); khách không xem được.
    read: ({ req }) => !!req.user,
    create: roles('director', 'tech'),
    update: ({ req }) => {
      if (hasRole(req, 'director', 'tech')) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    delete: roles('director'),
    admin: ({ req }) => !!req.user,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Chính sách mật khẩu: tối thiểu 12 ký tự, có chữ và số (mục 18).
        const pw = data?.password as string | undefined
        if (pw && (pw.length < 12 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw))) {
          throw new APIError('Mật khẩu phải có ít nhất 12 ký tự, gồm cả chữ và số.', 400, { code: 'weak_password' }, true)
        }
        return data
      },
    ],
    afterChange: [auditAfterChange('users')],
    afterDelete: [auditAfterDelete('users')],
    afterLogin: [
      async ({ req, user }) => {
        await writeAudit(req, { action: 'login', collectionSlug: 'users', docId: user.id })
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: { vi: 'Họ và tên', en: 'Full name' } },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'sales',
      label: { vi: 'Vai trò', en: 'Role' },
      options: options(ROLES),
      saveToJWT: true,
      access: { create: fieldRoles('director', 'tech'), update: fieldRoles('director', 'tech') },
      admin: { position: 'sidebar' },
    },
    {
      name: 'notifyLeads',
      type: 'checkbox',
      defaultValue: false,
      label: { vi: 'Nhận email khi có lead mới', en: 'Email me new leads' },
      // Email lead chứa dữ liệu cá nhân của mọi lead: chỉ Giám đốc, Quản lý marketing bật được.
      access: { create: fieldRoles('director', 'marketing'), update: fieldRoles('director', 'marketing') },
      admin: { position: 'sidebar' },
    },
  ],
}
