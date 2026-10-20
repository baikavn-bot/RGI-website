# TRẠNG THÁI DỰ ÁN — đọc file này đầu tiên mỗi phiên

*Cập nhật **20/10/2026** · Ai sửa trạng thái thì sửa ngày ở dòng này. Chỉ sửa qua Pull Request.*

Ký hiệu: **[xác minh dd/mm]** = đã mở ra kiểm, có ngày · **[suy luận]** = suy ra, chưa kiểm · **[CẦN XÁC NHẬN]** = chờ người trả lời.

## 1. Tóm tắt

MVP v0.1 website renco.vn đã có mã đầy đủ trên GitHub (16/10/2026) và **đã chạy được trên máy Thắng** (20/10/2026, dữ liệu mẫu). **Chưa triển khai lên máy chủ nào.** Từ 20/10/2026 **Thắng và Tèo tiếp quản**; Tèo là người duy nhất trực tiếp sửa mã.

**Giao diện sẽ dựng lại theo bộ 2 «Web v2»** (Figma page 31 – 32, Thắng chốt 20/10). Bộ 1 (page 29 – 30) chỉ còn là nền token và component. Giao diện đang có trong mã gần với bộ 1, khác hẳn bộ 2 [xác minh 20/10 — chụp màn 1440/375 so với Figma].

## 2. Đã xong

| Việc | Ngày | Mức xác minh |
| --- | --- | --- |
| Mã MVP v0.1 lên `main` (3 commit, danh tính BAIKA) | 16/10 | [xác minh 18/10 — git log] |
| Kiểm toán ban đầu chỉ đọc (báo cáo `docs/08-handoff/AUDIT.md`, chỉ trên máy) | 18/10 | [xác minh 18/10] |
| Chốt Figma «RENCO — Copy» page 28 – 32 làm nguồn chân lý giao diện; chốt dựng theo bộ 2 | 20/10 | Thắng chốt. [xác minh 20/10 — đọc được cả 5 page, bảng ở `CLAUDE.md` mục 3] |
| PR #1: bộ luật Claude Code (`CLAUDE.md`, `.claude/settings.json`, file này), README + HANDOVER bỏ chữ «Blueprint» | 20/10 | Đã gộp vào `main` [xác minh 20/10 — GitHub] |
| Chạy thử trên máy: PostgreSQL bằng Docker, `pnpm dev`, `pnpm seed`; mọi trang chính trả 200 | 20/10 | [xác minh 20/10] |
| Trên máy với pnpm 10.34.7: typecheck, lint đạt; `test:int` 52/52 đạt (DB test riêng); `build` đạt | 20/10 | [xác minh 20/10] |
| PR `sua-ci-pnpm`: ghi rõ pnpm 10.34.7; tách `pnpm audit` thành job riêng | 20/10 | Chờ Thắng gộp; CI trên GitHub chưa chạy với thay đổi này |

## 3. Đang dở / rủi ro đã biết

| # | Việc | Mức | Trạng thái |
| --- | --- | --- | --- |
| 1 | `main` chưa khoá (`protected: false`) | 🔴 | Thắng tự bật ruleset `bao-ve-main`. Chỉ tick «status checks» với job **`check`** sau khi job này xanh trên GitHub [xác minh 20/10] |
| 2 | Lỗ hổng `braces` (GHSA-vfj7-8cjw-p6xm, qua `@payloadcms/next › sass › chokidar`) mức cao, **chưa có bản vá** | 🟡 | Thắng chốt: **không bỏ qua**, để job `audit` đỏ, theo dõi tới khi có bản vá. Mỗi phiên kiểm: `npx -y pnpm@10.34.7 audit --prod --audit-level=high` [xác minh 20/10] |
| 3 | Trang tiếng Việt sập (500) khi Cài đặt chưa có hotline — xảy ra ngay trên database mới | 🔴 | Chưa sửa [xác minh 20/10 — gặp khi chạy thử] |
| 4 | `pnpm test:int` xoá sạch DB nếu thiếu `TEST_DATABASE_URL` | 🔴 | Chưa sửa [xác minh 18/10] |
| 5 | RUNBOOK quay lui gắn nhãn sai; `backup.sh` ghi cứng tên ổ dữ liệu; chưa diễn tập khôi phục | 🔴 | Chưa sửa [xác minh 18/10] |
| 6 | Bản production (Docker) chưa từng chạy thử | 🟡 | Chưa làm |
| 7 | `.gitignore` không chặn `.env.*` (trừ `.local`) và file sao lưu | 🟡 | Chưa sửa [xác minh 18/10] |
| 8 | `ADMIN_ALLOW_IPS` mặc định mở mọi IP; chặn IP không phủ `/api/users/login` | 🟡 | Chưa sửa [xác minh 18/10] |
| 9 | Seed chỉ chặn khi `NODE_ENV=production` | 🟡 | Chưa sửa [xác minh 18/10] |
| 10 | `pnpm dev` sinh lại `src/payload-types.ts` khác bản commit (mất trường `hasTotp`) | 🟢 | Không commit bản sinh lại; tìm nguyên nhân khi đụng tới phần 2FA [xác minh 20/10] |

Chi tiết, cách sửa: `docs/08-handoff/AUDIT.md` mục 5 (chỉ trên máy).

## 4. Tiếp theo (Thắng duyệt thứ tự 20/10)

1. Gộp PR `sua-ci-pnpm` → job `check` xanh → Thắng bật khoá `main` bắt buộc `check`.
2. PR sửa trang sập khi chưa có hotline. (Đề xuất gộp chung: chặn test xoá DB + vá `.gitignore`.)
3. Chạy thử bản production bằng Docker trên máy.
4. PR sửa `backup.sh` + RUNBOOK.
5. Lên VPS test (chỉ dữ liệu mẫu, không nhận lead thật) → diễn tập sao lưu, khôi phục.
6. Dựng giao diện bộ 2 «Web v2».

## 5. Việc RGI phải làm trước ra mắt

Xem `docs/HANDOVER.md` mục 6 (không chép lại ở đây để tránh hai bản lệch nhau). Nội dung thật do RGI nhập thẳng trên máy chủ thật (Thắng chốt 20/10).
