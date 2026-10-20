'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState } from 'react'

import { leadSchema, fieldErrors } from '../lib/schemas'
import type { LeadType, Locale } from '../lib/constants'
import { PROVINCES, SAMPLE_KITS, VOLUME_BANDS } from '../lib/constants'
import type { Dict } from '../lib/i18n'
import { href } from '../lib/routes'
import { Icon } from './Icon'

type Line = { code: string; name: string }

type Props = {
  type: LeadType
  locale: Locale
  dict: Pick<Dict, 'form' | 'errors' | 'forms'>
  lines: Line[]
  consentText: string
  hotline: string
  prefillSkus?: string[]
  showHeading?: boolean
}

type Status = 'idle' | 'sending' | 'network' | 'server' | 'invalid' | 'disabled' | 'rate'

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** Khung một ô nhập. Khai báo ngoài component form để ô không bị dựng lại (mất chữ) khi state đổi. */
function FieldBox(p: {
  fieldId: string
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
  full?: boolean
  error?: string
  optionalLabel: string
}) {
  return (
    <div className={`field${p.full ? ' full' : ''}`} data-invalid={!!p.error}>
      <label htmlFor={p.fieldId}>
        {p.label} {!p.required ? <span className="opt">({p.optionalLabel})</span> : null}
      </label>
      {p.children}
      {p.hint ? (
        <span className="hint" id={`${p.fieldId}-hint`}>
          {p.hint}
        </span>
      ) : null}
      {p.error ? (
        <span className="error" id={`${p.fieldId}-err`} role="alert">
          {p.error}
        </span>
      ) : null}
    </div>
  )
}

