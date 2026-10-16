import { APIError, type CollectionBeforeChangeHook, type CollectionConfig, type Where } from 'payload'

import { fieldRoles, hasRole, roles } from '../access'
import { exportLeadsEndpoint } from '../endpoints/leadsExport'
import { submitLeadEndpoint } from '../endpoints/submitLead'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import {
  LEAD_STATUSES,
  LEAD_TRANSITIONS,
  LEAD_TYPES,
  type LeadStatus,
  LOST_REASONS,
  options,
  SAMPLE_KITS,
  VOLUME_BANDS,
} from '../lib/constants'
import { businessDaysSince } from '../lib/security'

/** Lead đổi trạng thái phải đi đúng vòng đời (mục 5.3); sai trả 409. */
const statusTransition: CollectionBeforeChangeHook = ({ data, originalDoc, operation, req }) => {
  if (operation !== 'update' || !data.status || !originalDoc || data.status === originalDoc.status) return data
  if (req.context?.skipTransition) return data
  const from = originalDoc.status as LeadStatus
  const to = data.status as LeadStatus
  if (!LEAD_TRANSITIONS[from]?.includes(to)) {
    throw new APIError(`Không chuyển được từ "${from}" sang "${to}".`, 409, { code: 'invalid_transition', from, to }, true)
  }
  if (to === 'lost' && !(data.lostReason ?? originalDoc.lostReason)) {
    throw new APIError('Chọn lý do không thành.', 422, { code: 'lost_reason_required', field: 'lostReason' }, true)
  }
  if (!originalDoc.firstContactAt && from === 'new') data.firstContactAt = new Date().toISOString()
  return data
}

