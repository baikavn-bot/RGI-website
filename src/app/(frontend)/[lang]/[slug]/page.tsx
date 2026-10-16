import Link from 'next/link'
import { notFound, permanentRedirect, redirect } from 'next/navigation'

import { Breadcrumb, CtaBand, LineCard } from '../../../../components/Catalog'
import { ContentPage } from '../../../../components/ContentPage'
import { DataRequestForm } from '../../../../components/DataRequestForm'
import { Icon } from '../../../../components/Icon'
import { LeadForm } from '../../../../components/LeadForm'
import { PartnerTabs } from '../../../../components/PartnerTabs'
import { RichText } from '../../../../components/RichText'
import { getDocuments, getLines, getPage, getRedirect, getSettings, img } from '../../../../lib/data'
import { t } from '../../../../lib/i18n'
import { href, publicPath, type RouteKey } from '../../../../lib/routes'
import { buildMetadata, isLocale, routePaths } from '../../../../lib/seo'
import { formatPhoneVN, normalizePhone } from '../../../../lib/validators'

/** Khoá nội bộ (tiếng Anh) → khoá trang trong CMS. */
const PAGES: Record<string, { route: RouteKey; cms: string }> = {
  about: { route: 'about', cms: 'about' },
  factory: { route: 'factory', cms: 'factory' },
  products: { route: 'products', cms: 'products' },
  partners: { route: 'partners', cms: 'partners' },
  samples: { route: 'samples', cms: 'samples' },
  downloads: { route: 'downloads', cms: 'downloads' },
  contact: { route: 'contact', cms: 'contact' },
  terms: { route: 'terms', cms: 'terms' },
  privacy: { route: 'privacy', cms: 'privacy' },
  'thank-you': { route: 'thankYou', cms: '' },
}

type Params = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Params) {
  const { lang, slug } = await params
  if (!isLocale(lang) || !PAGES[slug]) return {}
  const def = PAGES[slug]
  const dict = t(lang)
  if (slug === 'thank-you') return buildMetadata({ locale: lang, title: dict.thanks.title, paths: routePaths('thankYou'), noindex: true })
  const page = await getPage(def.cms, lang)
  return buildMetadata({
    locale: lang,
    title: `${page?.seo?.title || page?.title || slug} · RENCO`,
    description: page?.seo?.description || page?.summary,
    paths: routePaths(def.route),
    image: img(page?.hero, 'hero')?.url,
  })
}

