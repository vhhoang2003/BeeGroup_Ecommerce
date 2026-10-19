#!/usr/bin/env bash
# Restore a database dump made by backup.sh (README §10 asks for a monthly restore test).
# Usage: infra/scripts/restore.sh backups/daily/db-20261019-0200.dump[.gpg]
# The API is stopped during the restore and started again afterwards.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
set -a
# shellcheck disable=SC1091
. ./.env
set +a

dump="${1:?usage: restore.sh <dump file>}"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env)

if [[ "$dump" == *.gpg ]]; then
  plain="$(mktemp)"
  trap 'rm -f "$plain"' EXIT
  gpg --batch --yes --decrypt --output "$plain" "$dump"
  dump="$plain"
fi

read -r -p "This replaces the current database '${DB_NAME:-beestore}'. Type RESTORE to continue: " answer
[ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 1; }

"${COMPOSE[@]}" stop api
"${COMPOSE[@]}" exec -T db pg_restore -U "${DB_USER:-beestore}" -d "${DB_NAME:-beestore}" \
  --clean --if-exists --no-owner < "$dump"
"${COMPOSE[@]}" start api
echo "Restore finished."
