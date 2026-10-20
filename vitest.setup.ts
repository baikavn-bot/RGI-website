// Test tích hợp chạy trên cơ sở dữ liệu riêng (TEST_DATABASE_URL), không đụng dữ liệu dev.
// Test XOÁ SẠCH lead, người dùng, sản phẩm… trước khi chạy, nên phải chặn trước khi kết nối:
// thiếu TEST_DATABASE_URL, hoặc tên database không kết thúc bằng "_test", thì dừng ngay.
import 'dotenv/config'

const testUrl = process.env.TEST_DATABASE_URL
if (!testUrl) {
  throw new Error(
    'Dừng test: chưa có TEST_DATABASE_URL. Test tích hợp xoá sạch dữ liệu của database nó kết nối, ' +
      'nên phải trỏ tới một database riêng cho test (tên kết thúc bằng "_test"), ví dụ .../renco_test.',
  )
}
let dbName = ''
try {
  dbName = decodeURIComponent(new URL(testUrl).pathname.replace(/^\//, ''))
} catch {
  throw new Error('Dừng test: TEST_DATABASE_URL không phải đường dẫn database hợp lệ.')
}
if (!dbName.endsWith('_test')) {
  throw new Error(
    `Dừng test: database "${dbName}" không có đuôi "_test". Test xoá sạch dữ liệu nên chỉ chạy trên database riêng cho test.`,
  )
}

process.env.DATABASE_URL = testUrl
process.env.DISABLE_JOBS = 'true'
process.env.DISABLE_REVALIDATE = 'true'
process.env.PAYLOAD_SECRET ||= 'test-secret-0123456789'
process.env.TOTP_DISABLED = 'true'
