import crypto from 'crypto'

/**
 * Giới hạn tần suất trong bộ nhớ (một tiến trình). Khi chạy nhiều tiến trình, thay bằng Redis.
 * Mặc định [ĐX]: 5 lần mỗi 10 phút mỗi IP cho form công khai.
 */
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000)
    buckets.set(key, hits)
    return { ok: false, retryAfter }
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k)
  }
  return { ok: true, retryAfter: 0 }
}

export function resetRateLimits() {
  buckets.clear()
}

/**
 * IP người gửi. Ưu tiên X-Real-IP do Caddy đặt (deploy/Caddyfile), rồi tới phần tử CUỐI của
 * X-Forwarded-For (do proxy gần nhất thêm vào). Phần tử đầu do trình duyệt tự khai nên không tin.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get('x-real-ip')
  if (real) return real.trim()
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',').at(-1)!.trim()
  return 'unknown'
}

/** Băm IP để lưu làm bằng chứng đồng ý mà không giữ IP gốc. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || process.env.PAYLOAD_SECRET || ''
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

const signingSecret = () => process.env.DOWNLOAD_SIGNING_SECRET || process.env.PAYLOAD_SECRET || ''

/** Liên kết tải có chữ ký cho tài liệu gated (BR-07). Mặc định hết hạn sau 24 giờ [ĐX]. */
export function signDownload(docId: string | number, ttlSeconds = 24 * 3600): { exp: number; sig: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = crypto.createHmac('sha256', signingSecret()).update(`${docId}.${exp}`).digest('hex')
  return { exp, sig }
}

export function verifyDownload(docId: string | number, exp: number, sig: string): boolean {
  if (!exp || !sig || exp < Math.floor(Date.now() / 1000)) return false
  const expected = crypto.createHmac('sha256', signingSecret()).update(`${docId}.${exp}`).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(sig)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Mã yêu cầu hiển thị cho khách, ví dụ RC-2610-4F7K. */
export function refCode(prefix = 'RC'): string {
  const d = new Date()
  const yymm = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let tail = ''
  const bytes = crypto.randomBytes(4)
  for (const b of bytes) tail += alphabet[b % alphabet.length]
  return `${prefix}-${yymm}-${tail}`
}

/**
 * Xác minh Cloudflare Turnstile. Production bắt buộc có TURNSTILE_SECRET_KEY (thiếu thì từ chối mọi form,
 * để không biến form thành nơi gửi thư rác). Dev, test, staging có thể đặt TURNSTILE_OPTIONAL=true.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return process.env.NODE_ENV !== 'production' || process.env.TURNSTILE_OPTIONAL === 'true'
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    const json = (await res.json()) as { success?: boolean }
    return !!json.success
  } catch {
    return false
  }
}

/** Số ngày làm việc (thứ Hai – thứ Sáu) đã trôi qua kể từ một mốc. */
export function businessDaysSince(from: Date, to: Date = new Date()): number {
  if (to <= from) return 0
  let days = 0
  const cursor = new Date(from)
  while (true) {
    cursor.setDate(cursor.getDate() + 1)
    if (cursor > to) break
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) days++
  }
  return days
}
