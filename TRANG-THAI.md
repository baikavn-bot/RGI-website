# TRẠNG THÁI DỰ ÁN — đọc file này đầu tiên mỗi phiên

*Cập nhật **21/10/2026** · Ai sửa trạng thái thì sửa ngày ở dòng này. Chỉ sửa qua Pull Request.*

Ký hiệu: **[xác minh dd/mm]** = đã mở ra kiểm, có ngày · **[suy luận]** = suy ra, chưa kiểm · **[CẦN XÁC NHẬN]** = chờ người trả lời.

## 1. Tóm tắt

MVP v0.1 website renvindo.com đã có mã đầy đủ trên GitHub (16/10/2026), **đã chạy được trên máy Thắng** (20/10/2026) và **đang chạy công khai trên VPS test** (21/10/2026, dữ liệu mẫu, tên miền thử ghi ở `CLAUDE.local.md`). **Chưa có máy chủ production.** Từ 20/10/2026 **Thắng và Tèo tiếp quản**; Tèo là người duy nhất trực tiếp sửa mã.

**`main` đã khoá** (ruleset `bao-ve-main`): chỉ gộp qua PR, job CI `check` phải xanh, cấm xoá nhánh và ghi đè lịch sử [xác minh 20/10 — API GitHub].

**Giao diện: giữ bộ 1 (v1) đang có trong mã để ra mắt** (Thắng chốt 21/10, thay quyết định 20/10). **Không dựng bộ 2 «Web v2»** (page 31 – 32 chỉ còn để tham khảo). Thắng sẽ làm **UI-v3** sau ra mắt. Việc trước mắt: trỏ `renvindo.com` về VPS test (mục 4).

## 2. Đã xong

| Việc | Ngày | Mức xác minh |
| --- | --- | --- |
| Mã MVP v0.1 lên `main` (3 commit, danh tính BAIKA) | 16/10 | [xác minh 18/10 — git log] |
| Kiểm toán ban đầu chỉ đọc (báo cáo `docs/08-handoff/AUDIT.md`, chỉ trên máy) | 18/10 | [xác minh 18/10] |
| Chốt Figma «RENCO — Copy» page 28 – 32 làm nguồn chân lý giao diện; chốt dựng theo bộ 2 (**21/10 đổi: giữ v1, bỏ bộ 2** — mục 1) | 20/10 | Thắng chốt. [xác minh 20/10 — đọc được cả 5 page, bảng ở `CLAUDE.md` mục 3] |
| PR #1: bộ luật Claude Code (`CLAUDE.md`, `.claude/settings.json`, file này), README + HANDOVER bỏ chữ «Blueprint» | 20/10 | Đã gộp [xác minh 20/10 — GitHub] |
| Chạy thử trên máy: PostgreSQL bằng Docker, `pnpm dev`, `pnpm seed`; mọi trang chính trả 200 | 20/10 | [xác minh 20/10] |
| PR #2: ghi rõ pnpm 10.34.7; tách `pnpm audit` thành job riêng | 20/10 | Đã gộp. CI lần đầu chạy được: `check`, `e2e` xanh; `audit` đỏ (chờ bản vá) [xác minh 20/10 — GitHub] |
| PR #3: trang không còn sập (500) khi Cài đặt chưa có hotline — trước đó 13 trang tiếng Việt, 3 trang tiếng Anh sập trên database mới | 20/10 | Đã gộp. Thử trên database trống: hết lỗi 500 [xác minh 20/10] |
| Khoá `main`: ruleset `bao-ve-main` có hiệu lực, bắt buộc PR + job `check` | 20/10 | [xác minh 20/10 — API GitHub thấy 4 luật: deletion, non_fast_forward, pull_request, required_status_checks = `check`] |
| PR #4: `test:int` tự dừng khi thiếu `TEST_DATABASE_URL` hoặc tên database không có đuôi `_test`; `.gitignore` chặn mọi `.env.*` (trừ `.env.example`) và file sao lưu | 20/10 | Đã gộp. Đã thử: cả 2 trường hợp sai đều bị chặn trước khi kết nối, DB dev nguyên vẹn [xác minh 20/10] |
| Chạy thử bản production trên máy: build ảnh từ `Dockerfile` (khoảng 1 phút, ảnh 364 MB, đúng pnpm 10.34.7), chạy với database trống, không Caddy, không seed | 20/10 | [xác minh 20/10] Migration tự chạy đủ 2 bản (48 bảng); `/api/health` ok; trang công khai không còn 500 (trang chưa có nội dung CMS trả 404); `SITE_ENV=staging` → robots chặn toàn bộ; có CSP, `x-frame-options`, `/admin` có `noindex`; API lead, người dùng, xuất CSV trả 403 khi chưa đăng nhập; form bị từ chối (`captcha_failed`) khi production chưa có khoá Turnstile, không lưu lead. Đã dọn sạch sau khi thử |

