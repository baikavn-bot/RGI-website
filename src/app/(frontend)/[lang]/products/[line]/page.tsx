import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Breadcrumb, CtaBand, ProductCard } from '../../../../../components/Catalog'
import { Icon } from '../../../../../components/Icon'
import { VariantTable } from '../../../../../components/VariantTable'
import { getLineBySlug, getLines, getProductsByLine, getSettings, getVariants, img } from '../../../../../lib/data'
import { t } from '../../../../../lib/i18n'
import { href } from '../../../../../lib/routes'
import { buildMetadata, isLocale } from '../../../../../lib/seo'
import { columnsFor, toRows } from '../../../../../lib/specs'
import { formatPhoneVN, normalizePhone } from '../../../../../lib/validators'

type Params = { params: Promise<{ lang: string; line: string }> }

async function load(lang: 'vi' | 'en', slug: string) {
  const line = await getLineBySlug(slug, lang)
  if (!line) return null
  const other = lang === 'vi' ? 'en' : 'vi'
  const lines = await getLines(other)
  const otherLine = lines.find((l) => l.id === line.id)
  return { line, otherSlug: otherLine?.slug ?? slug }
}

export async function generateMetadata({ params }: Params) {
  const { lang, line: slug } = await params
  if (!isLocale(lang)) return {}
  const data = await load(lang, slug)
  if (!data) return {}
  const { line, otherSlug } = data
  const paths = lang === 'vi' ? { vi: href('vi', 'products', slug), en: href('en', 'products', otherSlug) } : { vi: href('vi', 'products', otherSlug), en: href('en', 'products', slug) }
  return buildMetadata({ locale: lang, title: `${line.name} · RENCO`, description: line.description || line.tagline, paths, image: img(line.image, 'hero')?.url })
}

export default async function LinePage({ params }: Params) {
  const { lang, line: slug } = await params
  if (!isLocale(lang)) notFound()
  const data = await load(lang, slug)
  if (!data) notFound()
  const { line } = data
  const dict = t(lang)
  const vi = lang === 'vi'
  const [products, settings] = await Promise.all([getProductsByLine(line.id, lang), getSettings(lang)])
  const productOrder = new Map(products.map((p, i) => [p.id, i]))
  const pid = (v: { product: number | { id: number } }) => (typeof v.product === 'object' ? v.product.id : v.product)
  // Gom quy cách theo sản phẩm (đúng thứ tự sản phẩm), trong mỗi sản phẩm theo thứ tự quy cách.
  const variants = (
    await getVariants(
      products.map((p) => p.id),
      lang,
    )
  ).sort((a, b) => (productOrder.get(pid(a)) ?? 0) - (productOrder.get(pid(b)) ?? 0) || (a.order ?? 0) - (b.order ?? 0))
  const columns = columnsFor(line.code)
  const nameOf = new Map(products.map((p) => [p.id, p.name]))
  const rows = toRows(variants, columns, (v) => nameOf.get(typeof v.product === 'object' ? v.product.id : v.product))
  const image = img(line.image, 'hero')
  const hotline = formatPhoneVN(normalizePhone(settings.hotline) ?? settings.hotline)

  return (
    <>
      <Breadcrumb
        label="Breadcrumb"
        items={[{ label: dict.common.breadcrumbHome, href: href(lang, 'home') }, { label: dict.nav.products, href: href(lang, 'products') }, { label: line.name }]}
      />
      <section className="hero" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div className="wrap hero__grid">
          <div>
            <span className="kicker" style={{ color: line.color }}>
              {line.code}
            </span>
            <h1>{line.name}</h1>
            {line.tagline ? <p className="lead">{line.tagline}</p> : null}
            {line.description ? <p className="muted">{line.description}</p> : null}
            {line.note ? <p className="alert alert--ok small">{line.note}</p> : null}
            <div className="btn-row" style={{ marginTop: 20 }}>
              <Link className="btn btn--primary" href={`${href(lang, 'partners')}#cong-trinh`}>
                {dict.common.requestQuote} <Icon name="arrow" size={18} />
              </Link>
              <Link className="btn btn--ghost" href={href(lang, 'samples')}>
                {dict.common.requestSample}
              </Link>
            </div>
          </div>
          {image ? (
            <div className="hero__media">
              <div className="rounded" style={{ aspectRatio: '4 / 3', borderTop: `6px solid ${line.color}` }}>
                <Image src={image.url} alt={image.alt} width={image.width} height={image.height} preload sizes="(max-width: 860px) 90vw, 480px" />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section section--canvas" style={{ paddingTop: 56 }}>
        <div className="wrap">
          <h2>{vi ? 'Sản phẩm trong dòng' : 'Products in this line'}</h2>
          {products.length ? (
            <div className="grid grid--3" style={{ marginTop: 24 }}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} line={line} locale={lang} dict={dict.common} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <p>{dict.common.empty}</p>
              <p className="small">{dict.common.emptyHint}</p>
            </div>
          )}
        </div>
      </section>

      {rows.length ? (
        <section className="section" aria-labelledby="spec-title">
          <div className="wrap">
            <h2 id="spec-title">{dict.common.specs}</h2>
            <Suspense>
              <VariantTable rows={rows} columns={columns} dict={dict} locale={lang} showProduct={products.length > 1} filterable caption={`${dict.common.specs} ${line.name}`} />
            </Suspense>
          </div>
        </section>
      ) : null}

      <CtaBand locale={lang} dict={dict} title={vi ? 'Cần báo giá' : 'Need a quote'} accent={vi ? `cho ${line.name}?` : `for ${line.name}?`} text={dict.forms.contractor.lead} hotline={hotline} />
    </>
  )
}
