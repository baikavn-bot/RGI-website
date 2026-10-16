import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { vi } from '@payloadcms/translations/languages/vi'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadTotp } from 'payload-totp'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { hasRole } from './access'
import { ComplianceRecords } from './collections/ComplianceRecords'
import { Documents } from './collections/Documents'
import { LeadActivities } from './collections/LeadActivities'
import { Leads } from './collections/Leads'
import { Media } from './collections/Media'
import { pageCollections } from './collections/pageCollections'
import { Consents, DataRequests } from './collections/Privacy'
import { ProductLines } from './collections/ProductLines'
import { Products } from './collections/Products'
import { AuditLogs, Redirects } from './collections/System'
import { Users } from './collections/Users'
import { Variants } from './collections/Variants'
import { healthEndpoint } from './endpoints/health'
import { Settings } from './globals/Settings'
import { tasks } from './jobs'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM || 'no-reply@renco.vn',
      defaultFromName: process.env.EMAIL_FROM_NAME || 'RENCO',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      },
    })
  : undefined // chưa cấu hình SMTP: Payload ghi email ra log (chỉ dùng khi dev)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || '',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · Quản trị RENCO' },
    importMap: { baseDir: path.resolve(dirname) },
    dateFormat: 'dd/MM/yyyy HH:mm',
    avatar: 'default',
    components: {
      beforeDashboard: ['/components/admin/Dashboard'],
      graphics: { Logo: '/components/admin/Logo', Icon: '/components/admin/AdminIcon' },
    },
  },
  i18n: {
    supportedLanguages: { vi, en },
    fallbackLanguage: 'vi',
  },
  localization: {
    locales: [
      { code: 'vi', label: 'Tiếng Việt' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'vi',
    fallback: true,
  },
  // Thứ tự ở đây là thứ tự nhóm trên trang quản trị: Bán hàng → Sản phẩm → Nội dung → Dữ liệu cá nhân → Hệ thống.
  collections: [
    Leads,
    LeadActivities,
    ProductLines,
    Products,
    Variants,
    ComplianceRecords,
    ...pageCollections,
    Media,
    Documents,
    Consents,
    DataRequests,
    Users,
    AuditLogs,
    Redirects,
  ],
  globals: [Settings],
  endpoints: [healthEndpoint],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    prodMigrations: migrations,
  }),
  email,
  sharp,
  upload: { limits: { fileSize: 20_000_000 } }, // 20 MB [ĐX]
  cors: [process.env.NEXT_PUBLIC_SITE_URL || ''].filter(Boolean),
  csrf: [process.env.NEXT_PUBLIC_SITE_URL || ''].filter(Boolean),
  graphQL: { disable: true }, // website không dùng GraphQL — bớt một bề mặt tấn công
  jobs: {
    tasks,
    access: {
      run: ({ req }) => hasRole(req, 'director', 'tech'),
      queue: ({ req }) => hasRole(req, 'director', 'tech'),
      cancel: ({ req }) => hasRole(req, 'director', 'tech'),
    },
    deleteJobOnComplete: true,
    autoRun: [
      { cron: '* * * * *', queue: 'default', limit: 20 },
      { cron: '0 * * * *', queue: 'hourly' },
      { cron: '0 1 * * *', queue: 'daily' },
    ],
    shouldAutoRun: () => process.env.DISABLE_JOBS !== 'true',
  },
  telemetry: false,
  plugins: [
    // Xác thực hai lớp bắt buộc cho mọi tài khoản nội bộ (mục 18). Phải đứng cuối danh sách plugin.
    // Chỉ tắt bằng TOTP_DISABLED=true khi chạy test tự động.
    payloadTotp({
      collection: 'users',
      forceSetup: true,
      disabled: process.env.TOTP_DISABLED === 'true',
      totp: { issuer: 'RENCO Admin', digits: 6, period: 30 },
      forceWhiteBackgroundOnQrCode: true,
    }),
  ],
})