| PR #6, #7: `backup.sh` + RUNBOOK sửa sao lưu/quay lui/khôi phục; chạy sau nginx có sẵn (`deploy/compose.sau-nginx.yml`) | 20/10 | Đã gộp [xác minh 20/10 — GitHub] |
| **Lên VPS test** (AlmaLinux, aaPanel, Docker): `web` + `db` sau nginx aaPanel, HTTPS Let's Encrypt, `http` tự chuyển `https`, dữ liệu mẫu | 21/10 | [xác minh 21/10 — Tèo kiểm từ ngoài] 7 trang chính + `/admin` trả 200; CSP, `x-frame-options` có; robots chặn toàn bộ (`SITE_ENV=staging`); API lead 403 khi chưa đăng nhập; form từ chối (`captcha_failed`), không lưu lead; nginx gửi `X-Real-IP`, `client_max_body_size 50m`. Phải thêm swap 4 GB (build bị giết vì hết RAM) |
| **Diễn tập sao lưu + khôi phục trên VPS test** với `docker-compose.yml` thật | 21/10 | [xác minh 21/10] `backup.sh` tìm đúng ổ `renco-web_uploads`, mã hoá, đẩy sang nơi lưu (thư mục trên VPS), không còn bản chưa mã hoá. Khôi phục sang bản thứ hai (cổng 3101) theo RUNBOOK mục 6: 8 sản phẩm · 10 trang · 7 tài khoản · 34 tệp — **giống hệt bản gốc**, 3 trang 200. Đã dọn bản thử |
| **Thử `deploy/Caddyfile` trên máy** (Caddy 2.11.7, tên miền thử `renvindo.localhost`, chứng chỉ nội bộ của Caddy): trước với web giả, sau với ảnh web thật build từ `Dockerfile` + database trống | 21/10 | [xác minh 21/10] Cấu hình hợp lệ; HTTPS chạy (curl kiểm chứng chỉ, không bỏ qua); `http` → `https` (308), `www` → không `www` giữ nguyên đường dẫn (301); có HSTS, CSP, `x-frame-options`, `noindex` ở `/admin`; header `Server` của web bị xoá; nén gzip; `X-Real-IP` do trình duyệt tự khai bị Caddy ghi đè. Chặn IP: ngoài danh sách → `/admin`, `/admin/login`, `/ADMIN`, `/admin%2F` đều 403; trong danh sách → 200; biến để trống → mở mọi IP. **Sửa 2 chỗ:** (1) `/_next/static` trả 2 dòng `Cache-Control` → thêm `>` cho Caddy ghi đè, thử lại còn 1 dòng; (2) ghi `ADMIN_ALLOW_IPS` bằng dấu phẩy làm Caddy không khởi động, **cả website sập** → ghi chú trong Caddyfile + RUNBOOK mục 2 kèm lệnh kiểm trước khi khởi động lại (đã thử: lệnh bắt được lỗi). Chưa thử: Let's Encrypt thật (cần tên miền thật trỏ về máy chủ) |

## 3. Đang dở / rủi ro đã biết

