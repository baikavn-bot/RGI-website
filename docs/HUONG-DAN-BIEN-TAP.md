# Hướng dẫn biên tập nội dung renvindo.com

Dành cho Biên tập, Quản lý marketing, Pháp chế. Không cần biết code.

## Đăng nhập

1. Mở `https://renvindo.com/admin`, nhập email và mật khẩu.
2. Lần đầu: mở Google Authenticator (hoặc Microsoft Authenticator), quét mã QR trên màn hình, nhập 6 chữ số.
3. Những lần sau: nhập 6 chữ số trong ứng dụng sau khi nhập mật khẩu.

Mất điện thoại: báo Giám đốc để gỡ xác thực cũ.

## Sửa chữ trên một trang

1. Nội dung → Trang → chọn trang (Trang chủ, Về RENCO, Nhà máy…).
2. Góc trên có nút chọn ngôn ngữ **Tiếng Việt / English**. Sửa bản tiếng Việt trước, rồi chuyển sang English sửa bản tiếng Anh.
3. Các ô chính:
   - **Dòng nhỏ trên tiêu đề**: chữ in hoa nhỏ màu xanh.
   - **Tiêu đề** và **Cụm nhấn màu xanh**: tiêu đề lớn; cụm nhấn hiện màu xanh ngay sau tiêu đề.
   - **Đoạn mở đầu**: 1–2 câu.
   - **Khối nội dung**: mỗi khối một tiêu đề, một đoạn, một số liệu kèm nguồn.
4. Bấm **Lưu bản nháp**. Quản lý marketing đọc lại rồi bấm **Xuất bản**; trang mới hiện trên website ngay sau đó.

## Sửa sản phẩm

Sản phẩm → Sản phẩm → chọn sản phẩm.

- Biên tập chỉ lưu nháp. Mỗi lần sửa, ô **Pháp chế duyệt** tự về "Chờ Pháp chế duyệt".
- Pháp chế mở bản nháp, rà bốn điểm rồi chọn "Đã duyệt" và **Xuất bản**:
  1. Không có chữ "Hợp quy", dấu CR ở nơi không có hồ sơ hợp quy.
  2. Không ghi tỉ lệ tái chế khi chưa có phiếu cân đối nguyên liệu; ống uPVC không mang nhãn tái chế.
  3. Nơi sản xuất ghi "Nhà máy REN Group tại Tangerang, Indonesia".
  4. Không dùng ký hiệu ® cho RENCO.
- **Trạng thái bán**: chỉ Giám đốc đổi. Ống uPVC chỉ chuyển "Đang bán" được khi đã có hồ sơ hợp quy đã duyệt.

## Bảng quy cách

Sản phẩm → Quy cách.

- **Tên cỡ** (Ø21, 5/8"…) luôn hiện trên website.
- Các ô số chỉ hiện khi **Trạng thái số liệu** là "Nhà máy đã xác nhận". Còn "Đề xuất" thì website ghi "Đang cập nhật".
- Biên tập sửa số thì trạng thái tự về "Đề xuất". Pháp chế đối chiếu văn bản của nhà máy rồi chuyển "Nhà máy đã xác nhận".

## Ảnh

Nội dung → Ảnh → Tải lên.

- Bắt buộc ghi **Mô tả ảnh** (cả tiếng Việt và tiếng Anh) và **Nguồn ảnh**.
- Ảnh chỉ hiện trên website khi Quản lý marketing hoặc Pháp chế tích **Đã xác nhận quyền dùng, không có nhãn bên thứ ba**.
- Ảnh gốc nên rộng từ 1600 px. Hệ thống tự nén và cắt cỡ.

## Tài liệu PDF

Nội dung → Tài liệu → Tải lên.

- **Công khai**: ai cũng tải được (catalog, hồ sơ năng lực).
- **Cần để lại thông tin**: chỉ tải qua liên kết sales gửi, hết hạn sau 24 giờ.
- **Nội bộ**: không bao giờ hiện trên website (phiếu thử nghiệm gốc, phiếu cân đối nguyên liệu).
- PDF nên nén dưới 10 MB.

## Trang pháp lý (WB01, WB02)

Pháp chế dán nội dung đã duyệt vào trang "Điều khoản sử dụng" và "Chính sách dữ liệu cá nhân", ghi **Ngày hiệu lực** và **Phiên bản**, chọn "Đã duyệt" rồi xuất bản. Khi đổi phiên bản WB02, vào Cài đặt website → Form → đổi **Phiên bản WB02** và **Câu đồng ý** cho khớp.

## Lead

Bán hàng → Lead.

- Quản lý marketing giao lead cho sales ở ô **Sales phụ trách**.
- Sales đổi **Trạng thái** theo thứ tự: Mới → Đã liên hệ → Đủ điều kiện → Đã gửi mẫu / Đã gửi chính sách, báo giá → Thành đối tác hoặc Không thành (phải chọn lý do).
- Ghi chú cuộc gọi, mã vận đơn gửi mẫu: Bán hàng → Hoạt động lead → tạo mới, chọn lead.
- Cột **Quá hạn** bật khi lead "Mới" quá 1 ngày làm việc.
- Xuất CSV (Quản lý marketing, Giám đốc): mở `https://renvindo.com/api/leads/export` khi đang đăng nhập; thêm `?status=new&from=2026-11-01` để lọc. Mỗi lần xuất được ghi nhật ký.
