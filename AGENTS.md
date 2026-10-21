# AGENTS.md

Hướng dẫn cho mọi agent lập trình (Codex, Cursor, Copilot, Gemini…) mở repo này.

**Luật của repo nằm ở `CLAUDE.md`.** File đó áp dụng cho **mọi** agent, không riêng Claude. Ở đây không chép lại, để khỏi có hai bản lệch nhau.

## Ai được sửa mã

Người duy nhất sửa mã repo này là **Tèo (Claude Code)**. Agent khác (Codex/Báo, Kapi…) chỉ **đọc và review**, trừ khi Thắng giao trực tiếp. Agent khác **không xưng là Tèo**.

## Đọc theo thứ tự

1. `TRANG-THAI.md` — dự án đang ở đâu, cái gì kẹt, làm gì tiếp.
2. `CLAUDE.md` — luật: không bao giờ, nguồn chân lý, lệnh kiểm, git, bảo mật repo công khai.
3. `docs/HANDOVER.md` — yêu cầu nằm ở file nào, đã làm gì, khác yêu cầu chỗ nào.

## Năm luật không được vi phạm (tóm tắt — bản đầy đủ ở `CLAUDE.md` mục 2)

1. Không đọc, in hay sửa `.env`, `.env.*` (trừ `.env.example`), `.seed-credentials`. Không đặt khoá, mật khẩu, IP máy chủ, dữ liệu khách vào bất kỳ file nào.
2. Không chạy lệnh tới máy chủ (VPS), không trỏ database trên máy vào database máy chủ.
3. Không xoá dữ liệu: `docker compose down -v`, `docker volume rm`; không chạy `pnpm test:int` thiếu `TEST_DATABASE_URL` riêng, không `pnpm seed` ngoài database dev trên máy.
4. Không push `main`, không force push. Mọi thay đổi qua nhánh + Pull Request, Thắng gộp.
5. Giao diện: Figma là nguồn chân lý (`CLAUDE.md` mục 3). Không chắc → dừng lại hỏi Thắng.
