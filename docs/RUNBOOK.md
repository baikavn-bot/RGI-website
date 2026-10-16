# Sổ tay vận hành renco.vn

Người giữ: Quản trị kỹ thuật RGI. Mọi thao tác trên production ghi phiếu WEB- theo QT-08.

## 1. Chuẩn bị máy chủ (một lần)

1. Máy chủ ảo tại Việt Nam, Ubuntu 24.04, 2 vCPU, 4 GB RAM, 80 GB SSD [ĐX].
2. Chỉ dùng khoá SSH; tắt đăng nhập root và mật khẩu; tường lửa chỉ mở 22 (giới hạn IP), 80, 443.
3. Cài Docker Engine + Docker Compose plugin, `gpg`, `rclone`.
4. DNS: bản ghi A `renco.vn`, `www.renco.vn` trỏ về máy chủ; SPF, DKIM, DMARC theo nhà cung cấp email.
5. Kho mã đứng tên RGI. Clone vào `/opt/renco-web`.

## 2. Triển khai lần đầu

```bash
cd /opt/renco-web
cp .env.example .env && chmod 600 .env
# điền: SITE_DOMAIN, NEXT_PUBLIC_SITE_URL, PAYLOAD_SECRET, DOWNLOAD_SIGNING_SECRET, IP_HASH_SALT,
#        POSTGRES_PASSWORD, SMTP_*, TURNSTILE_*, ADMIN_ALLOW_IPS
docker compose up -d --build
docker compose logs -f web      # chờ "Migrated" và "Ready"
```

Mở `https://renco.vn/admin`, tạo tài khoản Giám đốc đầu tiên, quét mã xác thực hai lớp. Giám đốc tạo các tài khoản còn lại (mỗi người một tài khoản).

Không chạy `pnpm seed` trên production.

## 3. Cập nhật phiên bản

```bash
cd /opt/renco-web
./scripts/backup.sh                       # luôn sao lưu trước khi cập nhật
git fetch && git checkout <tag>
docker compose build web
docker tag renco-web:latest renco-web:prev-$(date +%Y%m%d)   # giữ 3 bản gần nhất
docker compose up -d web
curl -fsS https://renco.vn/api/health
```

## 4. Quay về bản trước (rollback)

Nếu bản mới lỗi và **chưa** có migration mới:

```bash
docker tag renco-web:prev-YYYYMMDD renco-web:latest && docker compose up -d web
```

Nếu đã chạy migration mới: dừng web, khôi phục cơ sở dữ liệu từ bản sao lưu trước cập nhật (mục 6), rồi chạy ảnh cũ.

## 5. Sao lưu

- `scripts/backup.sh` chạy 02:30 hằng ngày bằng cron: dump PostgreSQL + nén thư mục tệp, mã hoá GPG, đẩy sang nơi lưu khác bằng rclone.
- Giữ 30 bản ngày, 12 bản tuần [ĐX]. Một bản lưu ở nhà cung cấp khác máy chủ chính.
- Theo dõi log `/var/log/renco-backup.log`; ngày nào không có dòng `backup ok` thì báo Quản trị kỹ thuật.

## 6. Khôi phục (thử mỗi quý trên staging)

```bash
gpg --decrypt db-YYYYMMDD-HHMM.dump.gpg > db.dump
docker compose stop web
docker compose exec -T db pg_restore -U renco -d renco --clean --if-exists < db.dump
gpg --decrypt uploads-YYYYMMDD-HHMM.tgz.gpg | docker run --rm -i -v renco-web_uploads:/data alpine tar xzf - -C /data
docker compose start web
```

Ghi thời gian khôi phục thực tế vào phiếu. Mục tiêu ≤ 4 giờ, mất tối đa 24 giờ dữ liệu [ĐX].

## 7. Giám sát

- Kiểm tra `https://renco.vn/api/health` mỗi 5 phút (UptimeRobot, Uptime Kuma hoặc tương đương).
- Cảnh báo CPU, RAM, ổ đĩa > 80%.
- `docker compose logs --since 1h web | grep -i error` khi có báo lỗi.

## 8. Tài khoản và quyền

| Việc | Ai làm | Cách làm |
| --- | --- | --- |
| Thêm người dùng | Giám đốc, Quản trị kỹ thuật | Quản trị → Hệ thống → Người dùng → tạo, chọn vai trò |
| Nhân viên nghỉ việc | Quản trị kỹ thuật | Đổi mật khẩu ngẫu nhiên, đổi vai trò, xoá phiên đăng nhập ngay trong ngày (QT-09) |
| Mất điện thoại xác thực | Giám đốc | Gỡ TOTP của người đó trong trang tài khoản, người đó thiết lập lại |
| Đổi nhà thầu | Quản trị kỹ thuật | Thu hồi quyền kho mã, máy chủ; đổi PAYLOAD_SECRET, DOWNLOAD_SIGNING_SECRET, mật khẩu DB, SMTP |

Đổi `PAYLOAD_SECRET` làm mọi phiên đăng nhập hết hiệu lực và mọi liên kết tải tài liệu cũ hết hạn.

## 9. Tác vụ nền

| Tác vụ | Lịch | Việc |
| --- | --- | --- |
| sendLeadEmails | khi có lead | Email cho sales, email xác nhận cho khách; thử lại 3 lần |
| leadOverdueCheck | mỗi giờ | Lead "Mới" quá 1 ngày làm việc: báo Quản lý marketing; quá 3 ngày: báo Giám đốc |
| complianceExpiryCheck | 01:00 hằng ngày | Hồ sơ hợp quy còn 60 ngày: báo Pháp chế; hết hạn: sản phẩm về "Sắp ra mắt" |
| anonymizeStaleLeads | 02:00 ngày 1 hằng tháng | Ẩn danh hoá lead không phát sinh liên hệ sau LEAD_RETENTION_MONTHS tháng |

Tạm dừng khi bảo trì: `DISABLE_JOBS=true` rồi `docker compose up -d web`. Tác vụ lỗi hiện ở Quản trị → payload-jobs.
