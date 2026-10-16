import { APIError, type CollectionConfig } from 'payload'

import { hasRole, roles } from '../access'

/** Ghi chú, cuộc gọi, gửi mẫu… Chỉ ghi thêm; sửa, xoá chỉ Giám đốc. */
export const LeadActivities: CollectionConfig = {
  slug: 'lead-activities',
  labels: { singular: { vi: 'Hoạt động lead', en: 'Lead activity' }, plural: { vi: 'Hoạt động lead', en: 'Lead activities' } },
  admin: {
    group: { vi: 'Bán hàng', en: 'Sales' },
    defaultColumns: ['lead', 'kind', 'note', 'by', 'createdAt'],
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => {
      if (hasRole(req, 'director', 'marketing')) return true
      if (hasRole(req, 'sales') && req.user)
        return { or: [{ 'lead.owner': { equals: req.user.id } }, { 'lead.owner': { exists: false } }] }
      return false
    },
    create: roles('director', 'marketing', 'sales'),
    update: roles('director'),
    delete: roles('director'),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !req.user) return data
        data.by = req.user.id
        if (hasRole(req, 'sales')) {
          // Sales chỉ ghi vào lead của mình.
          const leadId = typeof data.lead === 'object' ? data.lead?.id : data.lead
          const lead = await req.payload.findByID({ collection: 'leads', id: leadId, depth: 0, overrideAccess: true, req })
          const owner = typeof lead.owner === 'object' ? lead.owner?.id : lead.owner
          if (owner !== req.user.id) throw new APIError('Lead này không giao cho bạn.', 403, { code: 'not_owner' }, true)
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true, index: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'note',
      options: [
        { value: 'note', label: { vi: 'Ghi chú', en: 'Note' } },
        { value: 'call', label: { vi: 'Cuộc gọi', en: 'Call' } },
        { value: 'email', label: 'Email' },
        { value: 'sample_sent', label: { vi: 'Đã gửi mẫu (ghi mã vận đơn)', en: 'Sample shipped' } },
        { value: 'form_resubmit', label: { vi: 'Khách gửi form lần nữa', en: 'Form resubmitted' } },
        { value: 'status_change', label: { vi: 'Đổi trạng thái', en: 'Status change' } },
      ],
    },
    { name: 'note', type: 'textarea' },
    { name: 'by', type: 'relationship', relationTo: 'users', admin: { readOnly: true }, access: { update: () => false } },
    {
      name: 'consent',
      type: 'relationship',
      relationTo: 'consents',
      label: { vi: 'Bằng chứng đồng ý của lần gửi này', en: 'Consent for this submission' },
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
    },
  ],
}
