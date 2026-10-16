/**
 * Nạp dữ liệu mẫu (gọi từ src/seed/run.ts: pnpm seed)
 * Chỉ chạy trên máy dev hoặc staging. Lệnh xoá dữ liệu cũ của các collection nội dung trước khi nạp.
 * Mật khẩu tài khoản mẫu: lấy từ SEED_PASSWORD; không có thì sinh ngẫu nhiên và ghi vào .seed-credentials (không đưa lên git).
 */
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Payload } from 'payload'

import { IMAGES, LINES, PAGES, PRODUCTS, SETTINGS, USERS } from './content'
import { rich } from './lexical'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const ctx = { disableRevalidate: true, skipAudit: true, skipLegalGate: true }

async function wipe(payload: Payload) {
  for (const slug of ['variants', 'compliance-records', 'products', 'product-lines', 'pages', 'media', 'redirects'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } }, overrideAccess: true, context: ctx })
  }
}

export async function seed(payload: Payload, opts: { users?: boolean } = { users: true }) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Không chạy seed trên production. Đặt ALLOW_SEED=true nếu thật sự cần.')
  }
  await wipe(payload)

  // Cài đặt website
  await payload.updateGlobal({
    slug: 'settings',
    locale: 'vi',
    overrideAccess: true,
    context: ctx,
    data: {
      companyName: SETTINGS.companyName.vi,
      taxCode: SETTINGS.taxCode,
      address: SETTINGS.address.vi,
      representative: SETTINGS.representative,
      hotline: SETTINGS.hotline,
      email: SETTINGS.email,
      responseTime: SETTINGS.responseTime.vi,
      leadNotifyEmails: [],
      forms: { distributor: true, retailer: true, contractor: true, sample: true, contact: true },
      consent: { policyVersion: 'WB02-v1', text: SETTINGS.consentText.vi },
    },
  })
  await payload.updateGlobal({
    slug: 'settings',
    locale: 'en',
    overrideAccess: true,
    context: ctx,
    data: {
      companyName: SETTINGS.companyName.en,
      address: SETTINGS.address.en,
      responseTime: SETTINGS.responseTime.en,
      consent: { policyVersion: 'WB02-v1', text: SETTINGS.consentText.en },
    } as never,
  })

  // Ảnh
  const media: Record<string, number> = {}
  for (const im of IMAGES) {
    const filePath = path.join(dirname, 'images', im.file)
    if (!fs.existsSync(filePath)) continue
    const doc = await payload.create({
      collection: 'media',
      locale: 'vi',
      overrideAccess: true,
      context: ctx,
      filePath,
      data: {
        alt: im.alt.vi,
        source: im.source,
        rightsNote: 'Dữ liệu mẫu — Pháp chế rà lại quyền dùng trước khi ra mắt.',
        rightsCleared: true,
      },
    })
    await payload.update({ collection: 'media', id: doc.id, locale: 'en', overrideAccess: true, context: ctx, data: { alt: im.alt.en } })
    media[im.key] = doc.id
  }

  // Dòng sản phẩm
  const lineIds: Record<string, number> = {}
  for (const l of LINES) {
    const doc = await payload.create({
      collection: 'product-lines',
      locale: 'vi',
      overrideAccess: true,
      context: ctx,
      data: {
        code: l.code,
        color: l.color,
        order: l.order,
        name: l.name.vi,
        slug: l.slug.vi,
        tagline: l.tagline.vi,
        description: l.description.vi,
        note: l.note?.vi,
        image: l.image ? media[l.image] : undefined,
      },
    })
    await payload.update({
      collection: 'product-lines',
      id: doc.id,
      locale: 'en',
      overrideAccess: true,
      context: ctx,
      data: { name: l.name.en, slug: l.slug.en, tagline: l.tagline.en, description: l.description.en, note: l.note?.en },
    })
    lineIds[l.code] = doc.id
  }

  // Sản phẩm và quy cách
  const approved = { status: 'approved' as const, note: 'Dữ liệu mẫu — Pháp chế duyệt lại trước khi ra mắt.' }
  for (const p of PRODUCTS) {
    const doc = await payload.create({
      collection: 'products',
      locale: 'vi',
      overrideAccess: true,
      context: ctx,
      draft: false,
      data: {
        code: p.code,
        line: lineIds[p.line],
        order: p.order,
        name: p.name.vi,
        slug: p.slug.vi,
        summary: p.summary.vi,
        uses: p.uses?.vi,
        standardText: p.standardText?.vi,
        manufacturerText: 'Nhà máy REN Group tại Tangerang, Indonesia',
        saleStatus: p.saleStatus,
        claimLevel: p.claimLevel,
        cover: p.cover ? media[p.cover] : undefined,
        images: (p.images ?? []).map((k) => media[k]).filter(Boolean),
        legalReview: approved,
        _status: 'published',
      },
    })
    await payload.update({
      collection: 'products',
      id: doc.id,
      locale: 'en',
      overrideAccess: true,
      context: ctx,
      data: {
        name: p.name.en,
        slug: p.slug.en,
        summary: p.summary.en,
        uses: p.uses?.en,
        standardText: p.standardText?.en,
        manufacturerText: 'REN Group factory in Tangerang, Indonesia',
        legalReview: approved,
        _status: 'published',
      },
    })
    let order = 0
    for (const v of p.variants) {
      const vd = await payload.create({
        collection: 'variants',
        locale: 'vi',
        overrideAccess: true,
        context: ctx,
        data: { sku: v.sku, product: doc.id, order: order++, sizeLabel: v.size.vi, specStatus: 'proposed', ...(v.values ?? {}) },
      })
      await payload.update({ collection: 'variants', id: vd.id, locale: 'en', overrideAccess: true, context: ctx, data: { sizeLabel: v.size.en } })
    }
  }

  // Trang
  for (const pg of PAGES) {
    const mk = (c: (typeof pg)['vi']) => ({
      kicker: c.kicker,
      title: c.title,
      titleAccent: c.titleAccent,
      summary: c.summary,
      blocks: c.blocks,
      body: c.body ? rich(c.body) : undefined,
    })
    const status = pg.publish ? 'published' : 'draft'
    const doc = await payload.create({
      collection: 'pages',
      locale: 'vi',
      overrideAccess: true,
      context: ctx,
      draft: !pg.publish,
      data: {
        key: pg.key as never,
        kind: pg.kind ?? 'standard',
        hero: pg.hero ? media[pg.hero] : undefined,
        ...mk(pg.vi),
        legalReview: pg.kind === 'legal' ? { status: 'pending' } : approved,
        _status: status,
      } as never,
    })
    await payload.update({
      collection: 'pages',
      id: doc.id,
      locale: 'en',
      overrideAccess: true,
      context: ctx,
      draft: !pg.publish,
      data: { ...mk(pg.en), _status: status } as never,
    })
  }

  // Tài khoản mẫu
  if (opts.users) {
    const lines: string[] = []
    for (const u of USERS) {
      const existing = await payload.find({ collection: 'users', where: { email: { equals: u.email } }, overrideAccess: true, limit: 1 })
      const password = process.env.SEED_PASSWORD || `Rc-${crypto.randomBytes(9).toString('base64url')}9`
      if (existing.docs.length) {
        await payload.update({ collection: 'users', id: existing.docs[0].id, overrideAccess: true, context: ctx, data: { password, role: u.role, name: u.name } })
      } else {
        await payload.create({ collection: 'users', overrideAccess: true, context: ctx, data: { ...u, password } as never })
      }
      lines.push(`${u.role.padEnd(10)} ${u.email}  ${password}`)
    }
    if (!process.env.SEED_PASSWORD) {
      const out = path.resolve(process.cwd(), '.seed-credentials')
      fs.writeFileSync(out, `# Tài khoản mẫu — chỉ dùng cho dev/staging. Không đưa lên git.\n${lines.join('\n')}\n`, { mode: 0o600 })
      payload.logger.info(`Tài khoản mẫu đã ghi vào ${out}`)
    }
  }

  return { media: Object.keys(media).length, lines: LINES.length, products: PRODUCTS.length, pages: PAGES.length }
}