export default async function StaticPage({ params, searchParams }: Params) {
  const { lang, slug } = await params
  if (!isLocale(lang)) notFound()
  const def = PAGES[slug]
  if (!def) {
    const target = await getRedirect(publicPath(lang, [slug]))
    if (target) (target.permanent ? permanentRedirect : redirect)(target.to)
    notFound()
  }
  const dict = t(lang)
  const sp = await searchParams
  const [settings, lines] = await Promise.all([getSettings(lang), getLines(lang)])
  const hotline = formatPhoneVN(normalizePhone(settings.hotline) ?? settings.hotline)
  const consent = String(settings.consent?.text ?? '')
  const lineOptions = lines.map((l) => ({ code: l.code, name: l.name }))
  const formDict = { form: dict.form, errors: dict.errors, forms: dict.forms }
  const home = href(lang, 'home')
  const vi = lang === 'vi'

  if (slug === 'thank-you') {
    const ref = typeof sp.ref === 'string' ? sp.ref.slice(0, 20) : ''
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <span className="kicker">RENCO</span>
          <h1>{dict.thanks.title}</h1>
          {ref ? (
            <p className="lead">
              {dict.thanks.ref}: <strong className="code" style={{ fontSize: '1.1rem' }}>{ref}</strong>
            </p>
          ) : null}
          <p>
            {dict.thanks.next} {settings.responseTime ? `(${settings.responseTime})` : null}
          </p>
          <p>
            {dict.thanks.urgent}{' '}
            <a href={`tel:${normalizePhone(settings.hotline)}`}>
              <strong>{hotline}</strong>
            </a>
            {settings.zaloUrl ? (
              <>
                {' · '}
                <a href={settings.zaloUrl} target="_blank" rel="noopener">
                  Zalo
                </a>
              </>
            ) : null}
          </p>
          <div className="btn-row" style={{ marginTop: 24 }}>
            <Link className="btn btn--primary" href={href(lang, 'products')}>
              {dict.common.viewProducts}
            </Link>
            <Link className="btn btn--ghost" href={home}>
              {dict.common.backHome}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const page = await getPage(def.cms, lang)
  if (!page) {
    // Trang pháp lý chưa được Pháp chế duyệt và xuất bản: hiện thông báo, không để trang trắng.
    if (slug === 'terms' || slug === 'privacy') {
      return (
        <section className="section">
          <div className="wrap prose">
            <h1>{slug === 'terms' ? dict.footer.terms : dict.footer.privacy}</h1>
            <p className="muted">{dict.common.updating}.</p>
            {slug === 'privacy' ? <DataRequestForm locale={lang} dict={{ dsr: dict.dsr, form: dict.form, errors: dict.errors }} /> : null}
          </div>
        </section>
      )
    }
    notFound()
  }

  if (slug === 'terms' || slug === 'privacy') {
    return (
      <>
        <Breadcrumb label="Breadcrumb" items={[{ label: dict.common.breadcrumbHome, href: home }, { label: page.title }]} />
        <section className="section" style={{ paddingTop: 32 }}>
          <div className="wrap">
            <h1>{page.title}</h1>
            <p className="small muted">
              {page.policyVersion ? `${dict.common.version} ${page.policyVersion}` : null}
              {page.effectiveDate ? ` · ${vi ? 'Hiệu lực từ' : 'Effective'} ${new Date(page.effectiveDate).toLocaleDateString(vi ? 'vi-VN' : 'en-GB')}` : null}
            </p>
            {page.summary ? <p className="lead">{page.summary}</p> : null}
            <RichText data={page.body} />
            {slug === 'privacy' ? (
              <div style={{ marginTop: 48, maxWidth: 760 }}>
                <h2>{dict.dsr.title}</h2>
                <p className="muted">{dict.dsr.lead}</p>
                <DataRequestForm locale={lang} dict={{ dsr: dict.dsr, form: dict.form, errors: dict.errors }} />
              </div>
            ) : null}
          </div>
        </section>
      </>
    )
  }

  if (slug === 'products') {
    return (
      <ContentPage page={page} locale={lang} dict={dict} homeHref={home}>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap grid grid--5">
            {lines.map((l) => (
              <LineCard key={l.id} line={l} locale={lang} dict={dict.common} />
            ))}
          </div>
        </section>
        <CtaBand locale={lang} dict={dict} title={vi ? 'Cần báo giá' : 'Need a quote'} accent={vi ? 'cho công trình?' : 'for a project?'} text={dict.forms.contractor.lead} hotline={hotline} />
      </ContentPage>
    )
  }

  if (slug === 'partners') {
    const prefill = typeof sp.ma === 'string' ? sp.ma.split(',').map((s) => s.trim().toUpperCase()).filter((s) => /^RC-[A-Z0-9-]{1,30}$/.test(s)).slice(0, 20) : undefined
    return (
      <ContentPage page={page} locale={lang} dict={dict} homeHref={home}>
        <section className="section" style={{ paddingTop: 0 }} id="dang-ky">
          <div className="wrap">
            <ol className="steps mb-32" aria-label={vi ? 'Quy trình trở thành đối tác' : 'How to become a partner'}>
              {(vi
                ? ['Gửi đăng ký trên website', 'Sales gọi lại, hẹn gặp', 'Nhận chính sách, xem mẫu', 'Ký hợp đồng, đặt đơn đầu']
                : ['Register on the website', 'Sales calls you back', 'Receive terms and samples', 'Sign and place a first order']
              ).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <PartnerTabs
              locale={lang}
              dict={formDict}
              labels={{ distributor: vi ? 'Nhà phân phối' : 'Distributor', retailer: vi ? 'Cửa hàng' : 'Retail store', contractor: vi ? 'Đơn vị thi công' : 'Contractor' }}
              lines={lineOptions}
              consentText={consent}
              hotline={hotline}
              enabled={(settings.forms ?? {}) as Record<string, boolean>}
              prefillSkus={prefill}
            />
          </div>
        </section>
      </ContentPage>
    )
  }

  if (slug === 'samples') {
    return (
      <ContentPage page={page} locale={lang} dict={dict} homeHref={home}>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap" style={{ maxWidth: 860 }}>
            {settings.forms?.sample === false ? <p className="alert alert--error">{dict.form.disabled}</p> : <LeadForm type="sample" locale={lang} dict={formDict} lines={lineOptions} consentText={consent} hotline={hotline} />}
          </div>
        </section>
      </ContentPage>
    )
  }

  if (slug === 'downloads') {
    const docs = await getDocuments(lang)
    const sorted = [...docs].sort((a, b) => (a.locale === lang ? -1 : 0) - (b.locale === lang ? -1 : 0))
    return (
      <ContentPage page={page} locale={lang} dict={dict} homeHref={home}>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap grid" style={{ maxWidth: 900 }}>
            {sorted.length === 0 ? (
              <div className="empty">
                <p>{dict.common.empty}</p>
                <p className="small">{dict.common.emptyHint}</p>
                <Link className="btn btn--primary" href={href(lang, 'contact')}>
                  {dict.nav.contact}
                </Link>
              </div>
            ) : (
              sorted.map((d) => (
                <div key={d.id} className="card doc-card">
                  <div className="doc-icon" aria-hidden="true">
                    PDF
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem' }}>{d.title}</h3>
                    <p className="small muted" style={{ margin: 0 }}>
                      {d.locale === 'both' ? dict.common.both : d.locale === 'en' ? dict.common.en : dict.common.vi}
                      {d.version ? ` · ${dict.common.version} ${d.version}` : ''}
                      {d.publishedOn ? ` · ${dict.common.released} ${new Date(d.publishedOn).toLocaleDateString(vi ? 'vi-VN' : 'en-GB')}` : ''}
                      {d.filesize ? ` · ${(d.filesize / 1024 / 1024).toFixed(1)} MB` : ''}
                    </p>
                  </div>
                  <a className="btn btn--ghost" href={`/api/documents/${d.id}/download`} download>
                    <Icon name="download" size={18} /> {dict.common.download}
                  </a>
                </div>
              ))
            )}
          </div>
        </section>
      </ContentPage>
    )
  }

  if (slug === 'contact') {
    const phone = normalizePhone(settings.hotline) ?? settings.hotline
    return (
      <ContentPage page={page} locale={lang} dict={dict} homeHref={home}>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap split" style={{ alignItems: 'start' }}>
            <div className="card">
              <h2 style={{ fontSize: '1.5rem' }}>{settings.companyName}</h2>
              <ul className="contact-list">
                <li style={{ display: 'flex', gap: 10 }}>
                  <Icon name="phone" /> <a href={`tel:${phone}`}>{hotline}</a>
                </li>
                <li style={{ display: 'flex', gap: 10 }}>
                  <Icon name="mail" /> <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
                {settings.zaloUrl ? (
                  <li style={{ display: 'flex', gap: 10 }}>
                    <Icon name="chat" />{' '}
                    <a href={settings.zaloUrl} target="_blank" rel="noopener">
                      Zalo
                    </a>
                  </li>
                ) : null}
                <li style={{ display: 'flex', gap: 10 }}>
                  <Icon name="pin" />
                  <span>
                    {settings.address}
                    <br />
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`} target="_blank" rel="noopener" className="small">
                      {vi ? 'Mở Google Maps' : 'Open in Google Maps'}
                    </a>
                  </span>
                </li>
              </ul>
              <p className="small muted" style={{ marginTop: 16 }}>
                {dict.footer.taxCode}: {settings.taxCode}
              </p>
            </div>
            {settings.forms?.contact === false ? null : <LeadForm type="contact" locale={lang} dict={formDict} lines={lineOptions} consentText={consent} hotline={hotline} />}
          </div>
        </section>
      </ContentPage>
    )
  }

  // about, factory
  return (
    <ContentPage page={page} locale={lang} dict={dict} homeHref={home}>
      <CtaBand locale={lang} dict={dict} title={vi ? 'Xem tận mắt' : 'See it for yourself'} accent={vi ? 'chất lượng RENCO' : 'RENCO quality'} text={dict.forms.sample.lead} hotline={hotline} />
    </ContentPage>
  )
}
