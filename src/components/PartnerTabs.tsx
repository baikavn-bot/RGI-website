'use client'

import { useEffect, useState } from 'react'

import type { LeadType, Locale } from '../lib/constants'
import type { Dict } from '../lib/i18n'
import { LeadForm } from './LeadForm'

const TABS: { type: LeadType; anchor: string }[] = [
  { type: 'distributor', anchor: 'nha-phan-phoi' },
  { type: 'retailer', anchor: 'cua-hang' },
  { type: 'contractor', anchor: 'cong-trinh' },
]

type Props = {
  locale: Locale
  dict: Pick<Dict, 'form' | 'errors' | 'forms'>
  labels: Record<string, string>
  lines: { code: string; name: string }[]
  consentText: string
  hotline: string
  enabled: Record<string, boolean>
  prefillSkus?: string[]
}

/** Ba khối kênh, mỗi khối một form. Tab đang mở lưu trên URL (#nha-phan-phoi…). */
export function PartnerTabs({ locale, dict, labels, lines, consentText, hotline, enabled, prefillSkus }: Props) {
  const tabs = TABS.filter((t) => enabled[t.type] !== false)
  const [active, setActive] = useState<LeadType>(prefillSkus?.length ? 'contractor' : (tabs[0]?.type ?? 'distributor'))

  useEffect(() => {
    const fromHash = () => {
      const hit = TABS.find((t) => `#${t.anchor}` === window.location.hash)
      if (hit) setActive(hit.type)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  const select = (t: (typeof TABS)[number]) => {
    setActive(t.type)
    history.replaceState(null, '', `#${t.anchor}`)
  }

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
    select(next)
    document.getElementById(`tab-${next.anchor}`)?.focus()
  }

  return (
    <div>
      <div className="tabs" role="tablist" aria-label={locale === 'vi' ? 'Chọn kênh hợp tác' : 'Choose a channel'}>
        {tabs.map((t, i) => (
          <button
            key={t.type}
            id={`tab-${t.anchor}`}
            role="tab"
            type="button"
            className="tab"
            aria-selected={active === t.type}
            aria-controls={`panel-${t.anchor}`}
            tabIndex={active === t.type ? 0 : -1}
            onClick={() => select(t)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {labels[t.type]}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.type} id={`panel-${t.anchor}`} role="tabpanel" aria-labelledby={`tab-${t.anchor}`} hidden={active !== t.type}>
          {active === t.type ? (
            <LeadForm
              type={t.type}
              locale={locale}
              dict={dict}
              lines={lines}
              consentText={consentText}
              hotline={hotline}
              prefillSkus={t.type === 'contractor' ? prefillSkus : undefined}
            />
          ) : null}
        </div>
      ))}
      {tabs.length === 0 ? <p className="alert alert--error">{dict.form.disabled}</p> : null}
    </div>
  )
}
