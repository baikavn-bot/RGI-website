import './fonts.css'
import './styles.css'

import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'

import { ActionBar } from '../../../components/ActionBar'
import { Footer } from '../../../components/Footer'
import { Header } from '../../../components/Header'
import { getSettings } from '../../../lib/data'
import { t } from '../../../lib/i18n'
import { siteUrl } from '../../../lib/routes'
import { isLocale } from '../../../lib/seo'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f5f7f3',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  icons: { icon: '/brand/icon.svg' },
}

// Trang dựng ở server theo từng lượt xem; dữ liệu đọc qua cache gắn thẻ "site" (lib/data.ts),
// nên build không cần kết nối cơ sở dữ liệu và nội dung mới hiện ngay sau khi xuất bản.
export const dynamic = 'force-dynamic'

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = t(lang)
  const settings = await getSettings(lang)

  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.companyName,
    brand: { '@type': 'Brand', name: 'RENCO' },
    url: siteUrl(),
    logo: `${siteUrl()}/brand/logo-full.svg`,
    taxID: settings.taxCode,
    telephone: settings.hotline,
    email: settings.email,
    address: { '@type': 'PostalAddress', streetAddress: settings.address, addressCountry: 'VN' },
  }

  return (
    <html lang={lang}>
      <body>
        <Header locale={lang} dict={dict.nav} />
        <main id="main">{children}</main>
        <Footer locale={lang} dict={dict} settings={settings} />
        <ActionBar locale={lang} dict={dict} settings={settings} />
        {process.env.NEXT_PUBLIC_UMAMI_SRC && process.env.NEXT_PUBLIC_UMAMI_ID ? (
          // Đo lường không cookie (Umami tự lưu trữ) — không cần hộp đồng ý cookie (mục 16, 19.3).
          <Script src={process.env.NEXT_PUBLIC_UMAMI_SRC} data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID} strategy="afterInteractive" />
        ) : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, '\\u003c') }} />
      </body>
    </html>
  )
}
