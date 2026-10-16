import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Breadcrumb, ClaimNote, ComplianceBadge, MediaFallback, StatusBadge } from '../../../../../../components/Catalog'
import { Icon } from '../../../../../../components/Icon'
import { RichText } from '../../../../../../components/RichText'
import { VariantTable } from '../../../../../../components/VariantTable'
import { getAllProducts, getComplianceFor, getLines, getProduct, getVariants, img } from '../../../../../../lib/data'
import { t } from '../../../../../../lib/i18n'
import { href, siteUrl } from '../../../../../../lib/routes'
import { buildMetadata, isLocale } from '../../../../../../lib/seo'
import { columnsFor, toRows } from '../../../../../../lib/specs'
import type { Document, ProductLine } from '../../../../../../payload-types'

type Params = { params: Promise<{ lang: string; line: string; product: string }> }

async function load(lang: 'vi' | 'en', lineSlug: string, slug: string) {
  const product = await getProduct(slug, lang)
  if (!product || typeof product.line !== 'object') return null
  const line = product.line as ProductLine
  if (line.slug !== lineSlug) return null
  const other = lang === 'vi' ? 'en' : 'vi'
  const [otherProducts, otherLines] = await Promise.all([getAllProducts(other), getLines(other)])
  const op = otherProducts.find((p) => p.id === product.id)
  const ol = otherLines.find((l) => l.id === line.id)
  return { product, line, otherPath: href(other, 'products', ol?.slug ?? lineSlug, op?.slug ?? slug) }
}

export async function generateMetadata({ params }: Params) {
  const { lang, line, product: slug } = await params
  if (!isLocale(lang)) return {}
  const data = await load(lang, line, slug)
  if (!data) return {}
  const own = href(lang, 'products', line, slug)
  const paths = lang === 'vi' ? { vi: own, en: data.otherPath } : { vi: data.otherPath, en: own }
  return buildMetadata({
    locale: lang,
    title: data.product.seo?.title || `${data.product.name} ${data.product.code} · RENCO`,
    description: data.product.seo?.description || data.product.summary,
    paths,
    image: img(data.product.cover, 'hero')?.url,
  })
}

