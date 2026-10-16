import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CtaBand, LineCard } from '../../../components/Catalog'
import { Icon } from '../../../components/Icon'
import { FACTORY_RECYCLING_STATEMENT } from '../../../lib/constants'
import { getLines, getPage, getSettings, img } from '../../../lib/data'
import { t } from '../../../lib/i18n'
import { href } from '../../../lib/routes'
import { buildMetadata, isLocale, routePaths } from '../../../lib/seo'

type Params = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Params) {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const page = await getPage('home', lang)
  return buildMetadata({
    locale: lang,
    title: page?.seo?.title || 'RENCO — ' + (lang === 'vi' ? 'Ống nhựa, ống mềm, tấm nhựa tái chế' : 'Plastic pipes, hoses and recycled boards'),
    description: page?.seo?.description || page?.summary,
    paths: routePaths('home'),
  })
}

const CHANNEL_ANCHORS = ['nha-phan-phoi', 'cua-hang', 'cong-trinh']

export default async function Home({ params }: Params) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = t(lang)
  const [page, factory, lines, settings] = await Promise.all([getPage('home', lang), getPage('factory', lang), getLines(lang), getSettings(lang)])
  const hero = img(page?.hero, 'hero')
  const factoryImg = img(factory?.hero, 'card')
  const channels = page?.blocks ?? []
  const vi = lang === 'vi'

  return (
    <>
      <section className="hero">
        <div className="dots" aria-hidden="true" />
        <div className="wrap hero__grid">
          <div>
            {page?.kicker ? <span className="kicker">{page.kicker}</span> : null}
            <h1>
              {page?.title ?? 'RENCO'} {page?.titleAccent ? <span className="accent">{page.titleAccent}</span> : null}
            </h1>
            {page?.summary ? <p className="lead">{page.summary}</p> : null}
            <div className="btn-row" style={{ marginTop: 28 }}>
              <Link className="btn btn--primary" href={href(lang, 'partners')}>
                {dict.nav.cta} <Icon name="arrow" size={18} />
              </Link>
              <Link className="btn btn--ghost" href={href(lang, 'products')}>
                {dict.common.viewProducts}
              </Link>
            </div>
          </div>
          <div className="hero__media">
            <div className="arch">
              {hero ? <Image src={hero.url} alt={hero.alt} width={hero.width} height={hero.height} preload sizes="(max-width: 860px) 90vw, 480px" /> : null}
            </div>
            <div className="hero__stat">
              <div className="stat-num">750 {vi ? 'tấn' : 'tonnes'}</div>
              <p className="small muted" style={{ margin: '8px 0 0' }}>
                {FACTORY_RECYCLING_STATEMENT[lang]}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--canvas" aria-labelledby="lines-title">
        <div className="wrap">
          <span className="kicker">{dict.nav.products}</span>
          <h2 id="lines-title">
            {vi ? 'Năm dòng sản phẩm,' : 'Five product lines,'} <span className="accent">{vi ? 'một nhà máy' : 'one factory'}</span>
          </h2>
          <p className="lead mb-32">
            {vi
              ? 'Ống uPVC, ống mềm PVC, tấm nhựa, tấm lợp và tấm ốp tường cùng ra từ nhà máy REN Group tại Tangerang, Indonesia.'
              : 'uPVC pipes, PVC hoses, plastic boards, roofing and wall panels, all made at the REN Group factory in Tangerang, Indonesia.'}
          </p>
          {lines.length ? (
            <div className="grid grid--5">
              {lines.map((l) => (
                <LineCard key={l.id} line={l} locale={lang} dict={dict.common} />
              ))}
            </div>
          ) : (
            <div className="empty">{dict.common.empty}</div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="factory-title">
        <div className="wrap split">
          <div className="rounded" style={{ aspectRatio: '5 / 4' }}>
            {factoryImg ? <Image src={factoryImg.url} alt={factoryImg.alt} width={factoryImg.width} height={factoryImg.height} sizes="(max-width: 860px) 100vw, 560px" /> : null}
          </div>
          <div>
            {factory?.kicker ? <span className="kicker">{factory.kicker}</span> : null}
            <h2 id="factory-title">
              {factory?.title} {factory?.titleAccent ? <span className="accent">{factory.titleAccent}</span> : null}
            </h2>
            {factory?.summary ? <p className="lead">{factory.summary}</p> : null}
            <Link className="btn btn--ghost" href={href(lang, 'factory')}>
              {dict.common.viewFactory} <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {channels.length ? (
        <section className="section section--tint" aria-labelledby="channels-title">
          <div className="wrap">
            <span className="kicker">{dict.nav.partners}</span>
            <h2 id="channels-title">
              {vi ? 'Ba cách' : 'Three ways'} <span className="accent">{vi ? 'hợp tác với RENCO' : 'to work with RENCO'}</span>
            </h2>
            <div className="grid grid--3" style={{ marginTop: 32 }}>
              {channels.map((c, i) => (
                <Link key={c.id ?? i} className="card card--link" href={`${href(lang, 'partners')}#${CHANNEL_ANCHORS[i] ?? ''}`}>
                  <Icon name={['truck', 'building', 'factory'][i] ?? 'arrow'} size={28} />
                  <h3>{c.heading}</h3>
                  {c.text ? <p className="small muted" style={{ margin: 0 }}>{c.text}</p> : null}
                  <span className="more">
                    {dict.common.learnMore} <Icon name="arrow" size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" aria-label={vi ? 'Tài liệu và bộ mẫu' : 'Documents and samples'}>
        <div className="wrap grid grid--2">
          <div className="card">
            <Icon name="download" size={28} />
            <h3>{vi ? 'Catalog và hồ sơ năng lực' : 'Catalog and company profile'}</h3>
            <p className="muted">
              {vi ? 'Tải bản PDF tiếng Việt hoặc tiếng Anh, không cần điền form.' : 'Download the PDF in Vietnamese or English. No form needed.'}
            </p>
            <Link className="more" href={href(lang, 'downloads')}>
              {dict.nav.downloads} <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className="card">
            <Icon name="layers" size={28} />
            <h3>{vi ? 'Xem mẫu tận tay' : 'See samples in person'}</h3>
            <p className="muted">
              {vi ? 'Bảng mẫu ống mềm, tấm lợp, tấm ốp gửi tới cửa hàng hoặc công trình của anh/chị.' : 'Hose, roofing and wall-panel sample boards shipped to your store or site.'}
            </p>
            <Link className="more" href={href(lang, 'samples')}>
              {dict.common.requestSample} <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        locale={lang}
        dict={dict}
        title={vi ? 'Muốn bán RENCO' : 'Want to sell RENCO'}
        accent={vi ? 'ở khu vực của mình?' : 'in your area?'}
        text={vi ? 'Để lại thông tin, sales gọi lại để gửi chính sách và điều kiện hợp tác.' : 'Leave your details and our sales team will call you with partnership terms.'}
        hotline={settings.hotline}
      />
    </>
  )
}
