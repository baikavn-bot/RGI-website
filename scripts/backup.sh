#!/usr/bin/env sh
# Sao lưu hằng ngày: cơ sở dữ liệu + thư mục tệp tải lên, mã hoá, đẩy sang nơi lưu trữ khác.
# Cron gợi ý (giờ máy chủ): 30 2 * * * /opt/renco-web/scripts/backup.sh >> /var/log/renco-backup.log 2>&1
#
# Cần trong .env (cạnh docker-compose.yml):
#   BACKUP_GPG_RECIPIENT  email hoặc mã khoá công khai GPG dùng để mã hoá (khoá riêng giữ ở nơi khác máy chủ)
#   BACKUP_REMOTE         remote rclone đã cấu hình, ví dụ "renco-offsite:renco-backup"
#   BACKUP_DIR            (tuỳ chọn) thư mục tạm trên máy chủ, mặc định /var/backups/renco
# Cần cài: docker compose, gpg, rclone.
#
# Chỉ in "backup ok" khi cả hai bản sao lưu có nội dung và đã đẩy đi. Lỗi ở bất kỳ bước nào → dừng, mã thoát khác 0,
# log không có dòng "backup ok" (RUNBOOK mục 5 dựa vào dòng này để báo động).
set -eu

cd "$(dirname "$0")/.."
. ./.env

fail() {
  echo "$(date -Iseconds) BACKUP LOI: $*" >&2
  exit 1
}

: "${BACKUP_GPG_RECIPIENT:?thiếu BACKUP_GPG_RECIPIENT trong .env}"
: "${BACKUP_REMOTE:?thiếu BACKUP_REMOTE trong .env}"

STAMP=$(date +%Y%m%d-%H%M)
OUT=${BACKUP_DIR:-/var/backups/renco}
mkdir -p "$OUT"
DB_FILE="$OUT/db-$STAMP.dump"
UP_FILE="$OUT/uploads-$STAMP.tgz"
# Bản chưa mã hoá chứa dữ liệu khách: dù thành công hay lỗi giữa chừng, khi thoát luôn xoá.
trap 'rm -f "$DB_FILE" "$UP_FILE"' EXIT

# 1. Cơ sở dữ liệu
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom > "$DB_FILE" || fail "pg_dump không chạy được"
[ -s "$DB_FILE" ] || fail "bản dump cơ sở dữ liệu rỗng"

# 2. Ảnh, PDF — lấy đúng ổ dữ liệu đang gắn vào container web.
# Không ghi cứng tên ổ: Docker đặt tên theo thư mục chứa dự án (vd. renco-web_uploads), đổi thư mục là đổi tên.
WEB_ID=$(docker compose ps -a -q web)
[ -n "$WEB_ID" ] || fail "không thấy container web của dự án này"
UPLOADS_VOLUME=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data/uploads"}}{{.Name}}{{end}}{{end}}' "$WEB_ID")
[ -n "$UPLOADS_VOLUME" ] || fail "container web không gắn ổ dữ liệu vào /data/uploads"
docker run --rm -v "$UPLOADS_VOLUME":/data:ro -v "$OUT":/out alpine tar czf "/out/uploads-$STAMP.tgz" -C /data . || fail "nén thư mục tệp không chạy được"
# Ổ mới chưa có tệp nào vẫn có 2 thư mục con media/, documents/ (Dockerfile tạo sẵn); ít hơn là ổ sai.
ENTRIES=$(docker run --rm -v "$OUT":/out:ro alpine tar tzf "/out/uploads-$STAMP.tgz" | wc -l)
[ "$ENTRIES" -ge 3 ] || fail "bản nén tệp tải lên gần như rỗng ($ENTRIES mục) — ổ $UPLOADS_VOLUME có đúng không?"

# 3. Mã hoá rồi mới xoá bản chưa mã hoá (tách 2 lệnh: gpg lỗi thì dừng, không xoá bản gốc)
for f in "$DB_FILE" "$UP_FILE"; do
  gpg --batch --yes --trust-model always --encrypt --recipient "$BACKUP_GPG_RECIPIENT" "$f" || fail "mã hoá $f không được"
  [ -s "$f.gpg" ] || fail "bản mã hoá $f.gpg rỗng"
  rm "$f"
done

# 4. Đẩy sang nơi khác (giữ 30 bản ngày; bản tuần giữ 12 tuần do quy tắc vòng đời của nơi lưu)
rclone copy "$OUT" "$BACKUP_REMOTE/daily" --include "*-$STAMP.*.gpg" || fail "rclone không đẩy được bản sao lưu đi"
find "$OUT" -name '*.gpg' -mtime +7 -delete

echo "$(date -Iseconds) backup ok $STAMP · db $(wc -c < "$DB_FILE.gpg") byte · tệp $ENTRIES mục (ổ $UPLOADS_VOLUME)"
