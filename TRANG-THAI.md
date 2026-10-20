# TRẠNG THÁI DỰ ÁN — đọc file này đầu tiên mỗi phiên

*Cập nhật **20/10/2026** · Ai sửa trạng thái thì sửa ngày ở dòng này. Chỉ sửa qua Pull Request.*

Ký hiệu: **[xác minh dd/mm]** = đã mở ra kiểm, có ngày · **[suy luận]** = suy ra, chưa kiểm · **[CẦN XÁC NHẬN]** = chờ người trả lời.

## 1. Tóm tắt

MVP v0.1 website renco.vn đã có mã đầy đủ trên GitHub (16/10/2026) và **đã chạy được trên máy Thắng** (20/10/2026, dữ liệu mẫu). **Chưa triển khai lên máy chủ nào.** Từ 20/10/2026 **Thắng và Tèo tiếp quản**; Tèo là người duy nhất trực tiếp sửa mã.

**`main` đã khoá** (ruleset `bao-ve-main`): chỉ gộp qua PR, job CI `check` phải xanh, cấm xoá nhánh và ghi đè lịch sử [xác minh 20/10 — API GitHub].

**Giao diện sẽ dựng lại theo bộ 2 «Web v2»** (Figma page 31 – 32, Thắng chốt 20/10). Bộ 1 (page 29 – 30) chỉ còn là nền token và component. Giao diện đang có trong mã gần với bộ 1, khác hẳn bộ 2 [xác minh 20/10 — chụp màn 1440/375 so với Figma].

## 2. Đã xong

| Việc | Ngày | Mức xác minh |
| --- | --- | --- |
| Mã MVP v0.1 lên `main` (3 commit, danh tính BAIKA) | 16/10 | [xác minh 18/10 — git log] |
| Kiểm toán ban đầu chỉ đọc (báo cáo `docs/08-handoff/AUDIT.md`, chỉ trên máy) | 18/10 | [xác minh 18/10] |
| Chốt Figma «RENCO — Copy» page 28 – 32 làm nguồn chân lý giao diện; chốt dựng theo bộ 2 | 20/10 | Thắng chốt. [xác minh 20/10 — đọc được cả 5 page, bảng ở `CLAUDE.md` mục 3] |
| PR #1: bộ luật Claude Code (`CLAUDE.md`, `.claude/settings.json`, file này), README + HANDOVER bỏ chữ «Blueprint» | 20/10 | Đã gộp [xác minh 20/10 — GitHub] |
| Chạy thử trên máy: PostgreSQL bằng Docker, `pnpm dev`, `pnpm seed`; mọi trang chính trả 200 | 20/10 | [xác minh 20/10] |
| PR #2: ghi rõ pnpm 10.34.7; tách `pnpm audit` thành job riêng | 20/10 | Đã gộp. CI lần đầu chạy được: `check`, `e2e` xanh; `audit` đỏ (chờ bản vá) [xác minh 20/10 — GitHub] |
| PR #3: trang không còn sập (500) khi Cài đặt chưa có hotline — trước đó 13 trang tiếng Việt, 3 trang tiếng Anh sập trên database mới | 20/10 | Đã gộp. Thử trên database trống: hết lỗi 500 [xác minh 20/10] |
| Khoá `main`: ruleset `bao-ve-main` có hiệu lực, bắt buộc PR + job `check` | 20/10 | [xác minh 20/10 — API GitHub thấy 4 luật: deletion, non_fast_forward, pull_request, required_status_checks = `check`] |
| PR #4: `test:int` tự dừng khi thiếu `TEST_DATABASE_URL` hoặc tên database không có đuôi `_test`; `.gitignore` chặn mọi `.env.*` (trừ `.env.example`) và file sao lưu | 20/10 | Đã gộp. Đã thử: cả 2 trường hợp sai đều bị chặn trước khi kết nối, DB dev nguyên vẹn [xác minh 20/10] |
| Chạy thử bản production trên máy: build ảnh từ `Dockerfile` (khoảng 1 phút, ảnh 364 MB, đúng pnpm 10.34.7), chạy với database trống, không Caddy, không seed | 20/10 | [xác minh 20/10] Migration tự chạy đủ 2 bản (48 bảng); `/api/health` ok; trang công khai không còn 500 (trang chưa có nội dung CMS trả 404); `SITE_ENV=staging` → robots chặn toàn bộ; có CSP, `x-frame-options`, `/admin` có `noindex`; API lead, người dùng, xuất CSV trả 403 khi chưa đăng nhập; form bị từ chối (`captcha_failed`) khi production chưa có khoá Turnstile, không lưu lead. Đã dọn sạch sau khi thử |

