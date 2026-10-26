import { Suspense, type ReactNode } from 'react'

import type { SpecTemplate } from '../lib/constants'
import type { Dict } from '../lib/i18n'
import { fmtNumber, LIST_COLUMNS, toRows } from '../lib/specs'
import type { Variant } from '../payload-types'
import { VariantTable } from './VariantTable'

type Props = { template: SpecTemplate; variants: Variant[]; dict: Dict; locale: 'vi' | 'en'; caption: string }

/**
 * Bảng quy cách theo kiểu trình bày của Catalog RENCO 2026 v3.0.
 * Số chưa được công bố (API không trả, BR-04) hiện "Đang cập nhật"; "—" chỉ dùng cho cỡ không sản xuất, như catalog.
 */
export function ProductSpecs({ template, variants, dict, locale, caption }: Props) {
  const list = LIST_COLUMNS[template]
  if (list) {
    return (
      <Suspense>
        <VariantTable rows={toRows(variants, list)} columns={list.map((c) => c.key)} dict={dict} locale={locale} filterable caption={caption} />
      </Suspense>
    )
  }
  if (template === 'pressure_pipe' || template === 'drain_pipe') return <SpecMatrix template={template} variants={variants} dict={dict} locale={locale} caption={caption} />
  if (template === 'fitting') {
    return (
      <div className="table-wrap">
        <table className="spec spec--compact">
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{dict.common.code}</th>
              <th scope="col">{dict.spec.fittingName}</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.sku}>
                <th scope="row">{v.sku}</th>
                <td>{v.sizeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  // gutter_liner: hai cột độc lập, kết hợp tự do theo đơn hàng.
  const pending = <span className="pending">{dict.common.updating}</span>
  const cell = (n: number | null | undefined, dp: number) => (n == null ? pending : fmtNumber(n, locale, dp))
  return (
    <Wrap note={dict.spec.linerNote} pendingNote={variants.some((v) => v.lengthM == null || v.widthMm == null) ? dict.spec.pendingNote : null}>
      <table className="spec spec--compact">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="num">
              {dict.spec.linerLength}
            </th>
            <th scope="col" className="num">
              {dict.spec.widthCm}
            </th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v.sku}>
              <td className="num">{cell(v.lengthM, 2)}</td>
              <td className="num">{cell(v.widthMm == null ? null : v.widthMm / 10, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Wrap>
  )
}

function Wrap({ children, note, pendingNote }: { children: ReactNode; note?: string; pendingNote?: string | null }) {
  return (
    <div>
      <div className="table-wrap">{children}</div>
      {note ? <p className="small muted" style={{ marginTop: 12 }}>{note}</p> : null}
      {pendingNote ? <p className="small muted" style={{ marginTop: 12 }}>{pendingNote}</p> : null}
    </div>
  )
}

/** Ma trận như catalog: dòng = dn (tên cỡ), cột = dãy S hoặc Class, ô = chiều dày thành ống. */
function SpecMatrix({ template, variants, dict, locale, caption }: Props & { template: 'pressure_pipe' | 'drain_pipe' }) {
  const pressure = template === 'pressure_pipe'
  const colOf = (v: Variant) => (pressure ? (v.pipeSeries == null ? null : String(v.pipeSeries)) : (v.wallClass ?? null))
  const cols = Array.from(new Set(variants.map(colOf).filter((c): c is string => c != null))).sort((a, b) => (pressure ? Number(a) - Number(b) : a.localeCompare(b)))
  const sizes = Array.from(new Set(variants.map((v) => v.sizeLabel)))
  const at = new Map(variants.map((v) => [`${v.sizeLabel}|${colOf(v)}`, v]))
  // Ma trận nhiều ô: dùng chữ ngắn "Chờ" thay "Đang cập nhật" cho dễ đọc; chú thích ngay dưới bảng.
  const pending = <span className="pending">{dict.spec.pendingShort}</span>
  const colLabel = (c: string) => (pressure ? `S ${fmtNumber(Number(c), locale)}` : `Class ${c}`)
  const hasPending = variants.some((v) => v.eMm == null)

  // PN theo dãy S, chia hai nhóm dn ≤ 90 và dn > 90 (TCVN 8491-2:2011, hệ số C khác nhau).
  const pnRow = (small: boolean) =>
    cols.map((c) => {
      const v = variants.find((x) => colOf(x) === c && Number(x.sizeLabel) <= 90 === small && x.pnBar != null)
      return v?.pnBar
    })
  const pnRows = pressure
    ? [
        { label: dict.spec.pnSmall, values: pnRow(true) },
        { label: dict.spec.pnLarge, values: pnRow(false) },
      ]
    : []

  return (
    <Wrap note={pressure ? dict.spec.pressureNote : dict.spec.drainNote} pendingNote={hasPending ? dict.spec.pendingShortNote : null}>
      <table className={`spec spec--matrix${pressure ? '' : ' spec--compact'}`}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{pressure ? 'dn (mm)' : dict.spec.odMm}</th>
            {cols.map((c) => (
              <th key={c} scope="col" className="num">
                {colLabel(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((s) => (
            <tr key={s}>
              <th scope="row">{s}</th>
              {cols.map((c) => {
                const v = at.get(`${s}|${c}`)
                return (
                  <td key={c} className="num">
                    {!v ? '—' : v.eMm == null ? pending : fmtNumber(v.eMm, locale, 1)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        {pnRows.length ? (
          <tfoot>
            {pnRows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {r.values.map((n, i) => (
                  <td key={cols[i]} className="num">
                    {n == null ? pending : fmtNumber(n, locale)}
                  </td>
                ))}
              </tr>
            ))}
          </tfoot>
        ) : null}
      </table>
    </Wrap>
  )
}
