import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { nobody, roles } from '../access'
import { submitDataRequestEndpoint } from '../endpoints/submitDataRequest'
import { auditAfterChange, writeAudit } from '../hooks/audit'
import { DATA_REQUEST_KINDS, options } from '../lib/constants'

/** Bằng chứng đồng ý — không sửa được sau khi tạo (chỉ hệ thống ẩn danh hoá khi xoá dữ liệu). */
export const Consents: CollectionConfig = {
  slug: 'consents',
  labels: { singular: { vi: 'Đồng ý xử lý dữ liệu', en: 'Consent' }, plural: { vi: 'Đồng ý xử lý dữ liệu', en: 'Consents' } },
  admin: { group: { vi: 'Dữ liệu cá nhân', en: 'Personal data' }, defaultColumns: ['policyVersion', 'locale', 'grantedAt', 'anonymized'] },
  access: {
    read: roles('legal', 'director'),
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  fields: [
    { name: 'policyVersion', type: 'text', required: true, label: { vi: 'Phiên bản chính sách', en: 'Policy version' } },
    { name: 'textShown', type: 'textarea', required: true, label: { vi: 'Câu đồng ý đã hiển thị', en: 'Text shown' } },
    { name: 'locale', type: 'text' },
    { name: 'grantedAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'ipHash', type: 'text', label: { vi: 'IP đã băm', en: 'Hashed IP' } },
    { name: 'userAgent', type: 'text' },
    { name: 'sourcePath', type: 'text' },
    { name: 'withdrawnAt', type: 'date' },
    { name: 'anonymized', type: 'checkbox', defaultValue: false },
  ],
}

/**
 * BR-10: yêu cầu xoá đã được Pháp chế xác nhận (trạng thái "Đã thực hiện") thì xoá hẳn lead khớp,
 * xoá hoạt động của lead, ẩn danh hoá bằng chứng đồng ý, ghi một dòng nhật ký.
 * Rút đồng ý: đánh dấu withdrawnAt trên bằng chứng đồng ý.
 */
export const executeDataRequest: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc.status !== 'executed' || previousDoc?.status === 'executed') return doc
  const leadIds = ((doc.matchedLeads as unknown[]) ?? []).map((l) => (typeof l === 'object' && l ? (l as { id: number }).id : l)) as (string | number)[]
  if (!leadIds.length) return doc

  const leads = await req.payload.find({
    collection: 'leads',
    where: { id: { in: leadIds } },
    overrideAccess: true,
    depth: 0,
    limit: leadIds.length,
    trash: true,
    req,
  })
  const consentIds = leads.docs.map((l) => (typeof l.consent === 'object' ? l.consent?.id : l.consent)).filter(Boolean) as number[]

  if (doc.kind === 'erase') {
    if (consentIds.length) {
      await req.payload.update({
        collection: 'consents',
        where: { id: { in: consentIds } },
        overrideAccess: true,
        req,
        data: { anonymized: true, ipHash: null, userAgent: null, sourcePath: null },
      })
    }
    await req.payload.delete({ collection: 'lead-activities', where: { lead: { in: leadIds } }, overrideAccess: true, req })
    await req.payload.delete({ collection: 'leads', where: { id: { in: leadIds } }, overrideAccess: true, trash: true, req })
    await writeAudit(req, {
      action: 'erase',
      collectionSlug: 'leads',
      docId: doc.refCode,
      changes: { erasedLeads: leadIds.length, consentsAnonymized: consentIds.length },
      note: `Thực hiện yêu cầu ${doc.refCode}`,
    })
  }

  if (doc.kind === 'withdraw' && consentIds.length) {
    await req.payload.update({
      collection: 'consents',
      where: { id: { in: consentIds } },
      overrideAccess: true,
      req,
      data: { withdrawnAt: new Date().toISOString() },
    })
    await writeAudit(req, { action: 'consent_withdrawn', collectionSlug: 'consents', docId: doc.refCode, changes: { consents: consentIds.length } })
  }
  return doc
}

export const DataRequests: CollectionConfig = {
  slug: 'data-requests',
  labels: {
    singular: { vi: 'Yêu cầu về dữ liệu cá nhân', en: 'Data subject request' },
    plural: { vi: 'Yêu cầu về dữ liệu cá nhân', en: 'Data subject requests' },
  },
  admin: {
    useAsTitle: 'refCode',
    group: { vi: 'Dữ liệu cá nhân', en: 'Personal data' },
    defaultColumns: ['refCode', 'kind', 'status', 'dueAt', 'createdAt'],
  },
  defaultSort: '-createdAt',
  access: {
    read: roles('legal', 'director'),
    create: nobody, // chỉ qua form công khai
    update: roles('legal', 'director'),
    delete: roles('director'),
  },
  endpoints: [submitDataRequestEndpoint],
  hooks: {
    afterChange: [auditAfterChange('data-requests', { redact: ['contact', 'contactName', 'detail'] }), executeDataRequest],
  },
  fields: [
    { name: 'refCode', type: 'text', unique: true, admin: { readOnly: true } },
    { name: 'kind', type: 'select', required: true, options: options(DATA_REQUEST_KINDS), label: { vi: 'Loại yêu cầu', en: 'Kind' } },
    { name: 'contactName', type: 'text', required: true, label: { vi: 'Họ tên người yêu cầu', en: 'Requester' } },
    { name: 'contact', type: 'text', required: true, label: { vi: 'Số điện thoại hoặc email đã dùng', en: 'Phone or email used' } },
    { name: 'detail', type: 'textarea', label: { vi: 'Nội dung', en: 'Details' } },
    { name: 'locale', type: 'text' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'received',
      label: { vi: 'Trạng thái', en: 'Status' },
      options: [
        { value: 'received', label: { vi: 'Đã nhận', en: 'Received' } },
        { value: 'verifying', label: { vi: 'Đang xác minh danh tính', en: 'Verifying identity' } },
        { value: 'in_progress', label: { vi: 'Đang xử lý', en: 'In progress' } },
        { value: 'executed', label: { vi: 'Đã thực hiện', en: 'Executed' } },
        { value: 'rejected', label: { vi: 'Từ chối (ghi lý do)', en: 'Rejected' } },
        { value: 'closed', label: { vi: 'Đã đóng', en: 'Closed' } },
      ],
      admin: {
        position: 'sidebar',
        description: {
          vi: 'Chọn "Đã thực hiện" với yêu cầu xoá sẽ xoá hẳn các lead đã chọn. Không hoàn tác được.',
          en: '"Executed" on an erase request permanently deletes the selected leads.',
        },
      },
    },
    {
      name: 'dueAt',
      type: 'date',
      label: { vi: 'Hạn xử lý', en: 'Due' },
      admin: { position: 'sidebar', description: { vi: 'Mặc định 15 ngày [ĐX]; Pháp chế chốt theo WB02.', en: 'Default 15 days (proposed).' } },
    },
    {
      name: 'matchedLeads',
      type: 'relationship',
      relationTo: 'leads',
      hasMany: true,
      label: { vi: 'Lead khớp (Pháp chế chọn sau khi xác minh)', en: 'Matched leads' },
    },
    { name: 'resolution', type: 'textarea', label: { vi: 'Kết quả, nội dung đã trả lời', en: 'Resolution' } },
  ],
}
