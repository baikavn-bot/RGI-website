import './(frontend)/[lang]/styles.css'

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: '404 · RENCO', robots: { index: false } }

/** 404 cho đường dẫn không khớp tuyến nào (ứng dụng có hai root layout: website và quản trị). */
export default function GlobalNotFound() {
  return (
    <html lang="vi">
      <body>
        <main className="section">
          <div className="wrap" style={{ maxWidth: 720 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-full.svg" alt="RENCO" width={140} height={32} style={{ marginBottom: 32 }} />
            <h1>Không tìm thấy trang</h1>
            <p className="lead">Page not found.</p>
            <div className="btn-row">
              <Link className="btn btn--primary" href="/">
                Về trang chủ
              </Link>
              <Link className="btn btn--ghost" href="/en">
                English
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
