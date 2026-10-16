# Bàn giao kỹ thuật — renco.vn MVP

Phiên bản mã: 0.1.0 · Ngày: 16/10/2026 · Căn cứ: Blueprint website renco.vn v0.1

## 1. Đã làm theo blueprint

| Mục blueprint | Đã làm | Vị trí trong mã |
| --- | --- | --- |
| 3. Vai trò | 6 vai trò nội bộ: Giám đốc, Quản lý marketing, Sales, Biên tập, Pháp chế, Quản trị kỹ thuật; kiểm quyền ở backend | `src/access`, `access` của từng collection |
| 4. Chức năng MVP | Trang công khai Việt – Anh, catalog 5 dòng, 6 loại form, quản trị lead, CMS có duyệt, nhật ký | — |
| 5. Luồng | F1 – F7, vòng đời lead có kiểm chuyển trạng thái | `collections/Leads.ts`, `endpoints/submitLead.ts` |
| 6. Sitemap | 13 loại trang, URL Việt không dấu, tiếng Anh dưới /en, 301 từ /vi/... | `lib/routes.ts`, `proxy.ts`, `app/(frontend)` |
| 7–8. Kiến trúc, stack | Next.js 16 + Payload 3.91 + PostgreSQL, một ứng dụng | — |
| 9. Dữ liệu | 17 thực thể GĐ1; `sale_status`, `claim_level`, `spec_status`; xoá mềm lead | `src/collections` |
| 10. Quy tắc | BR-01 – BR-10 chạy trong hook backend | xem bảng 2 |
| 11. API | Nhận form, xuất CSV, tải tài liệu có chữ ký, health; lỗi cùng một dạng | `src/endpoints` |
| 12–13. Giao diện | Phong cách Eco, token từ Figma, logo xuất từ Figma, mobile-first, chế độ tối | `app/(frontend)/[lang]/styles.css`, `components` |
| 14. Form | Một schema dùng chung trình duyệt và server, thông báo lỗi Việt – Anh, ô bẫy, giới hạn tần suất, Turnstile | `lib/schemas.ts`, `components/LeadForm.tsx` |
| 15. Quản trị | Payload Admin tiếng Việt, bảng tổng quan theo vai trò | `components/admin/Dashboard.tsx` |
| 16. Tích hợp | SMTP, Turnstile, Umami (tuỳ chọn), health check | `.env.example` |
| 17. Hiệu năng | Ảnh AVIF/WebP nhiều cỡ, font tự lưu trữ, CSS nhúng, cache dữ liệu theo thẻ | `lib/data.ts`, `next.config.ts` |
| 18. Bảo mật | Xác thực hai lớp bắt buộc, khoá 15 phút sau 5 lần sai, mật khẩu ≥ 12 ký tự, CSP, chặn /admin theo IP, nhật ký chỉ ghi thêm | `payload.config.ts`, `deploy/Caddyfile` |
| 19. SEO, tuân thủ | hreflang, canonical, sitemap, robots theo môi trường, schema Organization/Product không giá; bằng chứng đồng ý; yêu cầu của chủ thể dữ liệu | `lib/seo.ts`, `app/sitemap.ts` |
| 20. Vận hành | Docker Compose + Caddy, migration tự chạy, sao lưu mã hoá, CI | `Dockerfile`, `docker-compose.yml`, `scripts/backup.sh`, `.github/workflows/ci.yml` |

## 2. Quy tắc nghiệp vụ và test

| Quy tắc | Cài ở | Test tự động |
| --- | --- | --- |
| BR-01 ống uPVC chỉ "Đang bán" khi có hồ sơ hợp quy đã duyệt, còn hạn | `Products.ts › productRules` | T01, T01b |
| BR-02 ống uPVC không mang nhãn tái chế | `productRules` | T02 |
| BR-03 nhãn tái chế cấp 2, 3 cần bằng chứng | `productRules` | có |
| BR-04 số liệu "đề xuất" không ra API công khai | `Variants.ts` (quyền đọc theo trường) | T04 + e2e |
| BR-05 hồ sơ hết hạn → sản phẩm về "Sắp ra mắt" | `ComplianceRecords.ts`, `jobs/complianceExpiry.ts` | T03 |
| BR-06 Pháp chế duyệt trước khi xuất bản sản phẩm, trang pháp lý | `hooks/legalGate.ts` | T05 |
| BR-07 tài liệu nội bộ không có liên kết công khai; gated cần chữ ký | `Documents.ts`, `endpoints/documentDownload.ts` | T14 + unit |
| BR-08 gộp lead trùng số điện thoại trong 30 ngày | `submitLead.ts` | T07 |
| BR-09 không đồng ý thì không lưu | `submitLead.ts` | T06 (int + e2e) |
| BR-10 thực hiện yêu cầu xoá dữ liệu | `Privacy.ts › executeDataRequest` | có |

