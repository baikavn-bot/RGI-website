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
  // Chưa có hotline hoặc Zalo thì bỏ nút đó, các nút còn lại chia đều chiều ngang.
  const buttons = 1 + (phone ? 1 : 0) + (settings.zaloUrl ? 1 : 0)
  return (
    <nav className="action-bar" aria-label={locale === 'vi' ? 'Liên hệ nhanh' : 'Quick contact'} style={buttons === 3 ? undefined : { gridTemplateColumns: `repeat(${buttons}, 1fr)` }}>
      {phone ? (
        <a href={`tel:${phone}`}>
          <Icon name="phone" />
          {dict.common.call}
        </a>
      ) : null}
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
