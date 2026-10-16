/**
 * Phân quyền theo vai trò (mục 3 blueprint). Mọi quyền kiểm ở backend.
 * Ẩn nút trên giao diện không phải là phân quyền.
 */
import type { Access, FieldAccess, PayloadRequest } from 'payload'

import type { Role } from '../lib/constants'

type MaybeUser = { id: string | number; role?: Role | null; collection?: string } | null | undefined

type SessionUser = NonNullable<MaybeUser> & { _strategy?: string }

/**
 * Người dùng chỉ được tính là nội bộ khi phiên đã qua xác thực hai lớp (hoặc dùng API key).
 * Phiên mới nhập mật khẩu, chưa nhập mã, được coi như khách.
 */
const verified = (user: SessionUser) =>
  process.env.TOTP_DISABLED === 'true' || user._strategy === 'totp' || user._strategy === 'api-key'

export const roleOf = (req: PayloadRequest): Role | null => {
  const user = req.user as SessionUser | null | undefined
  if (!user || user.collection !== 'users' || !verified(user)) return null
  return (user.role as Role) ?? null
}

export const hasRole = (req: PayloadRequest, ...roles: Role[]) => {
  const role = roleOf(req)
  return !!role && roles.includes(role)
}

export const isInternal = (req: PayloadRequest) => roleOf(req) !== null

/** Quyền collection: chỉ các vai trò liệt kê. */
export const roles =
  (...allowed: Role[]): Access =>
  ({ req }) =>
    hasRole(req, ...allowed)

/** Quyền trường: chỉ các vai trò liệt kê. */
export const fieldRoles =
  (...allowed: Role[]): FieldAccess =>
  ({ req }) =>
    hasRole(req, ...allowed)

export const internalOnly: Access = ({ req }) => isInternal(req)
export const internalField: FieldAccess = ({ req }) => isInternal(req)
export const nobody: Access = () => false
export const anyone: Access = () => true

/** Người dùng nội bộ thấy tất cả; khách chỉ thấy bản đã xuất bản. */
export const publishedOrInternal: Access = ({ req }) => {
  if (isInternal(req)) return true
  return { _status: { equals: 'published' } }
}

/** Vai trò được xuất bản nội dung thường; nội dung cần Pháp chế có danh sách riêng (hooks/legalGate). */
export const PUBLISH_ROLES: Role[] = ['marketing', 'legal', 'director']
export const LEGAL_APPROVER_ROLES: Role[] = ['legal', 'director']