Kết quả chạy ngày 16/10/2026 (sau lượt rà soát độc lập): `pnpm test:int` 52/52 đạt (34 test tích hợp + 18 unit); `pnpm test:e2e` 17/17 đạt (desktop + Pixel 7); `pnpm build` đạt, không cần cơ sở dữ liệu khi build.

### Lỗi đã sửa sau lượt rà soát độc lập

Một lượt rà soát mã nguồn riêng (không tham gia viết code) tìm ra 20 điểm. Đã sửa và có test hồi quy ở `tests/int/hardening.int.spec.ts`:

- Tài khoản chưa qua bước mã 2FA không được coi là người nội bộ (trước đây chỉ cần mật khẩu là đọc được lead).
- Sales không tự bật nhận email mọi lead; Quản lý marketing không đổi được mã dòng `RC-P` để lách quy tắc hợp quy.
- Trang Điều khoản, Chính sách dữ liệu luôn cần Pháp chế duyệt, kể cả khi ai đó đổi loại trang.
- Ghi chú duyệt của Pháp chế không còn lộ qua API công khai.
- Sales không sửa được mã yêu cầu, bằng chứng đồng ý, số lần gộp của lead.
- Khách gửi form lần nữa: mỗi lần gửi có bằng chứng đồng ý riêng; email, tên doanh nghiệp còn trống thì được bổ sung.
- Sửa hồ sơ hợp quy đã duyệt → hồ sơ về nháp, ống uPVC tự về "Sắp ra mắt" tới khi Giám đốc duyệt lại.
- Tự hạ trạng thái sản phẩm không còn đẩy bản nháp chưa duyệt lên website.
- Quy cách của sản phẩm chưa xuất bản không còn lộ qua API.
- Nhật ký thay đổi không ghi mã bí mật 2FA, khoá API.
- Thay tệp ảnh → phải xác nhận lại quyền dùng (trừ Quản lý marketing, Pháp chế, Giám đốc).
- IP người gửi lấy từ `X-Real-IP` do Caddy đặt, không tin phần đầu `X-Forwarded-For`.
- Turnstile: production thiếu khoá thì form từ chối, không mở cửa cho bot.
- Email xác nhận gửi khách không lặp lại tên khách nhập (tránh bị lợi dụng gửi thư rác).
- Xuất CSV đọc đủ mọi trang, kiểm tra ngày lọc, chặn công thức Excel nhưng giữ số `+84…`.
- Chữ trên web bỏ các ý chưa có căn cứ: "giao tới chân công trình", "cây 4 m", phạm vi "cấp, thoát nước" của ống uPVC, thời gian phản hồi cố định. Nhà máy tái chế chỉ nhắc đúng một câu nguồn đã duyệt.

Thay đổi cấu trúc dữ liệu nằm ở migration `20261016_043826_review_fixes` (đã chạy thử trên cơ sở dữ liệu trắng).

## 3. Đối chiếu tiêu chí nghiệm thu (mục 22)