/** Sales chỉ thấy lead của mình và lead chưa giao. */
const salesScope = (userId: string | number): Where => ({
  or: [{ owner: { equals: userId } }, { owner: { exists: false } }],
})

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: { vi: 'Lead', en: 'Lead' }, plural: { vi: 'Lead', en: 'Leads' } },
  trash: true,
  admin: {
    useAsTitle: 'refCode',
    group: { vi: 'Bán hàng', en: 'Sales' },
    defaultColumns: ['refCode', 'type', 'company', 'contactName', 'province', 'status', 'owner', 'overdue', 'createdAt'],
    listSearchableFields: ['refCode', 'contactName', 'company', 'phoneNormalized', 'email'],
    pagination: { defaultLimit: 20, limits: [20, 50, 100] },
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => {
      if (hasRole(req, 'director', 'marketing')) return true
      if (hasRole(req, 'sales') && req.user) return salesScope(req.user.id)
      return false
    },
    // Lead chỉ sinh từ form công khai (endpoint /submit dùng overrideAccess) hoặc do quản lý tạo tay.
    create: roles('director', 'marketing'),
    update: ({ req }) => {
      if (hasRole(req, 'director', 'marketing')) return true
      if (hasRole(req, 'sales') && req.user) return { owner: { equals: req.user.id } }
      return false
    },
    // Xoá mềm (thùng rác) và xoá hẳn: chỉ Giám đốc.
    delete: roles('director'),
  },
  endpoints: [submitLeadEndpoint, exportLeadsEndpoint],
  hooks: {
    beforeChange: [statusTransition],
    afterChange: [
      auditAfterChange('leads', {
        redact: ['contactName', 'phone', 'phoneNormalized', 'email', 'deliveryAddress', 'message', 'company', 'taxCode', 'position'],
      }),
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === 'update' && previousDoc?.status !== doc.status && !req.context?.skipActivity) {
          await req.payload.create({
            collection: 'lead-activities',
            overrideAccess: true,
            req,
            data: {
              lead: doc.id,
              kind: 'status_change',
              note: `${previousDoc?.status ?? '—'} → ${doc.status}`,
              by: req.user?.id,
            },
          })
        }
        return doc
      },
    ],
    afterDelete: [auditAfterDelete('leads')],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'refCode', type: 'text', unique: true, index: true, label: { vi: 'Mã yêu cầu', en: 'Reference' }, admin: { readOnly: true }, access: { create: () => false, update: () => false } },
        { name: 'type', type: 'select', required: true, options: options(LEAD_TYPES), label: { vi: 'Loại', en: 'Type' }, index: true },
        { name: 'locale', type: 'select', defaultValue: 'vi', options: ['vi', 'en'], label: { vi: 'Ngôn ngữ form', en: 'Form language' } },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { vi: 'Thông tin khách', en: 'Customer' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'contactName', type: 'text', required: true, label: { vi: 'Người liên hệ', en: 'Contact name' } },
                { name: 'position', type: 'text', label: { vi: 'Chức vụ', en: 'Position' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text', required: true, label: { vi: 'Điện thoại (khách nhập)', en: 'Phone (as entered)' } },
                {
                  name: 'phoneNormalized',
                  type: 'text',
                  index: true,
                  label: { vi: 'Điện thoại chuẩn hoá', en: 'Normalised phone' },
                  admin: { readOnly: true },
                  access: { create: () => false, update: () => false },
                },
                { name: 'email', type: 'email', label: 'Email' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'company', type: 'text', label: { vi: 'Doanh nghiệp / cửa hàng', en: 'Company / store' } },
                { name: 'taxCode', type: 'text', label: { vi: 'Mã số thuế', en: 'Tax code' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'province', type: 'text', label: { vi: 'Tỉnh, thành phố', en: 'Province' }, index: true },
                { name: 'country', type: 'text', label: { vi: 'Quốc gia', en: 'Country' } },
              ],
            },
          ],
        },
        {
          label: { vi: 'Nhu cầu', en: 'Request' },
          fields: [
            { name: 'interestLines', type: 'relationship', relationTo: 'product-lines', hasMany: true, label: { vi: 'Dòng quan tâm', en: 'Lines of interest' } },
            { name: 'interestSkus', type: 'text', hasMany: true, label: { vi: 'Mã quan tâm', en: 'SKUs of interest' } },
            {
              type: 'row',
              fields: [
                { name: 'warehouseArea', type: 'number', label: { vi: 'Diện tích kho (m²)', en: 'Warehouse (m²)' } },
                { name: 'projectName', type: 'text', label: { vi: 'Tên công trình', en: 'Project' } },
                { name: 'volumeBand', type: 'select', options: options(VOLUME_BANDS), label: { vi: 'Khối lượng dự kiến', en: 'Expected volume' } },
                { name: 'neededBy', type: 'text', label: { vi: 'Cần hàng (tháng)', en: 'Needed by (month)' } },
              ],
            },
            { name: 'kits', type: 'select', hasMany: true, options: options(SAMPLE_KITS), label: { vi: 'Bộ mẫu', en: 'Sample kits' } },
            { name: 'deliveryAddress', type: 'textarea', label: { vi: 'Địa chỉ nhận mẫu', en: 'Delivery address' } },
            { name: 'message', type: 'textarea', label: { vi: 'Nội dung khách gửi', en: 'Message' } },
          ],
        },
        {
          label: { vi: 'Nguồn', en: 'Source' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'utmSource', type: 'text' },
                { name: 'utmMedium', type: 'text' },
                { name: 'utmCampaign', type: 'text' },
              ],
            },
            { name: 'sourcePath', type: 'text', label: { vi: 'Trang gửi form', en: 'Submitted from' } },
            { name: 'referrer', type: 'text' },
            { name: 'consent', type: 'relationship', relationTo: 'consents', label: { vi: 'Bằng chứng đồng ý', en: 'Consent record' }, admin: { readOnly: true }, access: { create: () => false, update: () => false } },
            { name: 'notifiedAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } }, access: { create: () => false, update: () => false } },
            { name: 'escalatedAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } }, access: { create: () => false, update: () => false } },
          ],
        },
      ],
    },
    // Thanh bên: xử lý
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: options(LEAD_STATUSES),
      index: true,
      label: { vi: 'Trạng thái', en: 'Status' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: { vi: 'Sales phụ trách', en: 'Owner' },
      access: { update: fieldRoles('director', 'marketing'), create: fieldRoles('director', 'marketing') },
      filterOptions: { role: { equals: 'sales' } },
      admin: { position: 'sidebar' },
    },
    {
      name: 'lostReason',
      type: 'select',
      options: options(LOST_REASONS),
      label: { vi: 'Lý do không thành', en: 'Lost reason' },
      admin: { position: 'sidebar', condition: (_, s) => s?.status === 'lost' },
    },
    { name: 'firstContactAt', type: 'date', admin: { readOnly: true, position: 'sidebar' }, label: { vi: 'Liên hệ lần đầu', en: 'First contact' } },
    {
      name: 'mergedCount',
      type: 'number',
      defaultValue: 0,
      label: { vi: 'Số lần gửi trùng đã gộp', en: 'Merged resubmissions' },
      admin: { readOnly: true, position: 'sidebar' },
      access: { create: () => false, update: () => false },
    },
    {
      name: 'overdue',
      type: 'checkbox',
      virtual: true,
      label: { vi: 'Quá hạn', en: 'Overdue' },
      admin: { readOnly: true, position: 'sidebar', description: { vi: 'Lead mới quá 1 ngày làm việc chưa liên hệ.', en: 'New for over 1 business day.' } },
      hooks: {
        afterRead: [
          ({ siblingData }) =>
            siblingData?.status === 'new' && !!siblingData?.createdAt && businessDaysSince(new Date(siblingData.createdAt)) >= 1,
        ],
      },
    },
    {
      name: 'activities',
      type: 'join',
      collection: 'lead-activities',
      on: 'lead',
      label: { vi: 'Lịch sử xử lý', en: 'Activity' },
      defaultSort: '-createdAt',
    },
  ],
}
