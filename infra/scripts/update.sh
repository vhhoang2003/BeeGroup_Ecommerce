#!/usr/bin/env bash
# Pull-based continuous deployment (README §13.4, D-16). Run by cron every 5 minutes:
#   */5 * * * * /opt/beestore/infra/scripts/update.sh >> /opt/beestore/backups/update.log 2>&1
#
# 1. fast-forwards the repository (compose file, Caddyfile, product data, scripts)
# 2. pulls the :main images that .github/workflows/cd.yml published to GHCR
# 3. if anything changed: restarts the stack, waits for the API to be healthy,
#    and rolls the images back to the previous versions if it is not
# Does nothing (and prints nothing) when there is no new version.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env)
log() { echo "[$(date -Is)] $*"; }

# Never run two updates at once (cron overlap, or a manual run during a cron run).
exec 9>"$ROOT/.update.lock"
flock -n 9 || exit 0

[ -f .env ] || { log ".env missing"; exit 1; }

# --- 1. Repository ---------------------------------------------------------------------------------------------------
git fetch -q origin main
config_changed=""
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  git pull -q --ff-only
  config_changed=1
fi

# --- 2. Images -------------------------------------------------------------------------------------------------------
mapfile -t refs < <("${COMPOSE[@]}" config --images | grep -E '/beestore-(api|web):')
image_id() { docker image inspect -f '{{.Id}}' "$1" 2>/dev/null || echo none; }

declare -A before
for ref in "${refs[@]}"; do before[$ref]="$(image_id "$ref")"; done

if ! "${COMPOSE[@]}" pull -q api web 2>/tmp/beestore-pull.err; then
  log "pull failed: $(tail -1 /tmp/beestore-pull.err)"
  exit 1
fi

images_changed=""
for ref in "${refs[@]}"; do
  [ "${before[$ref]}" != "$(image_id "$ref")" ] && images_changed=1
done

if [ -z "$config_changed" ] && [ -z "$images_changed" ]; then
  exit 0
fi

# --- 3. Restart, verify, roll back -----------------------------------------------------------------------------------
log "new version (repo: ${config_changed:-unchanged}, images: ${images_changed:-unchanged}) at $(git rev-parse --short HEAD); restarting"
"${COMPOSE[@]}" up -d --remove-orphans

healthy=""
for _ in $(seq 1 36); do
  if [ "$(docker inspect -f '{{.State.Health.Status}}' beestore-api-1 2>/dev/null)" = "healthy" ]; then
    healthy=1
    break
  fi
  sleep 5
done

if [ -z "$healthy" ]; then
  log "API not healthy after the update; rolling back images"
  "${COMPOSE[@]}" logs --tail=40 api || true
  for ref in "${refs[@]}"; do
    [ "${before[$ref]}" != none ] && docker tag "${before[$ref]}" "$ref"
  done
  "${COMPOSE[@]}" up -d --remove-orphans
  log "rolled back"
  exit 1
fi

docker image prune -f >/dev/null
log "update finished, API healthy"
