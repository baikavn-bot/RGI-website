/**
 * Nhật ký thay đổi (AuditLog) — chỉ ghi thêm, không ai sửa, xoá (mục 9, 10, 18 blueprint).
 */
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

const IGNORED = new Set([
  'updatedAt',
  'createdAt',
  'hash',
  'salt',
  'password',
  'sessions',
  'resetPasswordToken',
  'resetPasswordExpiration',
  'loginAttempts',
  'lockUntil',
  '_verificationToken',
  // Không bao giờ ghi bí mật xác thực hai lớp vào nhật ký
  'totpSecret',
  'hasTotp',
  'apiKey',
  'enableAPIKey',
])

type Options = {
  /** Trường chứa dữ liệu cá nhân: chỉ ghi "đã đổi", không ghi giá trị. */
  redact?: string[]
}

const normalize = (v: unknown): unknown => {
  if (v && typeof v === 'object' && 'id' in (v as Record<string, unknown>) && !Array.isArray(v))
    return (v as { id: unknown }).id
  if (Array.isArray(v)) return v.map(normalize)
  return v
}

export function diff(before: Record<string, unknown> | undefined, after: Record<string, unknown>, opts: Options = {}) {
  const out: Record<string, { from?: unknown; to?: unknown; changed?: true }> = {}
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  for (const key of keys) {
    if (IGNORED.has(key)) continue
    const a = normalize(before?.[key])
    const b = normalize(after?.[key])
    if (JSON.stringify(a) === JSON.stringify(b)) continue
    out[key] = opts.redact?.includes(key) ? { changed: true } : { from: a ?? null, to: b ?? null }
  }
  return out
}

export async function writeAudit(
  req: PayloadRequest,
  entry: { action: string; collectionSlug: string; docId?: string | number; changes?: unknown; note?: string },
) {
  if (req.context?.skipAudit) return
  const user = req.user as { id: string | number; email?: string } | null
  try {
    await req.payload.create({
      collection: 'audit-logs',
      overrideAccess: true,
      req,
      data: {
        action: entry.action,
        collectionSlug: entry.collectionSlug,
        docId: entry.docId != null ? String(entry.docId) : undefined,
        actor: user && (user as { collection?: string }).collection === 'users' ? (user.id as number) : undefined,
        actorLabel: user?.email ?? 'system',
        changes: (entry.changes ?? {}) as Record<string, unknown>,
        note: entry.note,
      },
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: 'audit log write failed' })
  }
}

export const auditAfterChange =
  (slug: string, opts: Options = {}): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, operation, req }) => {
    const changes = diff(operation === 'create' ? {} : previousDoc, doc, opts)
    if (operation === 'update' && Object.keys(changes).length === 0) return doc
    await writeAudit(req, { action: operation, collectionSlug: slug, docId: doc.id, changes })
    return doc
  }

export const auditAfterDelete =
  (slug: string): CollectionAfterDeleteHook =>
  async ({ doc, req }) => {
    await writeAudit(req, { action: 'delete', collectionSlug: slug, docId: doc.id })
    return doc
  }

export const auditGlobal =
  (slug: string, opts: Options = {}): GlobalAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    const changes = diff(previousDoc, doc, opts)
    if (Object.keys(changes).length) await writeAudit(req, { action: 'update', collectionSlug: `global:${slug}`, changes })
    return doc
  }
