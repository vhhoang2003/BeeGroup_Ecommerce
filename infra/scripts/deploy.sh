#!/usr/bin/env bash
# Pull the latest main, rebuild and restart the production stack, wait until the API is healthy, then clean up.
# Usage: infra/scripts/deploy.sh            (run from anywhere; uses the repository root)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env)

[ -f .env ] || { echo ".env missing: cp .env.prod.example .env and fill it in" >&2; exit 1; }

echo "==> git pull"
git pull --ff-only

echo "==> build images"
"${COMPOSE[@]}" build --pull

echo "==> start / update containers"
"${COMPOSE[@]}" up -d --remove-orphans

echo "==> waiting for the API to become healthy"
for _ in $(seq 1 40); do
  status="$(docker inspect -f '{{.State.Health.Status}}' beestore-api-1 2>/dev/null || echo starting)"
  if [ "$status" = "healthy" ]; then
    echo "API healthy"
    break
  fi
  sleep 5
done
if [ "$status" != "healthy" ]; then
  echo "API did not become healthy; recent logs:" >&2
  "${COMPOSE[@]}" logs --tail=80 api >&2
  exit 1
fi

echo "==> removing dangling images"
docker image prune -f >/dev/null
"${COMPOSE[@]}" ps
