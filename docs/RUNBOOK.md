# Sổ tay vận hành renvindo.com

Người giữ: Quản trị kỹ thuật RGI. Mọi thao tác trên production ghi phiếu WEB- theo QT-08.

## 1. Chuẩn bị máy chủ (một lần)

1. Máy chủ ảo tại Việt Nam, Ubuntu 24.04, 2 vCPU, 4 GB RAM, 80 GB SSD [ĐX]. **Bật swap ≥ 4 GB** trước khi build: bước `pnpm build` trong Docker dùng hơn 2 GB RAM; máy 3,6 GB không swap đã bị hệ điều hành giết tiến trình build (và cả tiến trình hệ thống) khi thử trên VPS test 20/10/2026. Kiểm: `free -h` có dòng `Swap:` khác 0.
2. Chỉ dùng khoá SSH; tắt đăng nhập root và mật khẩu; tường lửa chỉ mở 22 (giới hạn IP), 80, 443.
3. Cài Docker Engine + Docker Compose plugin, `gpg`, `rclone`.
4. DNS: bản ghi A `renvindo.com`, `www.renvindo.com` trỏ về máy chủ; SPF, DKIM, DMARC theo nhà cung cấp email.
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

Mở `https://renvindo.com/admin`, tạo tài khoản đầu tiên. **Ô «Vai trò» mặc định là Sales — đổi thành «Giám đốc»** trước khi bấm Tạo; quên đổi thì tài khoản này không tạo được người dùng khác và phải sửa thẳng trong cơ sở dữ liệu. Quét mã xác thực hai lớp. Giám đốc tạo các tài khoản còn lại (mỗi người một tài khoản).

Ngay sau đó, nhập **Cài đặt website** (tên doanh nghiệp, mã số thuế, địa chỉ, hotline, email). Chưa nhập thì website ẩn mọi nút gọi, chân trang để trống.

Chạy thử sao lưu một lần (`./scripts/backup.sh`), kiểm log có dòng `backup ok`, rồi mới cài cron (mục 5).

**Bẫy khi điền `.env`:** các biến số (`FORM_RATE_LIMIT`, `LEAD_RETENTION_MONTHS`) nếu **có mặt mà để trống** sẽ bị hiểu là 0 — mọi form bị chặn «gửi quá nhiều lần», lead bị ẩn danh hoá ngay lần chạy tác vụ đầu. Luôn tạo `.env` bằng cách chép `.env.example` (đã có giá trị mặc định) rồi sửa, không viết `.env` từ đầu.

**Kiểm trang bằng `curl`:** luôn kèm giới hạn chờ, ví dụ `curl -m 30 …`. Không có `-m` thì web treo là lệnh chờ mãi.

Không chạy `pnpm seed` trên production.

## 3. Cập nhật phiên bản

```bash
cd /opt/renco-web
./scripts/backup.sh                                            # 1. luôn sao lưu trước; không thấy "backup ok" thì DỪNG
docker tag renco-web:latest renco-web:prev-$(date +%Y%m%d-%H%M) # 2. giữ ảnh ĐANG CHẠY làm bản quay lui — phải làm TRƯỚC khi build
git fetch && git checkout <tag hoặc mã commit đã gộp vào main>  # 3. lấy mã mới
docker compose build web                                       # 4. build ảnh mới (ghi đè renco-web:latest)
docker compose up -d web                                       # 5. chạy ảnh mới; migration mới (nếu có) tự chạy
curl -fsS https://renvindo.com/api/health                          # 6. phải trả {"ok":true,"db":"ok"}
```

Giữ 3 ảnh `prev-` gần nhất (`docker images renco-web`), xoá ảnh cũ hơn bằng `docker rmi renco-web:prev-…`. Repo chưa có tag phiên bản: dùng mã commit của lần gộp PR trên `main`.

## 4. Quay về bản trước (rollback)

Nếu bản mới lỗi và **chưa** có migration mới:

```bash
docker images renco-web                                   # xem các bản prev- đang giữ
docker tag renco-web:prev-YYYYMMDD-HHMM renco-web:latest  # bản tạo ở bước 2 mục 3 của lần cập nhật hỏng
docker compose up -d web
curl -fsS https://renvindo.com/api/health
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
curl -fsS https://renvindo.com/api/health
rm db.dump uploads.tgz                        # 2 tệp này chưa mã hoá, chứa dữ liệu khách
```

Ghi thời gian khôi phục thực tế vào phiếu. Mục tiêu ≤ 4 giờ, mất tối đa 24 giờ dữ liệu [ĐX].

## 7. Giám sát

