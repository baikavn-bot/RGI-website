# TRẠNG THÁI DỰ ÁN — đọc file này đầu tiên mỗi phiên

*Cập nhật **20/10/2026** · Ai sửa trạng thái thì sửa ngày ở dòng này. Chỉ sửa qua Pull Request.*

Ký hiệu: **[xác minh dd/mm]** = đã mở ra kiểm, có ngày · **[suy luận]** = suy ra, chưa kiểm · **[CẦN XÁC NHẬN]** = chờ người trả lời.

## 1. Tóm tắt

MVP v0.1 website renco.vn đã có mã đầy đủ trên GitHub (16/10/2026). **Chưa chạy thử trên máy, chưa triển khai lên máy chủ thật.** Từ 20/10/2026 **Thắng và Tèo tiếp quản**; Tèo là người duy nhất trực tiếp sửa mã.

## 2. Đã xong

| Việc | Ngày | Mức xác minh |
| --- | --- | --- |
| Mã MVP v0.1 lên `main` (3 commit, danh tính BAIKA) | 16/10 | [xác minh 18/10 — git log] |
| Bản sao repo trên máy Thắng | 16/10 | [xác minh 18/10] |
| Kiểm toán ban đầu chỉ đọc (báo cáo `docs/08-handoff/AUDIT.md`, chỉ trên máy) | 18/10 | [xác minh 18/10] |
| Chốt Figma «RENCO — Copy» page 28 – 32 làm nguồn chân lý giao diện | 20/10 | Thắng chốt. Tèo mở được file nhưng công cụ Figma chỉ thấy page «00 — Read Me / Governance» và «02 — Marketing Components», **chưa thấy page 28 – 32** [CẦN XÁC NHẬN] |
| Bộ luật cho Claude Code: `CLAUDE.md`, `.claude/settings.json`, file này; README + HANDOVER trỏ đúng file thay cho chữ «Blueprint» | 20/10 | PR `thiet-lap-claude-code` — chờ Thắng gộp |

## 3. Đang dở / rủi ro đã biết

| # | Việc | Mức | Trạng thái |
| --- | --- | --- | --- |
| 1 | `main` chưa khoá (`protected: false`) | 🔴 | Thắng tự bật ruleset `bao-ve-main`; **chưa** tick «status checks» cho tới khi CI xanh [xác minh 18/10] |
| 2 | CI hỏng ngay bước cài pnpm (thiếu `packageManager` trong `package.json`) → test, quét bí mật chưa chạy lần nào trên GitHub | 🔴 | Chưa sửa [xác minh 18/10] |
| 3 | `pnpm test:int` xoá sạch DB nếu thiếu `TEST_DATABASE_URL` | 🔴 | Chưa sửa [xác minh 18/10] |
| 4 | RUNBOOK quay lui gắn nhãn sai; `backup.sh` ghi cứng tên ổ dữ liệu; chưa diễn tập khôi phục | 🔴 | Chưa sửa [xác minh 18/10] |
| 5 | `.gitignore` không chặn `.env.*` (trừ `.local`) và file sao lưu | 🟡 | Chưa sửa [xác minh 18/10] |
| 6 | `ADMIN_ALLOW_IPS` mặc định mở mọi IP; chặn IP không phủ `/api/users/login` | 🟡 | Chưa sửa [xác minh 18/10] |
| 7 | Seed chỉ chặn khi `NODE_ENV=production` | 🟡 | Chưa sửa [xác minh 18/10] |

Chi tiết từng điểm, cách sửa: `docs/08-handoff/AUDIT.md` mục 5 (chỉ trên máy).

## 4. Tiếp theo (theo thứ tự)

1. Thắng gộp PR `thiet-lap-claude-code`, rồi bật khoá `main`.
2. PR sửa CI (thêm `packageManager`) → CI xanh → Thắng bật «status checks» trong ruleset.
3. PR chặn test xoá DB + vá `.gitignore`.
4. Chạy thử trên máy (`docs/08-handoff/AUDIT.md` mục 7).
5. PR sửa RUNBOOK + `backup.sh`.
6. Triển khai VPS test + diễn tập sao lưu, khôi phục.

## 5. Việc RGI phải làm trước ra mắt

Xem `docs/HANDOVER.md` mục 6 (không chép lại ở đây để tránh hai bản lệch nhau).
