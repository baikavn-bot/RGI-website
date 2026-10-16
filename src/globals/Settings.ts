import type { GlobalConfig } from 'payload'

import { anyone, internalField, roles } from '../access'
import { auditGlobal } from '../hooks/audit'
import { revalidateGlobal } from '../hooks/revalidate'

/** Thông tin doanh nghiệp, kênh liên hệ, bật tắt form, câu đồng ý. */
export const Settings: GlobalConfig = {
  custom: { totp: { disableAccessWrapper: { read: true } } },
  slug: 'settings',
  label: { vi: 'Cài đặt website', en: 'Site settings' },
  admin: { group: { vi: 'Hệ thống', en: 'System' } },
  access: {
    read: anyone,
    update: roles('tech', 'marketing', 'director'),
  },
  hooks: { afterChange: [auditGlobal('settings'), revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { vi: 'Doanh nghiệp', en: 'Company' },
          fields: [
            { name: 'companyName', type: 'text', required: true, localized: true, label: { vi: 'Tên doanh nghiệp đầy đủ', en: 'Legal name' } },
            { name: 'taxCode', type: 'text', required: true, label: { vi: 'Mã số doanh nghiệp', en: 'Enterprise code' } },
            { name: 'address', type: 'text', required: true, localized: true, label: { vi: 'Địa chỉ trụ sở', en: 'Registered address' } },
            { name: 'representative', type: 'text', label: { vi: 'Người đại diện (họ tên — chức danh)', en: 'Legal representative' } },
          ],
        },
        {
          label: { vi: 'Liên hệ', en: 'Contact' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'hotline', type: 'text', required: true, label: 'Hotline' },
                { name: 'email', type: 'email', required: true, label: 'Email' },
              ],
            },
            {
              name: 'zaloUrl',
              type: 'text',
              label: { vi: 'Liên kết Zalo', en: 'Zalo link' },
              admin: { description: { vi: '[CẦN XÁC NHẬN] Zalo doanh nghiệp hay Zalo cá nhân.', en: 'To confirm: business or personal Zalo.' } },
            },
            {
              name: 'responseTime',
              type: 'text',
              localized: true,
              label: { vi: 'Thời gian phản hồi hiển thị cho khách', en: 'Response time shown' },
              admin: { description: { vi: '[CẦN XÁC NHẬN] mục 25 blueprint, câu hỏi 8.', en: 'To confirm.' } },
            },
            {
              name: 'leadNotifyEmails',
              type: 'text',
              hasMany: true,
              label: { vi: 'Email nhận thông báo lead', en: 'Lead notification emails' },
              access: { read: internalField },
            },
            {
              name: 'directorEmail',
              type: 'email',
              label: { vi: 'Email Giám đốc (nhận cảnh báo lead quá 3 ngày)', en: 'Director email (escalations)' },
              access: { read: internalField },
            },
          ],
        },
        {
          label: { vi: 'Form', en: 'Forms' },
          fields: [
            {
              name: 'forms',
              type: 'group',
              label: { vi: 'Bật / tắt từng form', en: 'Enable forms' },
              fields: [
                { name: 'distributor', type: 'checkbox', defaultValue: true, label: { vi: 'Nhà phân phối', en: 'Distributor' } },
                { name: 'retailer', type: 'checkbox', defaultValue: true, label: { vi: 'Cửa hàng', en: 'Retail store' } },
                { name: 'contractor', type: 'checkbox', defaultValue: true, label: { vi: 'Đơn vị thi công', en: 'Contractor' } },
                { name: 'sample', type: 'checkbox', defaultValue: true, label: { vi: 'Bộ mẫu', en: 'Samples' } },
                { name: 'contact', type: 'checkbox', defaultValue: true, label: { vi: 'Liên hệ', en: 'Contact' } },
              ],
            },
            {
              name: 'consent',
              type: 'group',
              label: { vi: 'Câu đồng ý xử lý dữ liệu (theo WB02)', en: 'Consent text (per WB02)' },
              fields: [
                { name: 'policyVersion', type: 'text', required: true, defaultValue: 'WB02-v1', label: { vi: 'Phiên bản WB02', en: 'Policy version' } },
                { name: 'text', type: 'textarea', required: true, localized: true, label: { vi: 'Câu đồng ý', en: 'Consent sentence' } },
              ],
            },
          ],
        },
      ],
    },
  ],
}