## 3. Đang dở / rủi ro đã biết

| # | Việc | Mức | Trạng thái |
| --- | --- | --- | --- |
| 1 | Lỗ hổng `braces` (GHSA-vfj7-8cjw-p6xm, qua `@payloadcms/next › sass › chokidar`) mức cao, **chưa có bản vá** | 🟡 | Thắng chốt: **không bỏ qua**, để job `audit` đỏ, theo dõi tới khi có bản vá. Mỗi phiên kiểm: `npx -y pnpm@10.34.7 audit --prod --audit-level=high` [xác minh 20/10] |
| 2 | RUNBOOK quay lui gắn nhãn sai; `backup.sh` ghi cứng tên ổ dữ liệu; chưa diễn tập khôi phục | 🔴 | Chưa sửa [xác minh 18/10] |
| 3 | Form tạo tài khoản đầu tiên (`/admin` trên database mới) để ô **Vai trò mặc định là Sales**. Quên đổi sang Giám đốc thì tài khoản đầu tiên không tạo được người dùng khác, phải sửa thẳng trong database | 🟡 | Chọn «Giám đốc» thì lưu đúng [xác minh 20/10]. Cần ghi vào RUNBOOK mục 2; cân nhắc đổi mặc định khi chưa có người dùng nào |
| 3b | Trang chủ trên database trống còn khối trống (ảnh hero, khối Nhà máy), số «750 tấn» viết cứng trong mã, chân trang hiện nhãn «Mã số doanh nghiệp:», «Trụ sở:», «Email:» không có giá trị | 🟢 | Không sập; xử lý khi dựng bộ 2 [xác minh 20/10 — chụp màn bản production] |
| 4 | `ADMIN_ALLOW_IPS` mặc định mở mọi IP; chặn IP không phủ `/api/users/login` | 🟡 | Chưa sửa [xác minh 18/10] |
| 5 | Seed chỉ chặn khi `NODE_ENV=production` | 🟡 | Chưa sửa [xác minh 18/10] |
| 6 | Chế độ dev lưu cache dữ liệu trên ổ đĩa (`.next/dev/cache/fetch-cache`), khởi động lại không xoá. Đổi database hoặc seed lại thì trang vẫn hiện dữ liệu cũ (từng gây lỗi 500 giả và 404 giả) | 🟢 | Cách xử lý: dừng dev, xoá thư mục `.next/dev/cache/fetch-cache`, bật lại dev [xác minh 20/10] |
| 7 | `pnpm dev` sinh lại `src/payload-types.ts` khác bản commit (mất trường `hasTotp`) | 🟢 | Không commit bản sinh lại; tìm nguyên nhân khi đụng tới phần 2FA [xác minh 20/10] |
| 8 | Trang chưa có nội dung trong CMS trả 404 (database mới) | 🟢 | Đúng hành vi mong muốn; ghi ở `docs/HANDOVER.md` mục 6 [xác minh 20/10] |

Chi tiết, cách sửa: `docs/08-handoff/AUDIT.md` mục 5 (chỉ trên máy).

## 4. Tiếp theo (Thắng duyệt thứ tự 20/10)

1. PR sửa `backup.sh` + RUNBOOK (gồm: gắn nhãn `prev` trước khi build; ghi chọn «Giám đốc» khi tạo tài khoản đầu tiên).
2. Lên VPS test (chỉ dữ liệu mẫu, không nhận lead thật) → diễn tập sao lưu, khôi phục.
3. Dựng giao diện bộ 2 «Web v2».

## 5. Việc RGI phải làm trước ra mắt

Xem `docs/HANDOVER.md` mục 6 (không chép lại ở đây để tránh hai bản lệch nhau). Nội dung thật do RGI nhập thẳng trên máy chủ thật (Thắng chốt 20/10).