| # | Việc | Mức | Trạng thái |
| --- | --- | --- | --- |
| 1 | Lỗ hổng `braces` (GHSA-vfj7-8cjw-p6xm, qua `@payloadcms/next › sass › chokidar`) mức cao, **chưa có bản vá** | 🟡 | Thắng chốt: **không bỏ qua**, để job `audit` đỏ, theo dõi tới khi có bản vá. Mỗi phiên kiểm: `npx -y pnpm@10.34.7 audit --prod --audit-level=high` [xác minh 20/10] |
| 2 | Sao lưu, quay lui, khôi phục | 🟢 | **Đã diễn tập thật trên VPS test 21/10** (xem mục 2). Còn: chọn nơi lưu thật ở nhà cung cấp khác (rclone) và chỗ giữ khoá riêng GPG trước production; chưa diễn tập quay lui ảnh `prev-`. PR #6 (đã gộp): `backup.sh` tự tìm ổ tệp của container web, dừng và báo `BACKUP LOI` khi dump rỗng / ổ tệp rỗng / mã hoá hoặc đẩy đi lỗi, luôn xoá bản chưa mã hoá; RUNBOOK gắn nhãn `prev` **trước** khi build, khôi phục dùng được cho máy chủ mới. Đã diễn tập trên máy với dự án Docker rút gọn (cùng tên dịch vụ, ổ, đường dẫn): sao lưu → khôi phục sang dự án khác, dữ liệu và tệp nguyên vẹn; 3 ca hỏng đều bị chặn [xác minh 20/10] |
| 3 | Form tạo tài khoản đầu tiên (`/admin` trên database mới) để ô **Vai trò mặc định là Sales**. Quên đổi sang Giám đốc thì tài khoản đầu tiên không tạo được người dùng khác, phải sửa thẳng trong database | 🟡 | Chọn «Giám đốc» thì lưu đúng [xác minh 20/10]. Đã ghi cảnh báo vào RUNBOOK mục 2 (PR #6); cân nhắc đổi mặc định khi chưa có người dùng nào |
| 3b | Trang chủ trên database trống còn khối trống (ảnh hero, khối Nhà máy), số «750 tấn» viết cứng trong mã, chân trang hiện nhãn «Mã số doanh nghiệp:», «Trụ sở:», «Email:» không có giá trị | 🟡 | Không sập [xác minh 20/10 — chụp màn bản production]. Giữ v1 nên **phải xử lý trước ra mắt**: khối trống, nhãn trống hết khi RGI nhập đủ nội dung + Cài đặt [suy luận]; «750 tấn» có nguồn (hồ sơ năng lực PT Dunia Plast 2026, `src/lib/constants.ts`) — chuyển vào CMS hay giữ: hỏi Thắng |
| 4 | `ADMIN_ALLOW_IPS` mặc định mở mọi IP; chặn IP không phủ `/api/users/login` | 🟡 | Chưa sửa [xác minh 18/10]. Thử Caddy thật 21/10: máy ngoài danh sách bị chặn `/admin` (403) nhưng vẫn gọi được `POST /api/users/login` (401 khi sai mật khẩu) và `/api/users/me` (200) [xác minh 21/10] |
| 5 | Seed chỉ chặn khi `NODE_ENV=production` | 🟡 | Chưa sửa [xác minh 18/10] |
| 6 | Chế độ dev lưu cache dữ liệu trên ổ đĩa (`.next/dev/cache/fetch-cache`), khởi động lại không xoá. Đổi database hoặc seed lại thì trang vẫn hiện dữ liệu cũ (từng gây lỗi 500 giả và 404 giả) | 🟢 | Cách xử lý: dừng dev, xoá thư mục `.next/dev/cache/fetch-cache`, bật lại dev [xác minh 20/10] |
| 7 | `pnpm dev` sinh lại `src/payload-types.ts` khác bản commit (mất trường `hasTotp`) | 🟢 | Không commit bản sinh lại; tìm nguyên nhân khi đụng tới phần 2FA [xác minh 20/10] |
| 8 | Trang chưa có nội dung trong CMS trả 404 (database mới) | 🟢 | Đúng hành vi mong muốn; ghi ở `docs/HANDOVER.md` mục 6 [xác minh 20/10] |
| 9 | VPS test dùng chung có nginx (aaPanel) giữ cổng 80/443 → Caddy không chạy được | 🟡 | Thắng duyệt 20/10: VPS test chạy **sau nginx** (`deploy/compose.sau-nginx.yml`, RUNBOOK mục 10), không Caddy. Hệ quả: VPS test **không thử được `deploy/Caddyfile`** và không có lớp chặn `/admin` theo IP [xác minh 20/10 — cổng 80/443 do nginx giữ]. Caddyfile đã thử trên máy 21/10 (mục 2); còn thiếu Let's Encrypt thật |
| 10 | **Tên miền `renvindo.com`, email `greenplast.renco689@gmail.com`, hotline `0948 391 202`** (`renco.vn` đã thuộc người khác; Thắng chốt 21/10) | 🟢 | Đã đổi trong mã, dữ liệu mẫu, test, tài liệu, `.env.example` (PR #10, #11, #12) và Figma (130 + 92 ô chữ) [xác minh 21/10]. Cài đặt website trên VPS test đã sửa 21/10 (Thắng sửa trong trang quản trị; trang chủ, `/lien-he`, `/en` hiện hotline và email mới, không còn số cũ, không còn `renco.vn`) [xác minh 21/10]. **Còn:** **mã QR** trong Figma (ảnh, 16 chỗ) chưa tạo lại — Thắng quyết sau |

Chi tiết, cách sửa: `docs/08-handoff/AUDIT.md` mục 5 (chỉ trên máy).

## 4. Tiếp theo — ra mắt `renvindo.com` trên VPS test với giao diện v1 (Thắng chốt 21/10)

Xong trước đó: Cài đặt VPS test (21/10), thử Caddyfile (21/10). Bỏ: dựng bộ 2.

Hiện trạng DNS `renvindo.com`: chưa có bản ghi A cho cả `renvindo.com` lẫn `www` [xác minh 21/10 — nslookup qua 8.8.8.8].

| # | Việc | Ai | Chặn ra mắt? |
| --- | --- | --- | --- |
| 1 | Chọn cách lấy database sạch: **bản mới song song** trên cùng VPS (thư mục riêng, cổng riêng `WEB_LOCAL_PORT`, ổ dữ liệu riêng), giữ bản thử hiện tại; hay xoá dữ liệu mẫu của bản hiện tại | Thắng quyết | Có — bản hiện tại chứa sản phẩm mẫu và 7 tài khoản mẫu |
| 2 | Khoá Turnstile (Cloudflare, chống spam form) đứng tên công ty. Thiếu khoá thì production **từ chối mọi form** | Thắng / RGI tạo tài khoản; Tèo hướng dẫn | Có |
| 3 | Mật khẩu ứng dụng Gmail công ty cho SMTP (RUNBOOK mục 2) | Thắng / RGI; dán thẳng vào `.env` trên VPS | Có — không có thì sales không nhận thông báo lead |
| 4 | Nơi lưu sao lưu ở nhà cung cấp khác (rclone) + khoá GPG thật, khoá riêng giữ ngoài VPS. Có lead thật = có dữ liệu cá nhân của khách | Thắng chọn nơi lưu; Tèo soạn lệnh | Có |
| 5 | Nội dung thật: sản phẩm, trang, ảnh, Cài đặt (MST, trụ sở…) do RGI nhập trên bản thật | RGI | Có — trang chưa có nội dung trả 404 |
| 6 | Trang pháp lý (chính sách bảo mật, điều khoản) Pháp chế RGI duyệt | RGI | Có |
| 7 | Build lại với `NEXT_PUBLIC_SITE_URL=https://renvindo.com`, `SITE_ENV=production` (robots mở cho Google) | Tèo soạn lệnh, Thắng chạy | Có |
| 8 | DNS ZoneDNS: bản ghi A `renvindo.com` + `www` → IP VPS; aaPanel thêm site, reverse proxy, SSL Let's Encrypt, `www` chuyển về không `www` | Thắng (Tèo hướng dẫn từng bước) | Có |
| 9 | Chặn `/admin` theo IP văn phòng trong nginx aaPanel (cần IP văn phòng RGI); không có thì chỉ còn mật khẩu + 2FA | Thắng quyết có/không | Không bắt buộc |
| 10 | Diễn tập quay lui ảnh `prev-` | Tèo soạn, Thắng chạy | Nên làm |
| 11 | «750 tấn» viết cứng (mục 3 #3b) | Thắng quyết | Không |

**Để sau ra mắt (Thắng giao 21/10, nhắc lại khi xong việc quan trọng):** UI-v3 (Thắng làm thiết kế); giao diện trang quản trị (CMS) cho RENCO; chữ cạnh mã QR trong Figma hứa đích khác trang chủ (danh sách ở `docs/08-handoff/03-viec-dang-do-va-cau-hoi.md`).

## 5. Việc RGI phải làm trước ra mắt

Xem `docs/HANDOVER.md` mục 6 (không chép lại ở đây để tránh hai bản lệch nhau). Nội dung thật do RGI nhập thẳng trên máy chủ thật (Thắng chốt 20/10).
