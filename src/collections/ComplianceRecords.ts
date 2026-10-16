import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
} from 'payload'

import { fieldRoles, hasRole, isInternal, roles } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { revalidateAfterChange } from '../hooks/revalidate'

const approve: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const merged = { ...originalDoc, ...data }
  if (merged.type === 'cr_declaration' && merged.status === 'approved') {
    const missing = ['certNo', 'certBody', 'registrationNo', 'issuedOn', 'expiresOn'].filter((k) => !merged[k])
    if (missing.length) {
      throw new APIError(
        'Hồ sơ hợp quy cần đủ số giấy chứng nhận, tổ chức chứng nhận, số đăng ký công bố, ngày cấp, ngày hết hạn.',
        422,
        { code: 'compliance_incomplete', fields: missing },
        true,
      )
    }
    if (new Date(merged.expiresOn) <= new Date(merged.issuedOn)) {
      throw new APIError('Ngày hết hạn phải sau ngày cấp.', 422, { code: 'compliance_dates' }, true)
    }
  }
  // Sửa nội dung một hồ sơ đã duyệt (không phải Giám đốc) thì hồ sơ quay về nháp, chờ duyệt lại.
  const KEY_FIELDS = ['product', 'type', 'regulation', 'standard', 'certNo', 'certBody', 'registrationNo', 'issuedOn', 'expiresOn', 'scan']
  const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: unknown }).id : v)
  if (
    originalDoc?.status === 'approved' &&
    req.user &&
    !hasRole(req, 'director') &&
    KEY_FIELDS.some((k) => k in data && JSON.stringify(idOf(data[k])) !== JSON.stringify(idOf(originalDoc[k])))
  ) {
    data.status = 'draft'
    data.approvedBy = null
    data.approvedAt = null
  }
  if (data.status === 'approved' && originalDoc?.status !== 'approved' && req.user && hasRole(req, 'director')) {
    data.approvedBy = req.user.id
    data.approvedAt = new Date().toISOString()
  }
  return data
}

/** Hồ sơ không còn hiệu lực thì ống uPVC đang bán phải về "Sắp ra mắt" (BR-05). */
export const demoteIfInvalid: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const pid = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number | undefined))
  const { demoteProductIfNoValidRecord } = await import('../jobs/complianceExpiry')
  const wasApproved = previousDoc?.status === 'approved'
  const stillValid = doc.status === 'approved' && (!doc.expiresOn || new Date(doc.expiresOn) > new Date())
  // Hồ sơ chuyển sang sản phẩm khác: sản phẩm cũ phải được kiểm lại.
  const prevProduct = pid(previousDoc?.product)
  if (wasApproved && prevProduct && prevProduct !== pid(doc.product)) {
    await demoteProductIfNoValidRecord(req, prevProduct, 'Hồ sơ hợp quy chuyển sang sản phẩm khác')
  }
  if (!wasApproved || stillValid) return doc
  const productId = pid(doc.product)
  if (productId) await demoteProductIfNoValidRecord(req, productId, 'Hồ sơ hợp quy không còn hiệu lực')
  return doc
}

/** Xoá hồ sơ hợp quy: sản phẩm đang bán mà không còn hồ sơ hợp lệ thì về "Sắp ra mắt". */
const demoteAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const productId = doc.product && typeof doc.product === 'object' ? doc.product.id : doc.product
  if (!productId) return doc
  const { demoteProductIfNoValidRecord } = await import('../jobs/complianceExpiry')
  await demoteProductIfNoValidRecord(req, productId, 'Hồ sơ hợp quy bị xoá')
  return doc
}

export const ComplianceRecords: CollectionConfig = {
  // Khách đọc được nội dung công khai: không bọc quyền đọc bằng TOTP (quyền gốc vẫn lọc bản nháp, số liệu chưa xác nhận).
  custom: { totp: { disableAccessWrapper: { read: true } } },
  slug: 'compliance-records',
  labels: {
    singular: { vi: 'Hồ sơ hợp quy', en: 'Conformity record' },
    plural: { vi: 'Hồ sơ hợp quy', en: 'Conformity records' },
  },
  admin: {
    useAsTitle: 'registrationNo',
    group: { vi: 'Sản phẩm', en: 'Products' },
    defaultColumns: ['product', 'type', 'registrationNo', 'expiresOn', 'status'],
  },
  access: {
    read: ({ req }) => (isInternal(req) ? true : { status: { equals: 'approved' } }),
    create: roles('legal', 'director'),
    update: roles('legal', 'director'),
    delete: roles('director'),
  },
  hooks: {
    beforeChange: [approve],
    afterChange: [auditAfterChange('compliance-records'), demoteIfInvalid, revalidateAfterChange],
    afterDelete: [auditAfterDelete('compliance-records'), demoteAfterDelete],
  },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true, label: { vi: 'Sản phẩm', en: 'Product' } },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'cr_declaration',
      label: { vi: 'Loại', en: 'Type' },
      options: [
        { value: 'cr_declaration', label: { vi: 'Công bố hợp quy (dấu CR)', en: 'Conformity declaration (CR mark)' } },
        { value: 'standard_declaration', label: { vi: 'Công bố tiêu chuẩn áp dụng', en: 'Applied standard declaration' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'regulation', type: 'text', label: { vi: 'Quy chuẩn', en: 'Regulation' }, defaultValue: 'QCVN 16:2023/BXD' },
        { name: 'standard', type: 'text', label: { vi: 'Tiêu chuẩn', en: 'Standard' }, defaultValue: 'TCCS 01:2026/RGI' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'certNo', type: 'text', label: { vi: 'Số giấy chứng nhận', en: 'Certificate no.' } },
        { name: 'certBody', type: 'text', label: { vi: 'Tổ chức chứng nhận', en: 'Certification body' } },
        { name: 'registrationNo', type: 'text', label: { vi: 'Số đăng ký công bố', en: 'Registration no.' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'issuedOn', type: 'date', label: { vi: 'Ngày cấp', en: 'Issued on' } },
        { name: 'expiresOn', type: 'date', index: true, label: { vi: 'Ngày hết hạn', en: 'Expires on' } },
      ],
    },
    {
      name: 'scan',
      type: 'relationship',
      relationTo: 'documents',
      label: { vi: 'Bản quét', en: 'Scan' },
      admin: { description: { vi: 'Đặt tài liệu ở chế độ Công khai nếu muốn khách mở được.', en: 'Set the document to Public to show it.' } },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: { vi: 'Trạng thái', en: 'Status' },
      options: [
        { value: 'draft', label: { vi: 'Nháp, chờ Giám đốc duyệt', en: 'Draft, awaiting Director' } },
        { value: 'approved', label: { vi: 'Đã duyệt', en: 'Approved' } },
        { value: 'expired', label: { vi: 'Hết hiệu lực', en: 'Expired' } },
      ],
      access: { create: fieldRoles('director'), update: fieldRoles('director') },
      admin: { position: 'sidebar', description: { vi: 'Pháp chế nhập, Giám đốc duyệt (luồng F5).', en: 'Legal enters, Director approves (flow F5).' } },
    },
    { name: 'approvedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'approvedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'internalNote', type: 'textarea', label: { vi: 'Ghi chú nội bộ', en: 'Internal note' }, access: { read: ({ req }) => isInternal(req) } },
  ],
}