/** Form dùng chung cho 5 loại lead (mục 14 blueprint). Kiểm tra khi rời ô và khi gửi; server kiểm lại cùng schema. */
export function LeadForm({ type, locale, dict, lines, consentText, hotline, prefillSkus, showHeading = true }: Props) {
  const router = useRouter()
  const uid = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<Status>('idle')
  const f = dict.form
  const copy = dict.forms[type]
  const isEn = locale === 'en'

  /** Nguồn truy cập (UTM, trang gửi) đọc lúc gửi, không lưu vào state. */
  const sourceMeta = (): Record<string, string> => {
    const p = new URLSearchParams(window.location.search)
    const m: Record<string, string> = {
      utmSource: p.get('utm_source') ?? '',
      utmMedium: p.get('utm_medium') ?? '',
      utmCampaign: p.get('utm_campaign') ?? '',
      sourcePath: window.location.pathname,
      referrer: document.referrer.slice(0, 500),
    }
    return Object.fromEntries(Object.entries(m).filter(([, v]) => v))
  }

  const collect = () => {
    const fd = new FormData(formRef.current!)
    const many = (k: string) => fd.getAll(k).map(String).filter(Boolean)
    const val = (k: string) => {
      const v = fd.get(k)
      return v == null || v === '' ? undefined : String(v)
    }
    const skus = val('skus')
      ?.split(/[,;\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
    return {
      type,
      locale,
      contactName: val('contactName') ?? '',
      phone: val('phone') ?? '',
      email: val('email'),
      country: val('country'),
      province: val('province'),
      position: val('position'),
      company: val('company'),
      taxCode: val('taxCode'),
      interestLines: many('interestLines'),
      interestSkus: skus,
      warehouseArea: val('warehouseArea'),
      projectName: val('projectName'),
      volumeBand: val('volumeBand'),
      neededBy: val('neededBy'),
      kits: many('kits'),
      deliveryAddress: val('deliveryAddress'),
      message: val('message'),
      consent: fd.get('consent') === 'on' ? true : undefined,
      website: val('website') ?? '',
      turnstileToken: val('cf-turnstile-response'),
      ...sourceMeta(),
    }
  }

  const validate = () => {
    const parsed = leadSchema.safeParse(collect())
    return parsed.success ? {} : fieldErrors(parsed.error)
  }

  const onBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    const name = (e.target as unknown as HTMLInputElement).name
    if (!name) return
    const key = name === 'skus' ? 'interestSkus' : name
    setTouched((t) => ({ ...t, [key]: true }))
    const all = validate()
    setErrors((prev) => ({ ...prev, [key]: all[key] ?? '' }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    const all = validate()
    const visible = Object.fromEntries(Object.entries(all).filter(([k]) => k !== 'website'))
    if (Object.keys(visible).length) {
      setErrors(visible)
      setTouched(Object.fromEntries(Object.keys(visible).map((k) => [k, true])))
      setStatus('invalid')
      const first = formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(visible)[0]}"]`)
      first?.focus()
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(collect()),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        ;(window as { umami?: { track: (e: string, d?: object) => void } }).umami?.track('lead_submit', { type, locale })
        router.push(`${href(locale, 'thankYou')}?ref=${encodeURIComponent(json.refCode ?? '')}`)
        return
      }
      if (res.status === 429) return setStatus('rate')
      if (json?.error?.code === 'form_disabled') return setStatus('disabled')
      if (json?.error?.fields) {
        setErrors(json.error.fields)
        return setStatus('invalid')
      }
      setStatus('server')
    } catch {
      setStatus('network')
    }
  }

  const err = (k: string) => (touched[k] || status === 'invalid' ? errors[k] : undefined)
  const msg = (code?: string) => (code ? (dict.errors[code] ?? code) : undefined)
  const id = (k: string) => `${uid}-${k}`

  const aria = (name: string, hint?: boolean) => ({
    id: id(name),
    name,
    'aria-invalid': !!err(name) || undefined,
    'aria-describedby': [err(name) ? `${id(name)}-err` : '', hint ? `${id(name)}-hint` : ''].filter(Boolean).join(' ') || undefined,
  })

  const isCompany = type === 'distributor' || type === 'retailer' || type === 'sample'

  return (
    <div className="form-card">
      {showHeading ? (
        <>
          <h3>{copy.title}</h3>
          <p className="muted">{copy.lead}</p>
        </>
      ) : null}
      {TURNSTILE_KEY ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /> : null}
      <form ref={formRef} className="form" noValidate onSubmit={onSubmit} onBlur={onBlur}>
        <FieldBox fieldId={id('contactName')} error={msg(err('contactName'))} optionalLabel={f.optional} label={f.contactName} required>
          <input {...aria('contactName')} autoComplete="name" required maxLength={80} />
        </FieldBox>
        <FieldBox fieldId={id('phone')} error={msg(err('phone'))} optionalLabel={f.optional} label={f.phone} required>
          <input {...aria('phone')} type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} />
        </FieldBox>

        {isCompany ? (
          <FieldBox fieldId={id('company')} error={msg(err('company'))} optionalLabel={f.optional} label={type === 'retailer' ? f.store : f.company} required>
            <input {...aria('company')} autoComplete="organization" maxLength={200} />
          </FieldBox>
        ) : null}

        {type === 'distributor' ? (
          <FieldBox fieldId={id('position')} error={msg(err('position'))} optionalLabel={f.optional} label={f.position}>
            <input {...aria('position')} autoComplete="organization-title" maxLength={80} />
          </FieldBox>
        ) : null}

        {type !== 'contact' || isEn ? (
          <FieldBox fieldId={id('email')} error={msg(err('email'))} optionalLabel={f.optional} label={f.email} required={isEn}>
            <input {...aria('email')} type="email" autoComplete="email" maxLength={254} />
          </FieldBox>
        ) : null}

        {isEn && type !== 'contact' ? (
          <FieldBox fieldId={id('country')} error={msg(err('country'))} optionalLabel={f.optional} label={f.country} required>
            <input {...aria('country')} autoComplete="country-name" maxLength={60} defaultValue="Vietnam" />
          </FieldBox>
        ) : null}

        {type !== 'contact' ? (
          <FieldBox fieldId={id('province')} error={msg(err('province'))} optionalLabel={f.optional} label={f.province} required={!isEn}>
            <select {...aria('province')} defaultValue="">
              <option value="" disabled>
                {f.provincePick}
              </option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FieldBox>
        ) : null}

        {type === 'distributor' ? (
          <>
            <FieldBox fieldId={id('taxCode')} error={msg(err('taxCode'))} optionalLabel={f.optional} label={f.taxCode}>
              <input {...aria('taxCode')} inputMode="numeric" maxLength={14} />
            </FieldBox>
            <FieldBox fieldId={id('warehouseArea')} error={msg(err('warehouseArea'))} optionalLabel={f.optional} label={f.warehouseArea}>
              <input {...aria('warehouseArea')} type="number" inputMode="numeric" min={0} max={100000} />
            </FieldBox>
          </>
        ) : null}

        {type === 'distributor' || type === 'retailer' ? (
          <fieldset className="field full" data-invalid={!!err('interestLines')}>
            <legend>{f.lines}</legend>
            <div className="checks">
              {lines.map((l) => (
                <label key={l.code} className="check">
                  <input type="checkbox" name="interestLines" value={l.code} />
                  <span>
                    <span className="code">{l.code}</span> {l.name}
                  </span>
                </label>
              ))}
            </div>
            {err('interestLines') ? (
              <span className="error" role="alert">
                {msg(err('interestLines'))}
              </span>
            ) : null}
          </fieldset>
        ) : null}

        {type === 'contractor' ? (
          <>
            <FieldBox fieldId={id('projectName')} error={msg(err('projectName'))} optionalLabel={f.optional} label={f.projectName} required full>
              <input {...aria('projectName')} maxLength={200} />
            </FieldBox>
            <FieldBox fieldId={id('skus')} error={msg(err('skus'))} optionalLabel={f.optional} label={f.skus} hint={f.skusHint} full>
              <input {...aria('skus', true)} defaultValue={prefillSkus?.join(', ')} maxLength={400} />
            </FieldBox>
            <FieldBox fieldId={id('volumeBand')} error={msg(err('volumeBand'))} optionalLabel={f.optional} label={f.volumeBand}>
              <select {...aria('volumeBand')} defaultValue="">
                <option value="">{f.volumePick}</option>
                {VOLUME_BANDS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label[locale]}
                  </option>
                ))}
              </select>
            </FieldBox>
            <FieldBox fieldId={id('neededBy')} error={msg(err('neededBy'))} optionalLabel={f.optional} label={f.neededBy}>
              <input {...aria('neededBy')} type="month" />
            </FieldBox>
          </>
        ) : null}

        {type === 'sample' ? (
          <>
            <fieldset className="field full" data-invalid={!!err('kits')}>
              <legend>{f.kits}</legend>
              <div className="checks checks--stack">
                {SAMPLE_KITS.map((k) => (
                  <label key={k.value} className="check">
                    <input type="checkbox" name="kits" value={k.value} />
                    <span>{k.label[locale]}</span>
                  </label>
                ))}
              </div>
              {err('kits') ? (
                <span className="error" role="alert">
                  {msg(err('kits'))}
                </span>
              ) : null}
            </fieldset>
            <FieldBox fieldId={id('deliveryAddress')} error={msg(err('deliveryAddress'))} optionalLabel={f.optional} label={f.deliveryAddress} required full>
              <textarea {...aria('deliveryAddress')} rows={2} maxLength={250} autoComplete="street-address" />
            </FieldBox>
          </>
        ) : null}

        <FieldBox fieldId={id('message')} error={msg(err('message'))} optionalLabel={f.optional} label={f.message} hint={f.messageHint} full>
          <textarea {...aria('message', true)} maxLength={1000} rows={3} />
        </FieldBox>

        {/* Ô bẫy chống bot: người dùng không thấy, không tab tới */}
        <div className="trap" aria-hidden="true">
          <label htmlFor={id('website')}>Website</label>
          <input id={id('website')} name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="full field" data-invalid={!!err('consent')}>
          <label className="consent" htmlFor={id('consent')}>
            <input id={id('consent')} name="consent" type="checkbox" aria-describedby={err('consent') ? `${id('consent')}-err` : undefined} />
            <span>
              {consentText}{' '}
              <a href={href(locale, 'privacy')} target="_blank" rel="noopener">
                {f.consentLink}
              </a>
            </span>
          </label>
          {err('consent') ? (
            <span className="error" id={`${id('consent')}-err`} role="alert">
              {msg(err('consent'))}
            </span>
          ) : null}
        </div>

        {TURNSTILE_KEY ? <div className="full cf-turnstile" data-sitekey={TURNSTILE_KEY} data-language={locale} /> : null}

        <div className="full" aria-live="polite">
          {status === 'invalid' ? <p className="alert alert--error">{f.fixErrors}</p> : null}
          {status === 'network' ? <p className="alert alert--error">{f.networkError}</p> : null}
          {status === 'server' ? (
            <p className="alert alert--error">
              {f.serverError} {hotline ? <a href={`tel:${hotline.replace(/\s/g, '')}`}>{hotline}</a> : null}
            </p>
          ) : null}
          {status === 'disabled' ? <p className="alert alert--error">{f.disabled}</p> : null}
          {status === 'rate' ? <p className="alert alert--error">{f.rateLimited}</p> : null}
        </div>

        <div className="full">
          <button className="btn btn--primary" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? (
              <>
                <span className="spinner" aria-hidden="true" /> {f.submitting}
              </>
            ) : (
              <>
                {status === 'network' ? f.retry : f.submit} <Icon name="arrow" size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
