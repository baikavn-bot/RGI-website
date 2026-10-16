'use client'

import { useState } from 'react'

import { DATA_REQUEST_KINDS, type Locale } from '../lib/constants'
import type { Dict } from '../lib/i18n'

/** Mẫu yêu cầu của chủ thể dữ liệu (WB02). */
export function DataRequestForm({ locale, dict }: { locale: Locale; dict: Pick<Dict, 'dsr' | 'form' | 'errors'> }) {
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; ref?: string; errors?: Record<string, string> }>({ status: 'idle' })

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setState({ status: 'sending' })
    try {
      const res = await fetch('/api/data-requests/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(fd.entries()), locale }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) return setState({ status: 'done', ref: json.refCode })
      setState({ status: 'error', errors: json?.error?.fields })
    } catch {
      setState({ status: 'error' })
    }
  }

  if (state.status === 'done') {
    return (
      <p className="alert alert--ok" role="status">
        {dict.dsr.done}: <strong>{state.ref}</strong>
      </p>
    )
  }

  const err = (k: string) => (state.errors?.[k] ? (dict.errors[state.errors[k]] ?? state.errors[k]) : undefined)

  return (
    <form className="form form-card" onSubmit={onSubmit} noValidate id="yeu-cau-du-lieu">
      <div className="field full">
        <label htmlFor="dsr-kind">{dict.dsr.kind}</label>
        <select id="dsr-kind" name="kind" required defaultValue="access">
          {DATA_REQUEST_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label[locale]}
            </option>
          ))}
        </select>
      </div>
      <div className="field" data-invalid={!!err('contactName')}>
        <label htmlFor="dsr-name">{dict.form.contactName}</label>
        <input id="dsr-name" name="contactName" required autoComplete="name" maxLength={80} />
        {err('contactName') ? <span className="error" role="alert">{err('contactName')}</span> : null}
      </div>
      <div className="field" data-invalid={!!err('contact')}>
        <label htmlFor="dsr-contact">{dict.dsr.contact}</label>
        <input id="dsr-contact" name="contact" required maxLength={254} />
        {err('contact') ? <span className="error" role="alert">{err('contact')}</span> : null}
      </div>
      <div className="field full">
        <label htmlFor="dsr-detail">
          {dict.dsr.detail} <span className="opt">({dict.form.optional})</span>
        </label>
        <textarea id="dsr-detail" name="detail" rows={3} maxLength={1000} />
      </div>
      <div className="trap" aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.status === 'error' ? (
        <p className="full alert alert--error" role="alert">
          {state.errors ? dict.form.fixErrors : dict.form.serverError}
        </p>
      ) : null}
      <div className="full">
        <button className="btn btn--primary" type="submit" disabled={state.status === 'sending'}>
          {state.status === 'sending' ? dict.form.submitting : dict.form.submit}
        </button>
      </div>
    </form>
  )
}
