import Link from 'next/link'

import { t } from '../../../lib/i18n'
import { href } from '../../../lib/routes'

/** 404 trong khung website. Không đọc được ngôn ngữ ở đây nên hiện song ngữ. */
export default function NotFound() {
  const vi = t('vi')
  const en = t('en')
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <span className="kicker">404</span>
        <h1>{vi.notFound.title}</h1>
        <p className="lead">{vi.notFound.lead}</p>
        <p className="muted small">
          {en.notFound.title}. {en.notFound.lead}
        </p>
        <div className="btn-row" style={{ marginTop: 24 }}>
          <Link className="btn btn--primary" href={href('vi', 'home')}>
            {vi.common.backHome}
          </Link>
          <Link className="btn btn--ghost" href={href('vi', 'products')}>
            {vi.nav.products}
          </Link>
          <Link className="btn btn--ghost" href={href('vi', 'contact')}>
            {vi.nav.contact}
          </Link>
          <Link className="btn btn--ghost" href={href('en', 'home')}>
            English
          </Link>
        </div>
      </div>
    </section>
  )
}
