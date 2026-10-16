import Link from 'next/link'

import type { Locale } from '../lib/constants'
import type { Dict } from '../lib/i18n'
import { href } from '../lib/routes'
import { normalizePhone } from '../lib/validators'
import type { Setting } from '../payload-types'
import { Icon } from './Icon'

/** Thanh liên hệ cố định ở đáy màn hình điện thoại: Gọi · Zalo · Báo giá (UR-4). */
export function ActionBar({ locale, dict, settings }: { locale: Locale; dict: Dict; settings: Setting }) {
  const phone = normalizePhone(settings.hotline ?? '') ?? settings.hotline
  return (
    <nav className="action-bar" aria-label={locale === 'vi' ? 'Liên hệ nhanh' : 'Quick contact'} style={settings.zaloUrl ? undefined : { gridTemplateColumns: '1fr 1fr' }}>
      <a href={`tel:${phone}`}>
        <Icon name="phone" />
        {dict.common.call}
      </a>
      {settings.zaloUrl ? (
        <a href={settings.zaloUrl} target="_blank" rel="noopener">
          <Icon name="chat" />
          {dict.common.zalo}
        </a>
      ) : null}
      <Link href={`${href(locale, 'partners')}#cong-trinh`}>
        <Icon name="quote" />
        {dict.common.quote}
      </Link>
    </nav>
  )
}
