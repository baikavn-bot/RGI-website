/**
 * BR-06: trang sản phẩm, trang pháp lý chỉ xuất bản khi Pháp chế đã duyệt đúng phiên bản đó.
 * Ai sửa nội dung sau khi duyệt (trừ Pháp chế, Giám đốc) thì trạng thái duyệt quay về "chờ duyệt".
 */
import { APIError, type CollectionBeforeChangeHook, type Field } from 'payload'

import { hasRole, internalField, LEGAL_APPROVER_ROLES, PUBLISH_ROLES } from '../access'

export const legalReviewField: Field = {
  name: 'legalReview',
  label: { vi: 'Pháp chế duyệt', en: 'Legal review' },
  type: 'group',
  access: { read: internalField },
  admin: {
    position: 'sidebar',
    description: {
      vi: 'Chỉ Pháp chế, Giám đốc đổi được. Vai trò khác sửa nội dung thì trạng thái tự về "Chờ duyệt".',
      en: 'Only Legal or Director can change this. Other edits reset it to "Awaiting legal review".',
    },
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      label: { vi: 'Trạng thái', en: 'Status' },
      options: [
        { value: 'pending', label: { vi: 'Chờ Pháp chế duyệt', en: 'Awaiting legal review' } },
        { value: 'approved', label: { vi: 'Đã duyệt', en: 'Approved' } },
        { value: 'rejected', label: { vi: 'Trả lại', en: 'Returned' } },
      ],
    },
    { name: 'note', type: 'textarea', label: { vi: 'Ghi chú, lý do trả lại', en: 'Note / reason' } },
    { name: 'reviewedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'reviewedAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
  ],
}

const CONTENT_IGNORED = new Set(['legalReview', '_status', 'updatedAt', 'createdAt', 'id'])

const contentChanged = (data: Record<string, unknown>, original?: Record<string, unknown>) => {
  if (!original) return true
  for (const key of Object.keys(data)) {
    if (CONTENT_IGNORED.has(key)) continue
    if (JSON.stringify(data[key]) !== JSON.stringify(original[key])) return true
  }
  return false
}

type GateOptions = {
  /** Có bắt buộc Pháp chế duyệt với tài liệu này không (mặc định: có). */
  requiresLegal?: (data: Record<string, unknown>) => boolean
}

export const legalGate =
  (opts: GateOptions = {}): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    if (req.context?.skipLegalGate) return data
    const requiresLegal = opts.requiresLegal ? opts.requiresLegal({ ...originalDoc, ...data }) : true
    const isApprover = hasRole(req, ...LEGAL_APPROVER_ROLES)
    const publishing = data._status === 'published'
    // Quyền đổi trạng thái duyệt kiểm ở đây (không dùng field access) để luôn chạy sau mọi bước khác.
    const review: Record<string, unknown> = {
      status: 'pending',
      ...(originalDoc?.legalReview ?? {}),
      ...(isApprover || !req.user ? (data.legalReview ?? {}) : {}),
    }

    if (!req.user) {
      // Thao tác hệ thống (seed, job) phải tự đặt overrideAccess và trạng thái duyệt.
      data.legalReview = review
      return data
    }

    if (!isApprover && requiresLegal && contentChanged(data, originalDoc)) {
      review.status = 'pending'
      review.reviewedBy = null
      review.reviewedAt = null
    }

    if (isApprover && review.status !== originalDoc?.legalReview?.status) {
      review.reviewedBy = req.user.id
      review.reviewedAt = new Date().toISOString()
    }

    if (publishing) {
      const allowed = requiresLegal ? LEGAL_APPROVER_ROLES : PUBLISH_ROLES
      if (!hasRole(req, ...allowed)) {
        throw new APIError(
          requiresLegal
            ? 'Chỉ Pháp chế hoặc Giám đốc được xuất bản nội dung này. Lưu nháp và gửi duyệt.'
            : 'Vai trò của bạn chỉ được lưu nháp.',
          403,
          { code: 'publish_forbidden' },
          true,
        )
      }
      if (requiresLegal && review.status !== 'approved') {
        throw new APIError('Chờ Pháp chế duyệt trước khi xuất bản.', 422, { code: 'legal_review_required' }, true)
      }
    }

    data.legalReview = review
    return data
  }
