import { type NextRequest, NextResponse } from 'next/server'

import { INTERNAL_TO_VI, VI_TO_INTERNAL } from './lib/routes'

/**
 * Định tuyến đa ngôn ngữ và tiêu đề bảo mật.
 * - /en/...           → giữ nguyên (nội bộ là /en/...)
 * - /san-pham/...     → rewrite /vi/products/...
 * - /vi/products/...  → 301 về /san-pham/... (một nội dung, một URL)
 */
const SKIP = /^\/(admin|api|_next|brand|fonts|favicon|robots\.txt|sitemap\.xml|icon|apple-icon|opengraph-image|manifest)/

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (pathname.startsWith('/admin')) {
    // Plugin xác thực hai lớp cần biết đường dẫn hiện tại để chuyển tới trang nhập mã.
    const headers = new Headers(req.headers)
    headers.set('x-pathname', pathname)
    const res = NextResponse.next({ request: { headers } })
    res.headers.set('x-pathname', pathname)
    res.headers.set('x-robots-tag', 'noindex, nofollow')
    return res
  }
  if (SKIP.test(pathname) || /\.[a-z0-9]{2,5}$/i.test(pathname)) return NextResponse.next()

  if (pathname === '/en' || pathname.startsWith('/en/')) return withHeaders(NextResponse.next())

  if (pathname === '/vi' || pathname.startsWith('/vi/')) {
    const [, , first, ...rest] = pathname.split('/')
    const vi = first ? (INTERNAL_TO_VI[first] ?? first) : ''
    const target = ['', vi, ...rest].join('/') || '/'
    return NextResponse.redirect(new URL(target + search, req.url), 301)
  }

  const [, first, ...rest] = pathname.split('/')
  // /products, /about… (khoá tiếng Anh, thiếu /en) → 301 về đường dẫn tiếng Việt, tránh nội dung trùng.
  if (first && !VI_TO_INTERNAL[first] && INTERNAL_TO_VI[first]) {
    const target = ['', INTERNAL_TO_VI[first], ...rest].join('/')
    return NextResponse.redirect(new URL(target + search, req.url), 301)
  }
  const internal = first ? (VI_TO_INTERNAL[first] ?? first) : ''
  const url = req.nextUrl.clone()
  url.pathname = ['/vi', internal, ...rest].filter((s, i) => i === 0 || s !== '').join('/')
  return withHeaders(NextResponse.rewrite(url))
}

function withHeaders(res: NextResponse) {
  res.headers.set('x-frame-options', 'SAMEORIGIN')
  res.headers.set('x-content-type-options', 'nosniff')
  res.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  res.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
