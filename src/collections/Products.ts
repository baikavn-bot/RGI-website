import { APIError, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'

import { fieldRoles, internalField, publishedOrInternal, roles } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { legalGate, legalReviewField } from '../hooks/legalGate'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'
import { CLAIM_LEVELS, options, PIPE_LINE_CODE, SALE_STATUSES, SPEC_TEMPLATES } from '../lib/constants'

const idOf = (v: unknown): string | number | null => {
  if (v == null) return null
  if (typeof v === 'object' && 'id' in (v as Record<string, unknown>)) return (v as { id: string | number }).id
  return v as string | number
}

/**
 * BR-01, BR-02, BR-03 và kiểm quyền ảnh khi xuất bản.
 */
export const productRules: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const merged = { ...originalDoc, ...data }
  const lineId = idOf(merged.line)
  const line = lineId
    ? await req.payload.findByID({ collection: 'product-lines', id: lineId, depth: 0, overrideAccess: true, req })
    : null
  const isPipe = line?.code === PIPE_LINE_CODE

  // BR-02: ống uPVC không mang nhãn tái chế (TCVN 8491-1 mục 4.3).
  if (isPipe && merged.claimLevel && merged.claimLevel !== 'none') {
    throw new APIError(
      'Ống uPVC không được gắn nhãn tái chế.',
      422,
      { code: 'claim_not_allowed_for_pipe', field: 'claimLevel' },
      true,
    )
  }

  // BR-03: từ cấp 2 trở lên phải có bằng chứng và câu mô tả.
  if (merged.claimLevel === 'level2_product' || merged.claimLevel === 'level3_certified') {
    const evidence = (merged.claimEvidence as unknown[] | undefined)?.filter(Boolean) ?? []
    if (!evidence.length) {
      throw new APIError(
        'Nhãn tái chế cấp 2, cấp 3 cần tài liệu bằng chứng (phiếu cân đối nguyên liệu, GRS hoặc RCS).',
        422,
        { code: 'claim_evidence_required', field: 'claimEvidence' },
        true,
      )
    }
    if (!merged.claimStatement) {
      throw new APIError('Cần câu mô tả tỉ lệ tái chế và phương pháp tính.', 422, { code: 'claim_statement_required' }, true)
    }
  }

  // BR-01: ống uPVC chỉ "Đang bán" khi có hồ sơ công bố hợp quy đã duyệt, còn hạn.
  if (isPipe && merged.saleStatus === 'on_sale') {
    const productId = originalDoc?.id
    const today = new Date().toISOString()
    const records = productId
      ? await req.payload.find({
          collection: 'compliance-records',
          overrideAccess: true,
          depth: 0,
          limit: 1,
          req,
          where: {
            and: [
              { product: { equals: productId } },
              { type: { equals: 'cr_declaration' } },
              { status: { equals: 'approved' } },
              { expiresOn: { greater_than: today } },
            ],
          },
        })
      : { docs: [] }
    if (!records.docs.length) {
      throw new APIError(
        'Chưa có hồ sơ công bố hợp quy đã duyệt, còn hạn. Ống uPVC chưa được chuyển sang "Đang bán".',
        422,
        { code: 'compliance_required', field: 'saleStatus' },
        true,
      )
    }
  }

  // Khi xuất bản: mọi ảnh phải đã xác nhận quyền dùng.
  if (data._status === 'published') {
    const ids = [...((merged.images as unknown[]) ?? []), merged.cover].map(idOf).filter(Boolean) as (string | number)[]
    if (ids.length) {
      const media = await req.payload.find({
        collection: 'media',
        overrideAccess: true,
        depth: 0,
        req,
        limit: ids.length,
        where: { and: [{ id: { in: ids } }, { rightsCleared: { not_equals: true } }] },
      })
      if (media.docs.length) {
        throw new APIError(
          'Có ảnh chưa xác nhận quyền dùng. Kiểm tra nguồn ảnh trước khi xuất bản.',
          422,
          { code: 'media_rights_required' },
          true,
        )
      }
    }
  }

  return data
}

