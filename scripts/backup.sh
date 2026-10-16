#!/usr/bin/env sh
# Sao lưu hằng ngày: cơ sở dữ liệu + thư mục tệp tải lên, mã hoá, đẩy sang nơi lưu trữ khác.
# Cron gợi ý (giờ máy chủ): 30 2 * * * /opt/renco-web/scripts/backup.sh >> /var/log/renco-backup.log 2>&1
# Cần: docker compose, gpg (khoá công khai BACKUP_GPG_RECIPIENT), rclone đã cấu hình remote BACKUP_REMOTE.
set -eu

cd "$(dirname "$0")/.."
. ./.env

STAMP=$(date +%Y%m%d-%H%M)
OUT=${BACKUP_DIR:-/var/backups/renco}
mkdir -p "$OUT"

# 1. Cơ sở dữ liệu
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom > "$OUT/db-$STAMP.dump"

# 2. Ảnh, PDF
docker run --rm -v renco-web_uploads:/data:ro -v "$OUT":/out alpine tar czf "/out/uploads-$STAMP.tgz" -C /data .

# 3. Mã hoá
for f in "$OUT/db-$STAMP.dump" "$OUT/uploads-$STAMP.tgz"; do
  gpg --batch --yes --encrypt --recipient "$BACKUP_GPG_RECIPIENT" "$f" && rm "$f"
done

# 4. Đẩy sang nơi khác (giữ 30 bản ngày; bản tuần giữ 12 tuần do quy tắc vòng đời của nơi lưu)
rclone copy "$OUT" "$BACKUP_REMOTE/daily" --include "*-$STAMP.*.gpg"
find "$OUT" -name '*.gpg' -mtime +7 -delete

echo "$(date -Iseconds) backup ok $STAMP"
