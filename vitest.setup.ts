// Test tích hợp chạy trên cơ sở dữ liệu riêng (TEST_DATABASE_URL), không đụng dữ liệu dev.
import 'dotenv/config'

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
process.env.DISABLE_JOBS = 'true'
process.env.DISABLE_REVALIDATE = 'true'
process.env.PAYLOAD_SECRET ||= 'test-secret-0123456789'
process.env.TOTP_DISABLED = 'true'
