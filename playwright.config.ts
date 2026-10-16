import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/** Test giao diện chạy trên máy chủ đang chạy (dev hoặc staging). Đặt E2E_BASE_URL để trỏ staging. */
export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 120_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    // Máy CI đã cài sẵn Chromium ở chỗ khác: đặt PW_CHROMIUM_PATH thay vì tải trình duyệt mới.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined }, grep: /Website công khai/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'pnpm dev', reuseExistingServer: true, url: 'http://localhost:3000', timeout: 240_000 },
})
