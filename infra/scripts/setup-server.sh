#!/usr/bin/env bash
# One-shot, re-runnable setup of Bee Store on the Debian server (README §12.6).
#
#   cd /opt/beestore && git pull && bash infra/scripts/setup-server.sh
#
# What it does, in order (each step is skipped when already done):
#   1. checks Docker access, the repository location and the loopback proxy port
#   2. creates /opt/beestore/.env with generated secrets (asks for domain, admin login, tunnel token)
#   3. moves an old tunnel token from infrastructure/cloudflare/.env and removes the old beestore-cloudflared container
#   4. builds and starts the stack (infra/scripts/deploy.sh)
#   5. imports the product catalog once
#   6. checks the site locally and the Cloudflare Tunnel connection
#   7. optionally installs the daily backup and the 5-minute auto-update cron jobs
# It never touches other containers, networks or volumes on this shared server.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env)

green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
red() { printf '\033[31m%s\033[0m\n' "$*" >&2; }
step() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { red "ERROR: $*"; exit 1; }

env_get() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- || true; }
env_set() {
  local key="$1" value="$2" escaped
  escaped="$(printf '%s' "$value" | sed -e 's/[|&\\]/\\&/g')"
  if grep -qE "^$key=" .env; then
    sed -i "s|^$key=.*|$key=$escaped|" .env
  else
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
}
is_placeholder() { [ -z "$1" ] || [[ "$1" == change-me* ]] || [[ "$1" == YOUR_* ]]; }
random_secret() { openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-48; }

# --- 1. Preconditions -------------------------------------------------------------------------------------------
step "1/7 Checking prerequisites"
command -v docker >/dev/null || die "Docker is not installed."
docker info >/dev/null 2>&1 || die "Cannot use Docker as $(whoami). Run: sudo usermod -aG docker $(whoami), then log out and in again."
docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is missing."
command -v openssl >/dev/null || die "openssl is missing (sudo apt-get install -y openssl)."
[ -f docker-compose.prod.yml ] || die "Run this from the Bee Store repository (docker-compose.prod.yml not found in $ROOT)."
green "Docker OK, repository at $ROOT"

# --- 2. .env -------------------------------------------------------------------------------------------------------
step "2/7 Preparing .env"
if [ ! -f .env ]; then
  cp .env.prod.example .env
  green "Created .env from .env.prod.example"
fi
chmod 600 .env

domain="$(env_get DOMAIN)"
if [ -z "$domain" ] || [ "$domain" = "beestore.vn" ]; then
  read -r -p "Your domain (no https://, e.g. beestore.vn): " input
  [ -n "$input" ] && domain="${input#https://}" && domain="${domain#http://}" && domain="${domain%/}"
  [ -n "$domain" ] || die "A domain is required."
  env_set DOMAIN "$domain"
fi
green "DOMAIN=$domain"

for key in DB_PASSWORD JWT_SECRET; do
  if is_placeholder "$(env_get "$key")"; then
    env_set "$key" "$(random_secret)"
    green "Generated $key"
  fi
done

if is_placeholder "$(env_get ADMIN_BOOTSTRAP_PASSWORD)"; then
  read -r -p "Admin email [$(env_get ADMIN_BOOTSTRAP_EMAIL)]: " admin_email
  [ -n "$admin_email" ] && env_set ADMIN_BOOTSTRAP_EMAIL "$admin_email"
  while true; do
    read -r -s -p "Admin password (min 8 chars, letters + digits): " p1; echo
    read -r -s -p "Repeat admin password: " p2; echo
    if [ "$p1" = "$p2" ] && [ "${#p1}" -ge 8 ]; then break; fi
    yellow "Passwords differ or are too short, try again."
  done
  env_set ADMIN_BOOTSTRAP_PASSWORD "$p1"
  green "Admin login saved"
fi

# --- 3. Cloudflare Tunnel token ------------------------------------------------------------------------------------
step "3/7 Cloudflare Tunnel"
token="$(env_get TUNNEL_TOKEN)"
old_env="infrastructure/cloudflare/.env"
if is_placeholder "$token" && [ -f "$old_env" ]; then
  old_token="$(grep -E '^TUNNEL_TOKEN=' "$old_env" | head -1 | cut -d= -f2-)"
  if ! is_placeholder "$old_token"; then
    token="$old_token"
    env_set TUNNEL_TOKEN "$token"
    green "Moved the tunnel token from $old_env"
  fi
fi
if is_placeholder "$token"; then
  echo "Paste the tunnel token (Zero Trust -> Networks -> Tunnels -> your tunnel; the long eyJ... string)."
  read -r -s -p "Tunnel token (hidden): " token; echo
  if is_placeholder "$token" || [[ "$token" != eyJ* ]]; then
    die "That does not look like a tunnel token (it should start with eyJ)."
  fi
  env_set TUNNEL_TOKEN "$token"