export default async function ProductPage({ params }: Params) {
  const { lang, line: lineSlug, product: slug } = await params
  if (!isLocale(lang)) notFound()
  const data = await load(lang, lineSlug, slug)
  if (!data) notFound()
  const { product, line } = data
  const dict = t(lang)
  const vi = lang === 'vi'
  const [variants, compliance] = await Promise.all([getVariants([product.id], lang), getComplianceFor(product.id)])
  const columns = columnsFor(line.code)
  const rows = toRows(variants, columns)
  const cover = img(product.cover, 'hero')
  const gallery = ((product.images ?? []) as unknown[]).map((m) => img(m, 'thumb')).filter(Boolean) as NonNullable<ReturnType<typeof img>>[]
  const docs = ((product.documents ?? []) as (Document | number)[]).filter((d): d is Document => typeof d === 'object' && d.visibility === 'public')
  const crValid = !!compliance?.expiresOn && new Date(compliance.expiresOn) > new Date()
  // Ống uPVC: chỉ nhận báo giá khi đang bán và hồ sơ hợp quy còn hạn (BR-01).
  const canQuote = line.code !== 'RC-P' || (product.saleStatus === 'on_sale' && crValid)
  const quoteHref = `${href(lang, 'partners')}?ma=${encodeURIComponent(variants.map((v) => v.sku).slice(0, 10).join(',') || product.code)}#cong-trinh`

  // Schema Product: không có giá (offers), không có đánh giá.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.code,
    brand: { '@type': 'Brand', name: 'RENCO' },
    description: product.summary ?? undefined,
    image: cover ? `${siteUrl()}${cover.url}` : undefined,
    category: line.name,
  }
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: dict.common.breadcrumbHome, item: siteUrl() + href(lang, 'home') },
      { '@type': 'ListItem', position: 2, name: dict.nav.products, item: siteUrl() + href(lang, 'products') },
      { '@type': 'ListItem', position: 3, name: line.name, item: siteUrl() + href(lang, 'products', line.slug) },
      { '@type': 'ListItem', position: 4, name: product.name },
    ],
  }

  return (
    <>
      <Breadcrumb
        label="Breadcrumb"
        items={[
          { label: dict.common.breadcrumbHome, href: href(lang, 'home') },
          { label: dict.nav.products, href: href(lang, 'products') },
          { label: line.name, href: href(lang, 'products', line.slug) },
          { label: product.name },
        ]}
      />
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="wrap detail">
          <div className="gallery">
            <div className="rounded gallery__main" style={{ borderTop: `6px solid ${line.color}` }}>
              {cover ? <Image src={cover.url} alt={cover.alt} width={cover.width} height={cover.height} preload sizes="(max-width: 860px) 100vw, 560px" /> : <MediaFallback code={product.code} color={line.color} />}
            </div>
            {gallery.length ? (
              <div className="gallery__thumbs">
                {gallery.map((g, i) => (
                  <div className="rounded" key={i}>
                    <Image src={g.url} alt={g.alt} width={g.width} height={g.height} sizes="140px" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <div className="badges" style={{ marginBottom: 12 }}>
              <span className="code">{product.code}</span>
              <StatusBadge status={product.saleStatus} dict={dict.common} />
            </div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 1.4rem + 2vw, 2.8rem)' }}>{product.name}</h1>
            {product.summary ? <p className="lead">{product.summary}</p> : null}
            <ClaimNote product={product} dict={dict.badge} locale={lang} />
            <dl className="facts">
              <dt>{dict.common.madeAt}</dt>
              <dd>{product.manufacturerText}</dd>
              {product.standardText ? (
                <>
                  <dt>{dict.common.standard}</dt>
                  <dd>{product.standardText}</dd>
                </>
              ) : null}
              {product.uses?.length ? (
                <>
                  <dt>{dict.common.uses}</dt>
                  <dd>{product.uses.join(' · ')}</dd>
                </>
              ) : null}
            </dl>
            <ComplianceBadge record={compliance} product={product} dict={dict.badge} locale={lang} />
            <div className="btn-row" style={{ marginTop: 20 }}>
              {canQuote ? (
                <Link className="btn btn--primary" href={quoteHref}>
                  {dict.common.requestQuote} <Icon name="arrow" size={18} />
                </Link>
              ) : (
                <Link className="btn btn--primary" href={`${href(lang, 'partners')}#nha-phan-phoi`}>
                  {vi ? 'Đăng ký nhận tin mở bán' : 'Get notified at launch'}
                </Link>
              )}
              <Link className="btn btn--ghost" href={href(lang, 'samples')}>
                {dict.common.requestSample}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {rows.length ? (
        <section className="section section--canvas" aria-labelledby="spec-title" style={{ paddingTop: 56 }}>
          <div className="wrap">
            <h2 id="spec-title">{dict.common.specs}</h2>
            <Suspense>
              <VariantTable rows={rows} columns={columns} dict={dict} locale={lang} filterable caption={`${dict.common.specs} ${product.name}`} />
            </Suspense>
          </div>
        </section>
      ) : null}

      {product.body || docs.length ? (
        <section className="section">
          <div className="wrap split" style={{ alignItems: 'start' }}>
            <div>{product.body ? <RichText data={product.body} /> : null}</div>
            {docs.length ? (
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>{dict.common.documents}</h2>
                <div className="grid">
                  {docs.map((d) => (
                    <a key={d.id} className="card card--link doc-card" href={`/api/documents/${d.id}/download`} download>
                      <div className="doc-icon" aria-hidden="true">
                        PDF
                      </div>
                      <span>{d.title}</span>
                      <Icon name="download" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {canQuote ? (
        <div className="quote-bar">
          <div className="wrap">
            <span>
              <span className="code">{product.code}</span> · <strong>{product.name}</strong>
            </span>
            <Link className="btn btn--primary" href={quoteHref}>
              {dict.common.requestQuote}
            </Link>
          </div>
        </div>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, '\\u003c') }} />
    </>
  )
}
