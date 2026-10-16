import Image from 'next/image'

import type { Locale } from '../lib/constants'
import { img } from '../lib/data'
import type { Dict } from '../lib/i18n'
import type { Page } from '../payload-types'
import { Breadcrumb } from './Catalog'
import { RichText } from './RichText'

/** Bố cục chung cho trang nội dung: đầu trang có ảnh vòm, khối số liệu có nguồn, nội dung dài. */
export function ContentPage({ page, locale, dict, homeHref, children }: { page: Page; locale: Locale; dict: Dict; homeHref: string; children?: React.ReactNode }) {
  const hero = img(page.hero, 'hero')
  const blocks = page.blocks ?? []
  return (
    <>
      <Breadcrumb label={locale === 'vi' ? 'Đường dẫn' : 'Breadcrumb'} items={[{ label: dict.common.breadcrumbHome, href: homeHref }, { label: page.title }]} />
      <section className="hero" style={{ paddingTop: 32 }}>
        <div className="wrap hero__grid">
          <div>
            {page.kicker ? <span className="kicker">{page.kicker}</span> : null}
            <h1>
              {page.title} {page.titleAccent ? <span className="accent">{page.titleAccent}</span> : null}
            </h1>
            {page.summary ? <p className="lead">{page.summary}</p> : null}
          </div>
          {hero ? (
            <div className="hero__media">
              <div className="arch" style={{ aspectRatio: '1 / 1' }}>
                <Image src={hero.url} alt={hero.alt} width={hero.width} height={hero.height} preload sizes="(max-width: 860px) 90vw, 440px" />
              </div>
            </div>
          ) : null}
        </div>
      </section>
      {blocks.length ? (
        <section className="section section--canvas" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <div className="wrap grid grid--3">
            {blocks.map((b, i) => (
              <div key={b.id ?? i} className="card">
                {b.figure ? <div className="figure">{b.figure}</div> : null}
                {b.figureLabel ? <p className="small muted" style={{ margin: 0 }}>{b.figureLabel}</p> : null}
                <h3>{b.heading}</h3>
                {b.text ? <p className="muted" style={{ margin: 0 }}>{b.text}</p> : null}
                {b.source ? (
                  <p className="small muted" style={{ margin: 0 }}>
                    {dict.common.source}: {b.source}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {page.body ? (
        <section className="section">
          <div className="wrap">
            <RichText data={page.body} />
          </div>
        </section>
      ) : null}
      {children}
    </>
  )
}
