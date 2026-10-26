'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { Dict } from '../lib/i18n'
import { fmtValue, type SpecValue } from '../lib/specs'

export type VariantRow = {
  sku: string
  sizeLabel: string
  values: Record<string, SpecValue>
  color?: string | null
}

type Props = {
  rows: VariantRow[]
  columns: string[]
  dict: Dict
  filterable?: boolean
  caption: string
  locale: 'vi' | 'en'
}

/**
 * Bảng quy cách. Số chưa xác nhận (API không trả) hiện "Đang cập nhật" — không để ô trống, không để gạch (BR-04).
 * Bộ lọc cỡ lưu trên URL (?co=...) để chia sẻ được đường dẫn.
 */
export function VariantTable({ rows, columns, dict, filterable, caption, locale }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const sizeFilter = params.get('co')
  const sizes = Array.from(new Set(rows.map((r) => r.sizeLabel)))
  const shown = sizeFilter ? rows.filter((r) => r.sizeLabel === sizeFilter) : rows

  const setFilter = (v: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (v) next.set('co', v)
    else next.delete('co')
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false })
  }

  const label = (c: string) => (dict.spec as Record<string, string>)[c] ?? c
  const hasPending = rows.some((r) => columns.some((c) => r.values[c]?.min == null))

  return (
    <div>
      {filterable && sizes.length > 4 ? (
        <div className="filters" role="group" aria-label={dict.common.filterBy}>
          <button type="button" className="chip" aria-pressed={!sizeFilter} onClick={() => setFilter(null)}>
            {dict.common.filterAll}
          </button>
          {sizes.map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={sizeFilter === s} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      ) : null}
      {shown.length === 0 ? (
        <div className="empty">
          <p>{dict.common.noMatch}</p>
          <button type="button" className="btn btn--ghost" onClick={() => setFilter(null)}>
            {dict.common.clear}
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="spec">
            <caption className="visually-hidden">{caption}</caption>
            <thead>
              <tr>
                <th scope="col">{dict.common.code}</th>
                <th scope="col">{dict.common.size}</th>
                {columns.map((c) => (
                  <th key={c} scope="col">
                    {label(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.sku}>
                  <th scope="row">{r.sku}</th>
                  <td>{r.sizeLabel}</td>
                  {columns.map((c) => {
                    const v = r.values[c] ? fmtValue(r.values[c], locale) : null
                    return (
                      <td key={c} className={v != null ? 'num' : undefined}>
                        {v ?? <span className="pending">{dict.common.updating}</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasPending ? <p className="small muted" style={{ marginTop: 12 }}>{dict.spec.pendingNote}</p> : null}
    </div>
  )
}
