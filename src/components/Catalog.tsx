import Image from 'next/image'
import Link from 'next/link'

import { FACTORY_RECYCLING_STATEMENT, type Locale } from '../lib/constants'
import { img } from '../lib/data'
import type { Dict } from '../lib/i18n'
import { href } from '../lib/routes'
import type { ComplianceRecord, Product, ProductLine } from '../payload-types'
import { Icon } from './Icon'

export const lineColor = (l?: ProductLine | number | null) =>
  l && typeof l === 'object' ? l.color : 'var(--brand)'

/** Ô ảnh dự phòng khi chưa có ảnh đã duyệt: nền màu dòng, mã lớn. */
function MediaFallback({ code, color }: { code: string; color: string }) {
  return (
    <div className="media-fallback" style={{ ['--line' as string]: color }} aria-hidden="true">
      <span>{code}</span>
    </div>
  )
}

export function StatusBadge({ status, dict }: { status?: string | null; dict: Dict['common'] }) {
  if (status === 'coming_soon') return <span className="badge badge--soon">{dict.comingSoon}</span>
  if (status === 'discontinued') return <span className="badge badge--off">{dict.discontinued}</span>
  return null
}

/**
 * Nhãn Hợp quy: chỉ dựng khi API trả hồ sơ đã duyệt, còn hạn, và sản phẩm đang bán (BR-01, BR-05).
 * Không có giá trị dự phòng.
 */
export { MediaFallback }

export function ComplianceBadge({ record, product, dict, locale }: { record: ComplianceRecord | null; product: Product; dict: Dict['badge']; locale: Locale }) {
  // Kiểm lại hạn ngay lúc dựng trang (dữ liệu có thể nằm trong cache tới 1 giờ).
  if (!record || record.status !== 'approved' || product.saleStatus !== 'on_sale') return null
  if (!record.expiresOn || new Date(record.expiresOn) <= new Date()) return null
  const scan = record.scan && typeof record.scan === 'object' && record.scan.visibility === 'public' ? record.scan : null
  return (
    <div className="card" style={{ background: 'var(--brand-tint)', borderColor: 'var(--green-300)' }}>
      <div className="badges">
        <span className="badge badge--cr">
          <Icon name="shield" size={16} /> {dict.cr}
        </span>
      </div>
      <dl className="facts" style={{ margin: '8px 0 0' }}>
        <dt>{locale === 'vi' ? 'Quy chuẩn' : 'Regulation'}</dt>
        <dd>{record.regulation}</dd>
        <dt>{dict.registration}</dt>
        <dd>{record.registrationNo}</dd>
        <dt>{dict.certBody}</dt>
        <dd>{record.certBody}</dd>
      </dl>
      {scan ? (
        <a href={`/api/documents/${scan.id}/download`} className="more">
          {dict.viewScan} <Icon name="arrow" size={16} />
        </a>
      ) : null}
    </div>
  )
}

/** Nhãn tái chế theo thang ba cấp. Cấp 1 là thông tin nhà máy, không phải nhãn của sản phẩm. */
export function ClaimNote({ product, dict, locale }: { product: Product; dict: Dict['badge']; locale: Locale }) {
  const level = product.claimLevel
  if (!level || level === 'none') return null
  if (level === 'level1_factory') {
    return (
      <p className="small muted" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Icon name="leaf" size={18} /> <span>{FACTORY_RECYCLING_STATEMENT[locale]}</span>
      </p>
    )
  }
  return (
    <div className="stack-sm">
      <span className="badge badge--claim">
        <Icon name="leaf" size={16} /> {level === 'level2_product' ? dict.level2 : dict.level3}
      </span>
      {product.claimStatement ? <p className="small muted">{product.claimStatement}</p> : null}
    </div>
  )
}

export function LineCard({ line, locale, dict }: { line: ProductLine; locale: Locale; dict: Dict['common'] }) {
  const image = img(line.image, 'card')
  return (
    <Link href={href(locale, 'products', line.slug)} className="card card--link line-card" style={{ ['--line' as string]: line.color }}>
      <div className="card__media">
        {image ? <Image src={image.url} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 640px) 100vw, 240px" /> : <MediaFallback code={line.code} color={line.color} />}
      </div>
      <span className="code">{line.code}</span>
      <h3>{line.name}</h3>
      {line.tagline ? <p className="small muted" style={{ margin: 0 }}>{line.tagline}</p> : null}
      <span className="more">
        {dict.viewLine} <Icon name="arrow" size={16} />
      </span>
    </Link>
  )
}

export function ProductCard({ product, line, locale, dict }: { product: Product; line: ProductLine; locale: Locale; dict: Dict['common'] }) {
  const image = img(product.cover, 'card')
  return (
    <Link href={href(locale, 'products', line.slug, product.slug)} className="card card--link line-card" style={{ ['--line' as string]: line.color }}>
      <div className="card__media">
        {image ? <Image src={image.url} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 640px) 100vw, 320px" /> : <MediaFallback code={product.code} color={line.color} />}
      </div>
      <div className="badges">
        <span className="code">{product.code}</span>
        <StatusBadge status={product.saleStatus} dict={dict} />
      </div>
      <h3>{product.name}</h3>
      {product.summary ? <p className="small muted" style={{ margin: 0 }}>{product.summary}</p> : null}
      <span className="more">
        {dict.learnMore} <Icon name="arrow" size={16} />
      </span>
    </Link>
  )
}

export function Breadcrumb({ items, label }: { items: { label: string; href?: string }[]; label: string }) {
  return (
    <nav className="breadcrumb wrap" aria-label={label}>
      <ol>
        {items.map((it, i) => (
          <li key={i}>{it.href && i < items.length - 1 ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}</li>
        ))}
      </ol>
    </nav>
  )
}

export function CtaBand({ locale, dict, title, accent, text, hotline }: { locale: Locale; dict: Dict; title: string; accent?: string; text: string; hotline?: string | null }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="cta-band">
          <div>
            <h2>
              {title} {accent ? <span className="accent">{accent}</span> : null}
            </h2>
            <p style={{ margin: 0 }}>{text}</p>
          </div>
          <div className="btn-row">
            <Link className="btn btn--accent" href={href(locale, 'partners')}>
              {dict.nav.cta}
            </Link>
            {hotline ? (
              <a className="btn btn--ghost" href={`tel:${hotline.replace(/\s/g, '')}`}>
                <Icon name="phone" size={18} /> {hotline}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