export const Products: CollectionConfig = {
  // Khách đọc được nội dung công khai: không bọc quyền đọc bằng TOTP (quyền gốc vẫn lọc bản nháp, số liệu chưa xác nhận).
  custom: { totp: { disableAccessWrapper: { read: true } } },
  slug: 'products',
  labels: { singular: { vi: 'Sản phẩm', en: 'Product' }, plural: { vi: 'Sản phẩm', en: 'Products' } },
  admin: {
    useAsTitle: 'name',
    group: { vi: 'Sản phẩm', en: 'Products' },
    defaultColumns: ['code', 'name', 'line', 'saleStatus', '_status', 'updatedAt'],
    listSearchableFields: ['code', 'name'],
  },
  versions: { drafts: true, maxPerDoc: 50 },
  defaultSort: 'order',
  access: {
    read: publishedOrInternal,
    create: roles('director', 'marketing', 'editor', 'legal'),
    update: roles('director', 'marketing', 'editor', 'legal'),
    delete: roles('director'),
  },
  hooks: {
    beforeChange: [productRules, legalGate()],
    afterChange: [auditAfterChange('products'), revalidateAfterChange],
    afterDelete: [auditAfterDelete('products'), revalidateAfterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'code', type: 'text', required: true, unique: true, index: true, label: { vi: 'Mã', en: 'Code' } },
        { name: 'line', type: 'relationship', relationTo: 'product-lines', required: true, label: { vi: 'Dòng', en: 'Line' } },
        { name: 'order', type: 'number', defaultValue: 0, label: { vi: 'Thứ tự', en: 'Order' } },
      ],
    },
    { name: 'name', type: 'text', required: true, localized: true, label: { vi: 'Tên sản phẩm', en: 'Name' } },
    {
      type: 'row',
      fields: [
        {
          name: 'groupLabel',
          type: 'text',
          localized: true,
          label: { vi: 'Nhóm trong dòng', en: 'Group within line' },
          admin: { width: '50%', description: { vi: 'Ví dụ: Dẫn nước, Trong suốt. Trang dòng gom sản phẩm theo nhóm này.', en: 'e.g. Water, Clear. The line page groups products by this.' } },
        },
        {
          name: 'specTemplate',
          type: 'select',
          options: options(SPEC_TEMPLATES),
          label: { vi: 'Kiểu bảng quy cách', en: 'Spec table type' },
          admin: { width: '50%', description: { vi: 'Để trống: chọn theo dòng sản phẩm.', en: 'Empty: chosen by product line.' } },
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      localized: true,
      index: true,
      label: { vi: 'Đường dẫn', en: 'Slug' },
      validate: (v: unknown) => (typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)) || 'Chữ thường không dấu, nối bằng gạch',
    },
    { name: 'summary', type: 'textarea', localized: true, label: { vi: 'Mô tả ngắn', en: 'Summary' } },
    {
      name: 'uses',
      type: 'text',
      hasMany: true,
      localized: true,
      label: { vi: 'Công dụng (đã RGI xác nhận)', en: 'Uses (confirmed by RGI)' },
    },
    { name: 'body', type: 'richText', localized: true, label: { vi: 'Nội dung chi tiết', en: 'Details' } },
    {
      name: 'standardText',
      type: 'text',
      localized: true,
      label: { vi: 'Tiêu chuẩn áp dụng', en: 'Applied standard' },
      admin: { description: { vi: 'Ví dụ: TCCS 01:2026/RGI', en: 'e.g. TCCS 01:2026/RGI' } },
    },
    {
      name: 'manufacturerText',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Nhà máy REN Group tại Tangerang, Indonesia',
      label: { vi: 'Nơi sản xuất (hiển thị)', en: 'Made at (public)' },
      access: { update: fieldRoles('legal', 'director') },
      admin: {
        description: {
          vi: 'Không ghi PT Dunia Plast Indonesia là nhà sản xuất khi nhà máy chưa xác nhận. Chỉ Pháp chế, Giám đốc sửa.',
          en: 'Do not name PT Dunia Plast Indonesia as manufacturer until confirmed. Legal/Director only.',
        },
      },
    },
    { name: 'cover', type: 'upload', relationTo: 'media', label: { vi: 'Ảnh chính', en: 'Main image' } },
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, label: { vi: 'Thư viện ảnh', en: 'Gallery' } },
    {
      name: 'documents',
      type: 'relationship',
      relationTo: 'documents',
      hasMany: true,
      label: { vi: 'Tài liệu kèm theo', en: 'Documents' },
    },
    {
      name: 'saleStatus',
      type: 'select',
      required: true,
      defaultValue: 'coming_soon',
      options: options(SALE_STATUSES),
      label: { vi: 'Trạng thái bán', en: 'Sale status' },
      access: { create: fieldRoles('director'), update: fieldRoles('director') },
      admin: {
        position: 'sidebar',
        description: {
          vi: 'Chỉ Giám đốc đổi. Ống uPVC cần hồ sơ hợp quy đã duyệt (BR-01).',
          en: 'Director only. uPVC pipes need an approved conformity record (BR-01).',
        },
      },
    },
    {
      name: 'claimLevel',
      type: 'select',
      required: true,
      defaultValue: 'none',
      options: options(CLAIM_LEVELS),
      label: { vi: 'Cấp nhãn tái chế', en: 'Recycled claim level' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'claimStatement',
      type: 'text',
      localized: true,
      label: { vi: 'Câu mô tả tái chế (cấp 2, 3)', en: 'Claim statement (level 2, 3)' },
      admin: {
        condition: (_, s) => s?.claimLevel === 'level2_product' || s?.claimLevel === 'level3_certified',
        position: 'sidebar',
      },
    },
    {
      name: 'claimEvidence',
      type: 'relationship',
      relationTo: 'documents',
      hasMany: true,
      label: { vi: 'Bằng chứng tái chế', en: 'Claim evidence' },
      access: { read: internalField },
      admin: {
        condition: (_, s) => s?.claimLevel === 'level2_product' || s?.claimLevel === 'level3_certified',
        position: 'sidebar',
      },
    },
    {
      name: 'hsCode',
      type: 'text',
      label: { vi: 'Mã HS (nội bộ)', en: 'HS code (internal)' },
      access: { read: internalField },
      validate: (v: unknown) => !v || (typeof v === 'string' && /^\d{4}(\.?\d{2}){0,2}$/.test(v)) || 'Dạng 3917.23.00',
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text', localized: true, maxLength: 60, label: { vi: 'Tiêu đề (≤ 60 ký tự)', en: 'Title (≤ 60)' } },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          maxLength: 155,
          label: { vi: 'Mô tả (≤ 155 ký tự)', en: 'Description (≤ 155)' },
        },
      ],
    },
    legalReviewField,
  ],
}
