import Link from 'next/link'

import type { Locale } from '../lib/constants'
import type { Dict } from '../lib/i18n'
import { href } from '../lib/routes'
import { formatPhoneVN, normalizePhone } from '../lib/validators'
import type { Setting } from '../payload-types'

export function Footer({ locale, dict, settings }: { locale: Locale; dict: Dict; settings: Setting }) {
  const phone = normalizePhone(settings.hotline ?? '') ?? settings.hotline
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="footer__logo" src="/brand/logo-white.svg" alt="RENCO" width={140} height={32} />
            <p>
              <strong>{settings.companyName}</strong>
              <br />
              {dict.footer.taxCode}: {settings.taxCode}
              <br />
              {dict.footer.address}: {settings.address}
            </p>
            <p className="small">{dict.footer.brandLine}</p>
          </div>
          <div>
            <h2>{dict.nav.products}</h2>
            <ul>
              <li>
                <Link href={href(locale, 'products')}>{dict.common.allLines}</Link>
              </li>
              <li>
                <Link href={href(locale, 'factory')}>{dict.nav.factory}</Link>
              </li>
              <li>
                <Link href={href(locale, 'samples')}>{dict.nav.samples}</Link>
              </li>
              <li>
                <Link href={href(locale, 'downloads')}>{dict.nav.downloads}</Link>
              </li>
              <li>
                <Link href={href(locale, 'about')}>{dict.nav.about}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>{dict.nav.contact}</h2>
            <ul>
              {phone ? (
                <li>
                  Hotline: <a href={`tel:${phone}`}>{formatPhoneVN(phone)}</a>
                </li>
              ) : null}
              <li>
                Email: <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
              {settings.zaloUrl ? (
                <li>
                  <a href={settings.zaloUrl} rel="noopener" target="_blank">
                    Zalo
                  </a>
                </li>
              ) : null}
              <li>
                <Link href={href(locale, 'partners')}>{dict.nav.cta}</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__legal">
          <span>
            © {year} {settings.companyName}
          </span>
          <span>
            <Link href={href(locale, 'terms')}>{dict.footer.terms}</Link> ·{' '}
            <Link href={href(locale, 'privacy')}>{dict.footer.privacy}</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