| Tiêu chí | Trạng thái |
| --- | --- |
| Trang công khai đủ Việt – Anh | Đạt với nội dung mẫu. Chữ chờ Quản lý marketing duyệt |
| Catalog | Đạt về chức năng. Mã ống mềm, tấm nhập theo nhóm; cần bảng dữ liệu chuẩn của RGI để nhập đủ |
| Quy tắc hợp quy, tái chế | Đạt (test tự động) |
| Form | Đạt (test tự động) |
| Email thông báo | Đạt khi chạy thử (ghi ra log). Cần SMTP thật và SPF, DKIM, DMARC để đo thời gian tới hộp thư |
| Quản trị lead | Đạt. Bảng lead dùng danh sách có lọc của Payload |
| Phân quyền | Đạt (test tự động) |
| Nhật ký | Đạt |
| Bảo mật | 2FA, khoá tài khoản, CSP đã có. Chưa chạy OWASP ZAP — làm trên staging |
| Hiệu năng | Xem mục 4 |
| SEO | sitemap, robots, hreflang, schema có. Search Console xác minh khi có tên miền |
| Khả năng truy cập | Lighthouse Accessibility 99–100 trên 3 trang chính |
| Vận hành | Có kịch bản sao lưu, khôi phục, rollback. Chưa chạy thử trên máy chủ thật |
| Tuân thủ (19.3) | Trang WB01, WB02 để nháp, chờ Pháp chế dán nội dung và duyệt |

## 4. Hiệu năng đo được

Lighthouse 12, giả lập điện thoại, mạng 4G chậm, máy chủ production chạy cục bộ. Kết quả ghi trong `docs/lighthouse.md` sau mỗi lần đo.

## 5. Khác với blueprint

- **Trang dựng ở server mỗi lượt xem, dữ liệu lấy từ cache** thay cho trang tĩnh. Kết quả với người xem như nhau (thời gian phản hồi 20–130 ms), nhưng build không cần kết nối cơ sở dữ liệu và nội dung mới hiện ngay khi xuất bản.
- **Xem trước bản nháp** chưa làm. Biên tập lưu nháp, Quản lý marketing xuất bản rồi xem trên website.
- **Bảng lead** dùng danh sách chuẩn của Payload (lọc, tìm, sắp xếp, cột "Quá hạn"), chưa có giao diện kéo thả.
- **CSP** cho phép `'unsafe-inline'` với script vì Next.js nhúng script khởi tạo; có thể siết bằng nonce ở V1.

## 6. Việc RGI phải làm trước khi ra mắt

**Chặn ra mắt** — chưa xong thì không mở website:

- Khoá Cloudflare Turnstile thật trong `.env` production (thiếu khoá, mọi form bị từ chối).
- Trang Điều khoản (WB01) và Chính sách dữ liệu (WB02) đã xuất bản. Form thu dữ liệu cá nhân dẫn tới hai trang này; bảng điều khiển quản trị báo đỏ khi chưa xuất bản.
- SMTP thật, đã gửi thử tới hộp thư sales.

Lưu ý thêm: sửa chữ trong quy cách (cỡ, ghi chú) không qua bước Pháp chế duyệt; chỉ số liệu mới bị khoá về "đề xuất". Nếu RGI muốn duyệt cả phần này, làm ở V1.

**Việc chuẩn bị:**

1. Đăng ký `renco.vn` đứng tên RGI; tạo hộp thư `sales@renco.vn`, cấu hình SPF, DKIM, DMARC.
2. Thuê máy chủ ảo tại Việt Nam; tạo tài khoản Cloudflare Turnstile.
3. Pháp chế dán WB01, WB02 vào trang pháp lý; chốt câu đồng ý và thời hạn giữ lead.
4. Giao bảng dữ liệu sản phẩm chuẩn (mã, tên Việt – Anh, cỡ, số liệu đã nhà máy xác nhận).
5. Rà quyền dùng 14 ảnh mẫu; thay ảnh hero bằng ảnh độ phân giải cao (≥ 1600 px).
6. Tải catalog, hồ sơ năng lực bản PDF đã duyệt vào mục Tài liệu.
7. Trả lời các câu hỏi mở ở mục 25 blueprint (Zalo, màu RC-W, chữ "tái chế" trong tên sản phẩm, có nộp WB03 không).

## 7. Dữ liệu mẫu

`pnpm seed` nạp 5 dòng, 8 sản phẩm, 30 quy cách, 10 trang, 14 ảnh, 7 tài khoản `*@renco.test`. Mọi quy cách ở trạng thái "đề xuất"; sản phẩm và trang được đánh dấu "Đã duyệt" chỉ để chạy thử — Pháp chế duyệt lại toàn bộ trên staging. Không chạy seed trên production.