- Kiểm tra `https://renvindo.com/api/health` mỗi 5 phút (UptimeRobot, Uptime Kuma hoặc tương đương).
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

## 10. Chạy sau nginx có sẵn (máy chủ dùng chung, ví dụ aaPanel)

Dùng khi máy chủ đã có nginx giữ cổng 80/443 cho các website khác (VPS test dùng chung). **Máy chủ production riêng cho renvindo.com dùng cách chuẩn với Caddy ở mục 2**, không dùng mục này.

Khác cách chuẩn: không chạy Caddy; web mở ở `127.0.0.1:3100`; nginx của máy chủ lo HTTPS và chuyển tiếp vào. Lớp chặn `/admin` theo IP (`ADMIN_ALLOW_IPS`) nằm ở Caddy nên **không có hiệu lực** — trang quản trị chỉ còn mật khẩu, 2FA và khoá tài khoản.

1. Thêm vào `.env` (ngoài các biến ở mục 2):

   ```bash
   COMPOSE_FILE=docker-compose.yml:deploy/compose.sau-nginx.yml
   # WEB_LOCAL_PORT=3100   # đổi nếu cổng 3100 đã có chương trình khác dùng
   ```

   Nhờ dòng `COMPOSE_FILE`, mọi lệnh `docker compose …` ở các mục khác (kể cả `scripts/backup.sh`) chạy đúng như cũ mà không cần thêm `-f`.
2. `docker compose up -d --build` → chỉ có `web` và `db` chạy. Kiểm tra: `curl -fsS http://127.0.0.1:3100/api/health` trả `{"ok":true,"db":"ok"}`.
3. Trong bảng điều khiển của nginx (aaPanel: Website → Add site → tên miền), bật **Reverse proxy** tới `http://127.0.0.1:3100`, rồi bật SSL Let's Encrypt cho tên miền. Khối cấu hình chuyển tiếp phải có các dòng sau (aaPanel thường tự thêm — mở «Config file» của site để kiểm):

   ```nginx
   proxy_set_header Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   client_max_body_size 20m;   # ảnh, PDF tải lên tới 20 MB
   ```

   Thiếu `X-Real-IP` thì mọi khách bị coi là cùng một IP: giới hạn 5 lần gửi form / 10 phút áp cho **cả website**. Thiếu `client_max_body_size` thì tải ảnh lớn trong trang quản trị báo lỗi 413.
4. Chỉ sửa cấu hình của **đúng site này** trong aaPanel; không sửa cấu hình nginx chung — các website khác trên máy chủ dùng chung nó.

## 11. Nạp dữ liệu mẫu trên máy chủ THỬ (không bao giờ trên production)

Ảnh production (`renco-web:latest`) không có lệnh seed. Trên máy chủ thử, dùng một container tạm build từ tầng `builder` của `Dockerfile`:

```bash
cd /opt/renco-web
docker build --target builder -t renco-web:builder --build-arg NEXT_PUBLIC_SITE_URL="$(grep '^NEXT_PUBLIC_SITE_URL=' .env | cut -d= -f2)" .
: > .seed-credentials && chmod 600 .seed-credentials
NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' "$(docker compose ps -q db)")
VOL=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data/uploads"}}{{.Name}}{{end}}{{end}}' "$(docker compose ps -q web)")
( set -a; . ./.env; set +a; docker run --rm --network "$NET" -v "$VOL":/data/uploads -v "$PWD/.seed-credentials":/app/.seed-credentials \
  -e NODE_ENV=production -e ALLOW_SEED=true -e DISABLE_JOBS=true -e UPLOAD_DIR=/data/uploads \
  -e DATABASE_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@db:5432/$POSTGRES_DB" -e PAYLOAD_SECRET="$PAYLOAD_SECRET" \
  -e NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" renco-web:builder sh -c 'corepack enable pnpm >/dev/null 2>&1; pnpm seed' )
docker compose up -d --force-recreate web    # bỏ bộ nhớ đệm cũ để hiện ngay dữ liệu mới
```

- **Bắt buộc `NODE_ENV=production`.** Thiếu biến này, Payload chạy chế độ dev: tự sửa cấu trúc bảng và để lại dấu «dev mode». Lần khởi động sau, web production **dừng chờ câu hỏi xác nhận** và treo (`unhealthy`) — đã gặp trên VPS test 20/10/2026. Cách gỡ: xoá database, cho web chạy migration lại, seed lại đúng lệnh trên.
- Mật khẩu 7 tài khoản mẫu ghi vào `.seed-credentials` (chỉ root đọc). Seed **xoá** sản phẩm, trang, ảnh hiện có — chỉ dùng trên máy chủ thử chứa dữ liệu mẫu.
