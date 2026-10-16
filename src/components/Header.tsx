'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import type { Locale } from '../lib/constants'
import type { Dict } from '../lib/i18n'
import { href, INTERNAL_TO_VI, VI_TO_INTERNAL } from '../lib/routes'
import { Icon } from './Icon'

type Props = { locale: Locale; dict: Dict['nav'] }

/** Đường dẫn bản ngôn ngữ kia suy theo bảng (dùng khi chưa có thẻ hreflang của trang). */
function guessAlternate(locale: Locale, pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (locale === 'en') {
    const [, first, ...rest] = parts
    if (!first) return '/'
    return '/' + [INTERNAL_TO_VI[first] ?? first, ...rest].join('/')
  }
  const [first, ...rest] = parts
  if (!first) return '/en'
  return '/en/' + [VI_TO_INTERNAL[first] ?? first, ...rest].join('/')
}

export function Header({ locale, dict }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() || '/'
  const other: Locale = locale === 'vi' ? 'en' : 'vi'
  const alt = guessAlternate(locale, pathname)
  const close = () => setOpen(false)

  // Bấm đổi ngôn ngữ: ưu tiên thẻ hreflang của trang (đúng cả slug sản phẩm tiếng Anh).
  const switchLang = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${other}"]`)
    if (!link) return
    e.preventDefault()
    window.location.assign(new URL(link.href).pathname)
  }

  const items = [
    { key: 'products', label: dict.products },
    { key: 'factory', label: dict.factory },
    { key: 'partners', label: dict.partners },
    { key: 'downloads', label: dict.downloads },
    { key: 'contact', label: dict.contact },
  ] as const

  const isCurrent = (url: string) => (pathname === url || pathname.startsWith(url + '/') ? 'page' : undefined)

  return (
    <header className="header">
      <a className="skip" href="#main">
        {dict.skip}
      </a>
      <div className="wrap header__bar">
        <Link href={href(locale, 'home')} className="header__logo" aria-label="RENCO">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-full.svg" alt="RENCO" width={132} height={30} />
        </Link>
        <nav className="header__nav" aria-label={locale === 'vi' ? 'Menu chính' : 'Main menu'}>
          {items.map((it) => {
            const url = href(locale, it.key)
            return (
              <Link key={it.key} href={url} aria-current={isCurrent(url)}>
                {it.label}
              </Link>
            )
          })}
        </nav>
        <div className="header__tools">
          <a className="lang" href={alt} hrefLang={other} aria-label={dict.switchLabel} onClick={switchLang}>
            {locale === 'vi' ? 'EN' : 'VI'}
          </a>
          <Link className="btn btn--primary" href={href(locale, 'partners')}>
            {dict.cta}
          </Link>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? dict.close : dict.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>
      <div className="wrap mobile-nav" id="mobile-nav" data-open={open} onClick={close}>
        {items.map((it) => (
          <Link key={it.key} href={href(locale, it.key)}>
            {it.label}
          </Link>
        ))}
        <Link href={href(locale, 'about')}>{dict.about}</Link>
        <Link href={href(locale, 'samples')}>{dict.samples}</Link>
        <Link className="btn btn--primary" href={href(locale, 'partners')}>
          {dict.cta}
        </Link>
      </div>
    </header>
  )
}
