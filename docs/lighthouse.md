# Kết quả Lighthouse

Đo ngày 16/10/2026 · Lighthouse 12.8 · giả lập điện thoại Moto G Power, mạng 4G chậm (1,6 Mbps, RTT 150 ms), CPU chậm 4 lần · bản build production chạy cục bộ, dữ liệu mẫu · lần đo thứ hai (cache ảnh đã ấm).

| Trang | Performance | Accessibility | Best practices | SEO | LCP | FCP | CLS | TBT | Dung lượng |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trang chủ `/` | 85 | 100 | 100 | 100 | 3,6 s | 1,2 s | 0,001 | 250 ms | 373 KB |
| Chi tiết sản phẩm `/san-pham/ong-mem-pvc/ong-mem-dan-nuoc` | 95 | 100 | 100 | 100 | 2,0 s | 1,1 s | 0 | 230 ms | 322 KB |
| Hợp tác `/hop-tac` | 93 | 99 | 100 | 100 | 2,3 s | 1,2 s | 0,019 | 260 ms | 353 KB |
| Nhà máy `/nha-may` | 88 | 98 | 100 | 100 | 3,7 s | 2,0 s | 0 | 90 ms | 377 KB |

Đã làm: nhúng CSS vào HTML, font tự lưu trữ chỉ bộ Latin + tiếng Việt (4 tệp tải ở màn hình đầu, ~60 KB), ảnh WebP nhiều cỡ, ảnh đầu trang tải ưu tiên, dữ liệu trang lấy từ cache (máy chủ trả HTML trong 20–130 ms).

Chưa đạt LCP ≤ 2,5 s ở trang chủ và trang Nhà máy trong giả lập. Phần lớn thời gian là "render delay" do JavaScript của React chạy trên CPU bị làm chậm 4 lần. Việc nên làm trên staging, với ảnh thật độ phân giải cao:

1. Đo bằng dữ liệu thật (Chrome UX Report / Umami Web Vitals) sau 28 ngày chạy; tiêu chí nghiệm thu áp dụng ở mức 75% lượt xem.
2. Giảm chất lượng ảnh đầu trang xuống q=60 nếu ảnh mới nặng hơn 40 KB ở bề rộng 750 px.
3. Chuyển bộ đếm "750 tấn" và hoạ tiết chấm sang ảnh nền CSS để bớt một lớp vẽ trên ảnh đầu trang.