fi
green "TUNNEL_TOKEN set (${token:0:6}...)"

if [ -d infrastructure ]; then
  rm -rf infrastructure
  green "Removed the old infrastructure/ folder (token now lives only in .env)"
fi
if docker ps -a --format '{{.Names}}' | grep -qx 'beestore-cloudflared'; then
  docker rm -f beestore-cloudflared >/dev/null
  green "Removed the old beestore-cloudflared container (the stack runs its own tunnel service)"
fi

port="$(env_get PROXY_PORT)"; port="${port:-8088}"
if ss -ltn 2>/dev/null | grep -q ":$port " && ! docker ps --format '{{.Names}}' | grep -qx 'beestore-proxy-1'; then
  die "Port $port is already used by another program. Set PROXY_PORT to a free port in .env and run again."
fi

# --- 4. Build and start --------------------------------------------------------------------------------------------
step "4/7 Building and starting (first time takes several minutes)"
bash infra/scripts/deploy.sh

# --- 5. Catalog import -------------------------------------------------------------------------------------------
step "5/7 Product catalog"
db_user="$(env_get DB_USER)"; db_user="${db_user:-beestore}"
db_name="$(env_get DB_NAME)"; db_name="${db_name:-beestore}"
products="$("${COMPOSE[@]}" exec -T db psql -U "$db_user" -d "$db_name" -tAc 'select count(*) from products' 2>/dev/null || echo 0)"
if [ "${products:-0}" -gt 0 ] 2>/dev/null; then
  green "Catalog already imported ($products products)"
else
  "${COMPOSE[@]}" run --rm api java -jar app.jar --import.catalog.path=/data/product 2>&1 | grep -E 'Catalog import|Import error' || true
fi

# --- 6. Checks -----------------------------------------------------------------------------------------------------
step "6/7 Checking"
code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/" || true)"
[ "$code" = "200" ] && green "Website responds locally (HTTP 200)" || yellow "Website answered HTTP $code locally"
api="$(curl -s "http://127.0.0.1:$port/api/v1/categories" | head -c 60 || true)"
[[ "$api" == *'"success":true'* ]] && green "API responds" || yellow "API check returned: $api"

tunnel_ok=""
for _ in $(seq 1 12); do
  if "${COMPOSE[@]}" logs tunnel 2>/dev/null | grep -q "Registered tunnel connection"; then tunnel_ok=1; break; fi
  sleep 5
done
if [ -n "$tunnel_ok" ]; then
  green "Cloudflare Tunnel connected"
else
  yellow "Tunnel not connected yet. Last log lines:"
  "${COMPOSE[@]}" logs --tail=15 tunnel || true
fi

# --- 7. Backups ----------------------------------------------------------------------------------------------------
step "7/7 Daily backup and automatic updates"
cron_line="0 2 * * * $ROOT/infra/scripts/backup.sh >> $ROOT/backups/backup.log 2>&1"
if ! command -v crontab >/dev/null; then
  yellow "cron is not installed. Install it with: sudo apt-get install -y cron   (then run this script again)"
elif { crontab -l 2>/dev/null || true; } | grep -qF "infra/scripts/backup.sh"; then
  green "Backup cron job already installed"
else
  read -r -p "Install the daily 02:00 backup cron job? [Y/n] " answer
  if [[ ! "$answer" =~ ^[Nn] ]]; then
    mkdir -p "$ROOT/backups"
    # "crontab -l" fails when the user has no crontab yet; that must not abort the script.
    { crontab -l 2>/dev/null || true; echo "$cron_line"; } | crontab -
    green "Backup cron job installed"
  fi
fi

update_line="*/5 * * * * $ROOT/infra/scripts/update.sh >> $ROOT/backups/update.log 2>&1"
if command -v crontab >/dev/null; then
  if { crontab -l 2>/dev/null || true; } | grep -qF "infra/scripts/update.sh"; then
    green "Automatic updates already enabled"
  else
    read -r -p "Enable automatic updates from GitHub (checks every 5 minutes)? [Y/n] " answer
    if [[ ! "$answer" =~ ^[Nn] ]]; then
      mkdir -p "$ROOT/backups"
      { crontab -l 2>/dev/null || true; echo "$update_line"; } | crontab -
      green "Automatic updates enabled (log: $ROOT/backups/update.log)"
    fi
  fi
fi

echo
green "Done."
echo "In Cloudflare (Zero Trust -> Networks -> Tunnels -> your tunnel -> Public Hostname) the hostname"
echo "  $domain  must use  Type: HTTP   URL: proxy:80"
echo "Then open https://$domain"
"${COMPOSE[@]}" ps
