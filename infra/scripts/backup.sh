#!/usr/bin/env bash
# Daily backup (README §10 / §16): compressed PostgreSQL dump + uploaded images.
# Keeps 14 daily and 8 weekly (Sunday) copies. Optionally encrypts with GPG and copies off-site with rclone.
# Cron (02:00 ICT):  0 2 * * * /opt/beestore/infra/scripts/backup.sh >> /opt/beestore/backups/backup.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
set -a
# shellcheck disable=SC1091
. ./.env
set +a

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date +%Y%m%d-%H%M)"
mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"
umask 077

db_file="$BACKUP_DIR/daily/db-$STAMP.dump"
uploads_file="$BACKUP_DIR/daily/uploads-$STAMP.tar.gz"

echo "[$(date -Is)] dumping database"
docker compose -f docker-compose.prod.yml --env-file .env exec -T db \
  pg_dump -U "${DB_USER:-beestore}" -d "${DB_NAME:-beestore}" -Fc > "$db_file"

echo "[$(date -Is)] archiving uploads"
docker run --rm -v beestore_uploads:/data:ro -v "$BACKUP_DIR/daily":/out alpine \
  tar czf "/out/$(basename "$uploads_file")" -C /data .

if [ -n "${BACKUP_GPG_RECIPIENT:-}" ]; then
  for f in "$db_file" "$uploads_file"; do
    gpg --batch --yes --encrypt --recipient "$BACKUP_GPG_RECIPIENT" --output "$f.gpg" "$f" && rm -f "$f"
  done
fi

if [ "$(date +%u)" = "7" ]; then
  cp "$BACKUP_DIR"/daily/*-"$STAMP"* "$BACKUP_DIR/weekly/"
fi

# Retention: 14 daily, 8 weekly (two files per run: db + uploads).
ls -1t "$BACKUP_DIR"/daily/db-* 2>/dev/null | tail -n +15 | xargs -r rm -f
ls -1t "$BACKUP_DIR"/daily/uploads-* 2>/dev/null | tail -n +15 | xargs -r rm -f
ls -1t "$BACKUP_DIR"/weekly/db-* 2>/dev/null | tail -n +9 | xargs -r rm -f
ls -1t "$BACKUP_DIR"/weekly/uploads-* 2>/dev/null | tail -n +9 | xargs -r rm -f

if [ -n "${BACKUP_RCLONE_REMOTE:-}" ]; then
  rclone sync "$BACKUP_DIR" "$BACKUP_RCLONE_REMOTE" --exclude backup.log
fi

echo "[$(date -Is)] backup done: $(du -sh "$BACKUP_DIR" | cut -f1) in $BACKUP_DIR"
