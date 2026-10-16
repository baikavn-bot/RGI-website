# renco.vn — Website thương hiệu RENCO

Mã nguồn MVP website renco.vn của Công ty TNHH Renvindo Greenplast International (RGI), dựng theo Blueprint website renco.vn bản 0.1 (16/10/2026).

Giai đoạn 1: website giới thiệu song ngữ Việt – Anh, thu yêu cầu hợp tác từ ba kênh B2B. Không có giá, giỏ hàng, đặt hàng. Mô hình dữ liệu và phân quyền đã chừa chỗ cho cổng đối tác giai đoạn 2.

## Công nghệ

| Phần | Công nghệ |
| --- | --- |
| Giao diện + quản trị + API | Next.js 16 (App Router) + Payload CMS 3.91, một ứng dụng TypeScript |
| Cơ sở dữ liệu | PostgreSQL 16, migration có phiên bản (`src/migrations`) |
| Xác thực hai lớp | `payload-totp`, bắt buộc với mọi tài khoản nội bộ |
| Email | SMTP (nodemailer), gửi qua hàng đợi tác vụ của Payload |
| Triển khai | Docker Compose: web + PostgreSQL + Caddy (HTTPS tự động) |
| Test | Vitest (quy tắc nghiệp vụ, phân quyền), Playwright (giao diện, form) |

## Chạy trên máy

Cần Node 22, pnpm 10, PostgreSQL 16.

```bash
cp .env.example .env          # sửa DATABASE_URL, PAYLOAD_SECRET; SITE_ENV=development
pnpm install
pnpm dev                      # lần đầu Payload tự tạo bảng ở chế độ dev
pnpm seed                     # nạp dữ liệu mẫu + 7 tài khoản mẫu (ghi vào .seed-credentials)
```

- Website: http://localhost:3000 (tiếng Việt), http://localhost:3000/en (tiếng Anh)
- Quản trị: http://localhost:3000/admin — lần đăng nhập đầu phải quét mã QR bằng Google Authenticator hoặc ứng dụng tương tự.

## Test

```bash
pnpm typecheck
pnpm test:int     # 41 test: BR-01 – BR-10, phân quyền, form, dữ liệu cá nhân (cần TEST_DATABASE_URL)
pnpm test:e2e     # 17 test giao diện, form, bảo mật trên máy chủ đang chạy (đã seed)
```

Bảng đối chiếu test với mục 21 blueprint: `docs/HANDOVER.md`.

## Triển khai production

Xem `docs/RUNBOOK.md`. Tóm tắt:

```bash
cp .env.example .env                 # điền giá trị thật
docker compose up -d --build         # migration tự chạy khi web khởi động
```

Tài khoản Giám đốc đầu tiên tạo qua `/admin` ngay sau khi web chạy; lần đăng nhập đầu bắt buộc cài mã 2FA.

Production phải có `TURNSTILE_SECRET_KEY`. Thiếu khoá thì mọi form bị từ chối. Staging chưa có khoá có thể đặt `TURNSTILE_OPTIONAL=true`.

## Cấu trúc thư mục

```
src/
  access/            phân quyền theo vai trò (mục 3)
  collections/       mô hình dữ liệu (mục 9) + quy tắc BR-01 – BR-10 (mục 10)
  endpoints/         API tự viết: nhận form, xuất CSV, tải tài liệu, health
  hooks/             nhật ký, cổng duyệt Pháp chế, làm mới cache
  jobs/              email lead, nhắc lead quá hạn, hạn hồ sơ hợp quy, ẩn danh hoá
  lib/               hằng số, schema form dùng chung, chữ giao diện Việt – Anh, đường dẫn
  components/        giao diện website và bảng tổng quan quản trị
  app/(frontend)/    các trang công khai (/[lang]/...)
  app/(payload)/     trang quản trị và REST API của Payload
  proxy.ts           đổi đường dẫn tiếng Việt (/san-pham → /vi/products), tiêu đề bảo mật
  seed/              dữ liệu mẫu và ảnh
tests/               unit, int, e2e
deploy/Caddyfile     reverse proxy, HTTPS, chặn /admin theo IP
scripts/backup.sh    sao lưu hằng ngày
docs/                bàn giao, sổ tay vận hành, hướng dẫn biên tập
```

## Những điều cần biết trước khi sửa

- Quy tắc nghiệp vụ nằm ở backend (hook của collection). Giao diện chỉ hiển thị kết quả.
- Không bao giờ hiện nhãn "Hợp quy" bằng cách sửa giao diện: nhãn chỉ hiện khi API trả hồ sơ hợp quy đã duyệt, còn hạn và sản phẩm đang bán.
- Số liệu quy cách có trạng thái `proposed` không đi ra API công khai. Muốn hiện số, Pháp chế chuyển sang `factory_confirmed`.
- Chữ trên khung giao diện ở `src/lib/i18n.ts`; chữ trên trang ở CMS.
