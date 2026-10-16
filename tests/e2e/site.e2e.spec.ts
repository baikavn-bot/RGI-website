/**
 * Test giao diện, luồng form và bảo mật cơ bản (mục 21: T06, T09, T13, T14, T18, T19).
 * Chạy trên máy chủ dev hoặc staging đã nạp dữ liệu mẫu: pnpm seed && pnpm test:e2e
 */
import { expect, test } from '@playwright/test'

test.describe('Website công khai', () => {
  test('trang chủ có H1, năm dòng sản phẩm, chân trang có MST', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('.line-card')).toHaveCount(5)
    await expect(page.locator('footer')).toContainText('0319717793')
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en$/)
  })

  test('T19 · chuyển ngôn ngữ giữ đúng trang sản phẩm', async ({ page }) => {
    await page.goto('/san-pham/ong-mem-pvc/ong-mem-dan-nuoc')
    await page.getByRole('link', { name: /Chuyển sang tiếng Anh/ }).click()
    await expect(page).toHaveURL(/\/en\/products\/pvc-hoses\/water-hose$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('BR-04 · ống uPVC: số chưa xác nhận hiện "Đang cập nhật", không có nút báo giá, không có nhãn Hợp quy', async ({ page }) => {
    await page.goto('/san-pham/ong-upvc/ong-upvc-he-inch')
    await expect(page.locator('table.spec')).toContainText('Đang cập nhật')
    await expect(page.locator('table.spec')).not.toContainText('4,9')
    await expect(page.getByText('Hợp quy', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Nhận báo giá' })).toHaveCount(0)
  })

  test('đường dẫn /vi/... chuyển 301 về đường dẫn tiếng Việt', async ({ request }) => {
    const res = await request.get('/vi/products', { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    expect(res.headers()['location']).toMatch(/\/san-pham$/)
  })

  test('404 có hướng dẫn quay lại', async ({ page }) => {
    const res = await page.goto('/khong-ton-tai')
    expect(res?.status()).toBe(404)
    await expect(page.getByRole('link', { name: 'Về trang chủ' })).toBeVisible()
  })
})

test.describe('Form', () => {
  test('T06 · báo lỗi khi bỏ trống, không gửi khi chưa đồng ý', async ({ page }) => {
    await page.goto('/lien-he')
    await page.getByRole('button', { name: /Gửi yêu cầu/ }).click()
    await expect(page.getByText('Anh/chị nhập họ và tên giúp RENCO.')).toBeVisible()
    await expect(page.getByText('Anh/chị cần đồng ý để RENCO liên hệ lại.')).toBeVisible()
  })

  test('đăng ký nhà phân phối → trang Cảm ơn có mã yêu cầu', async ({ page }) => {
    await page.goto('/hop-tac#nha-phan-phoi')
    const form = page.locator('[role="tabpanel"]:not([hidden]) form')
    await form.getByLabel('Họ và tên').fill('Nguyễn Văn Thử')
    await form.getByLabel('Số điện thoại').fill(`09${Math.floor(10000000 + Math.random() * 89999999)}`)
    await form.getByLabel('Tên doanh nghiệp').fill('NPP Thử Nghiệm')
    await form.getByLabel(/Tỉnh, thành phố/).selectOption('Đồng Nai')
    await form.getByText('Ống mềm PVC').click()
    await form.locator('input[name="consent"]').check()
    await form.getByRole('button', { name: /Gửi yêu cầu/ }).click()
    await expect(page).toHaveURL(/\/cam-on\?ref=RC-/)
    await expect(page.locator('h1')).toContainText('RENCO đã nhận yêu cầu')
  })

  test('T09 · API form: thiếu đồng ý trả 422', async ({ request }) => {
    const res = await request.post('/api/leads/submit', {
      data: { type: 'contact', locale: 'vi', contactName: 'API', phone: '0912000000' },
      headers: { 'x-forwarded-for': '10.0.0.9' },
    })
    expect(res.status()).toBe(422)
    expect((await res.json()).error.code).toBe('consent_required')
  })
})

test.describe('Bảo mật', () => {
  test('T13 · xuất CSV lead khi chưa đăng nhập bị từ chối', async ({ request }) => {
    const res = await request.get('/api/leads/export')
    expect(res.status()).toBe(403)
  })

  test('T12 · API lead không lộ dữ liệu khi chưa đăng nhập', async ({ request }) => {
    const res = await request.get('/api/leads')
    expect([401, 403]).toContain(res.status())
  })

  test('trang quản trị không được index', async ({ request }) => {
    const res = await request.get('/admin/login')
    expect(res.headers()['x-robots-tag']).toContain('noindex')
  })

  test('trang công khai có Content-Security-Policy', async ({ request }) => {
    const res = await request.get('/')
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'self'")
  })
})
