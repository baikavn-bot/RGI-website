# Sổ tay vận hành renco.vn

Người giữ: Quản trị kỹ thuật RGI. Mọi thao tác trên production ghi phiếu WEB- theo QT-08.

## 1. Chuẩn bị máy chủ (một lần)

1. Máy chủ ảo tại Việt Nam, Ubuntu 24.04, 2 vCPU, 4 GB RAM, 80 GB SSD [ĐX].
2. Chỉ dùng khoá SSH; tắt đăng nhập root và mật khẩu; tường lửa chỉ mở 22 (giới hạn IP), 80, 443.
3. Cài Docker Engine + Docker Compose plugin, `gpg`, `rclone`.
4. DNS: bản ghi A `renco.vn`, `www.renco.vn` trỏ về máy chủ; SPF, DKIM, DMARC theo nhà cung cấp email.
5. Kho mã đứng tên RGI. Clone vào `/opt/renco-web`. Docker đặt tên ổ dữ liệu theo tên thư mục (vd. `renco-web_pgdata`, `renco-web_uploads`); `scripts/backup.sh` tự tìm đúng ổ, nhưng **đừng đổi tên thư mục sau khi đã chạy** — đổi là Docker tạo ổ mới, trống.
6. Sao lưu: nhập khoá **công khai** GPG của người giữ bản sao lưu (`gpg --import khoa-cong-khai.asc`), cấu hình remote rclone tới nơi lưu ở nhà cung cấp khác. Khoá **riêng** GPG không bao giờ để trên máy chủ. Thêm vào `.env`: `BACKUP_GPG_RECIPIENT`, `BACKUP_REMOTE` (xem đầu `scripts/backup.sh`).

## 2. Triển khai lần đầu

```bash
cd /opt/renco-web
cp .env.example .env && chmod 600 .env
# điền: SITE_DOMAIN, NEXT_PUBLIC_SITE_URL, PAYLOAD_SECRET, DOWNLOAD_SIGNING_SECRET, IP_HASH_SALT,
#        POSTGRES_PASSWORD, SMTP_*, TURNSTILE_*, ADMIN_ALLOW_IPS
docker compose up -d --build
docker compose logs -f web      # chờ "Migrated" và "Ready"
```

Mở `https://renco.vn/admin`, tạo tài khoản đầu tiên. **Ô «Vai trò» mặc định là Sales — đổi thành «Giám đốc»** trước khi bấm Tạo; quên đổi thì tài khoản này không tạo được người dùng khác và phải sửa thẳng trong cơ sở dữ liệu. Quét mã xác thực hai lớp. Giám đốc tạo các tài khoản còn lại (mỗi người một tài khoản).

Ngay sau đó, nhập **Cài đặt website** (tên doanh nghiệp, mã số thuế, địa chỉ, hotline, email). Chưa nhập thì website ẩn mọi nút gọi, chân trang để trống.

Chạy thử sao lưu một lần (`./scripts/backup.sh`), kiểm log có dòng `backup ok`, rồi mới cài cron (mục 5).

Không chạy `pnpm seed` trên production.

## 3. Cập nhật phiên bản

```bash
cd /opt/renco-web
./scripts/backup.sh                                            # 1. luôn sao lưu trước; không thấy "backup ok" thì DỪNG
docker tag renco-web:latest renco-web:prev-$(date +%Y%m%d-%H%M) # 2. giữ ảnh ĐANG CHẠY làm bản quay lui — phải làm TRƯỚC khi build
git fetch && git checkout <tag hoặc mã commit đã gộp vào main>  # 3. lấy mã mới
docker compose build web                                       # 4. build ảnh mới (ghi đè renco-web:latest)
docker compose up -d web                                       # 5. chạy ảnh mới; migration mới (nếu có) tự chạy
curl -fsS https://renco.vn/api/health                          # 6. phải trả {"ok":true,"db":"ok"}
```

Giữ 3 ảnh `prev-` gần nhất (`docker images renco-web`), xoá ảnh cũ hơn bằng `docker rmi renco-web:prev-…`. Repo chưa có tag phiên bản: dùng mã commit của lần gộp PR trên `main`.

## 4. Quay về bản trước (rollback)

Nếu bản mới lỗi và **chưa** có migration mới:

```bash
docker images renco-web                                   # xem các bản prev- đang giữ
docker tag renco-web:prev-YYYYMMDD-HHMM renco-web:latest  # bản tạo ở bước 2 mục 3 của lần cập nhật hỏng
docker compose up -d web
curl -fsS https://renco.vn/api/health
```

Nếu đã chạy migration mới: dừng web, khôi phục cơ sở dữ liệu từ bản sao lưu trước cập nhật (mục 6), rồi chạy ảnh cũ.

## 5. Sao lưu

- `scripts/backup.sh` chạy 02:30 hằng ngày bằng cron: dump PostgreSQL + nén thư mục tệp, mã hoá GPG, đẩy sang nơi lưu khác bằng rclone.
- Giữ 30 bản ngày, 12 bản tuần [ĐX]. Một bản lưu ở nhà cung cấp khác máy chủ chính.
- Theo dõi log `/var/log/renco-backup.log`; ngày nào không có dòng `backup ok` thì báo Quản trị kỹ thuật. Dòng lỗi bắt đầu bằng `BACKUP LOI:` và ghi rõ bước hỏng.
- Kịch bản tự dừng (không in `backup ok`) khi: bản dump rỗng, không tìm thấy ổ tệp tải lên của container web, bản nén tệp gần như rỗng, mã hoá hoặc rclone lỗi.

## 6. Khôi phục (thử mỗi quý trên staging)

Dùng cho cả hai trường hợp: khôi phục tại chỗ, và **dời sang máy chủ mới** (máy mới đã clone mã, tạo `.env` theo mục 2 nhưng chưa chạy web). Giải mã cần khoá **riêng** GPG — làm ở máy của người giữ khoá, rồi chép 2 tệp đã giải mã lên máy chủ.

```bash
# Ở máy giữ khoá riêng
gpg --decrypt db-YYYYMMDD-HHMM.dump.gpg > db.dump
gpg --decrypt uploads-YYYYMMDD-HHMM.tgz.gpg > uploads.tgz

# Ở máy chủ, trong /opt/renco-web
docker compose up -d db                       # bật cơ sở dữ liệu (máy mới: tạo ổ trống)
docker compose stop web 2>/dev/null; docker compose create web   # web không chạy, nhưng có container để biết ổ tệp
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < db.dump
UPLOADS_VOLUME=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data/uploads"}}{{.Name}}{{end}}{{end}}' "$(docker compose ps -a -q web)")
docker run --rm -i -v "$UPLOADS_VOLUME":/data alpine tar xzf - -C /data < uploads.tgz
docker compose up -d                          # bật lại toàn bộ
curl -fsS https://renco.vn/api/health
rm db.dump uploads.tgz                        # 2 tệp này chưa mã hoá, chứa dữ liệu khách
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
| complianceExpiryCheck | mỗi giờ (theo `src/jobs/index.ts`) | Hồ sơ hợp quy còn 60 ngày: báo Pháp chế; hết hạn: sản phẩm về "Sắp ra mắt" |
| anonymizeStaleLeads | 02:00 ngày 1 hằng tháng | Ẩn danh hoá lead không phát sinh liên hệ sau LEAD_RETENTION_MONTHS tháng |

Tạm dừng khi bảo trì: `DISABLE_JOBS=true` rồi `docker compose up -d web`. Tác vụ lỗi hiện ở Quản trị → payload-jobs.
