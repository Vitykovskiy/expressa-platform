#!/usr/bin/env bash
set -Eeuo pipefail

fail() { printf '%s\n' "restore: $1" >&2; exit 1; }
: "${BACKUP_FILE:?BACKUP_FILE is required}"
: "${BACKUP_ENCRYPTION_KEY_FILE:?BACKUP_ENCRYPTION_KEY_FILE is required}"
: "${BACKUP_INTEGRITY_KEY_FILE:?BACKUP_INTEGRITY_KEY_FILE is required}"
: "${RUNTIME_ENV_FILE:?RUNTIME_ENV_FILE is required}"
: "${COMPOSE_FILE:?COMPOSE_FILE is required}"
: "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
: "${FRONT_IMAGE:?FRONT_IMAGE is required}"
: "${BACK_IMAGE:?BACK_IMAGE is required}"
[[ -f "$BACKUP_FILE" && ! -L "$BACKUP_FILE" ]] || fail 'backup file is unavailable'
[[ -r "$BACKUP_ENCRYPTION_KEY_FILE" && ! -L "$BACKUP_ENCRYPTION_KEY_FILE" ]] || fail 'backup encryption key is unavailable'
[[ -r "$BACKUP_INTEGRITY_KEY_FILE" && ! -L "$BACKUP_INTEGRITY_KEY_FILE" ]] || fail 'backup integrity key is unavailable'
[[ -f "$RUNTIME_ENV_FILE" && ! -L "$RUNTIME_ENV_FILE" ]] || fail 'runtime environment file is unavailable'
[[ -f "$COMPOSE_FILE" && ! -L "$COMPOSE_FILE" ]] || fail 'compose file is unavailable'

started_at="$(date +%s)"
restore_id="$(date +%s)-$$"
restore_project="expressa-restore-$restore_id"
backup_mac_file="$BACKUP_FILE.sha256"
[[ -f "$backup_mac_file" && ! -L "$backup_mac_file" ]] || fail 'backup integrity MAC is unavailable'
export BACKEND_IMAGE FRONT_IMAGE BACK_IMAGE
set -a
# runtime environment supplies database and backend secrets without printing them.
source "$RUNTIME_ENV_FILE"
set +a
export DEPLOY_ENV="restore-$restore_id"
export COMPOSE_PROJECT_NAME="$restore_project"
export NODE_ENV=local AUTH_DEVELOPMENT_OTP=000000
unset AUTH_OTP_MODE STAGING_TEST_OTP_CODE STAGING_TEST_PHONE_ALLOWLIST
export POSTGRES_DB="${POSTGRES_DB:-expressa}" POSTGRES_USER="${POSTGRES_USER:-expressa}"
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
edge_network="expressa-${DEPLOY_ENV}-edge"
data_network="expressa-${DEPLOY_ENV}-data"
cleanup() {
  docker compose --project-name "$restore_project" --file "$COMPOSE_FILE" down --volumes --remove-orphans >/dev/null 2>&1 || true
  docker network rm "$edge_network" "$data_network" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker network create "$edge_network" >/dev/null
docker network create "$data_network" >/dev/null
compose() { docker compose --project-name "$restore_project" --file "$COMPOSE_FILE" "$@"; }
expected_mac="$(tr -d '\r\n' < "$backup_mac_file")"
actual_mac="$(openssl dgst -sha256 -mac HMAC -macopt "key:file:$BACKUP_INTEGRITY_KEY_FILE" -binary "$BACKUP_FILE" | openssl base64 -A)"
[[ "$expected_mac" == "$actual_mac" ]] || fail 'backup integrity MAC mismatch'
compose config -q
compose up -d postgres
postgres_id="$(compose ps -q postgres)"
for _ in {1..30}; do
  [[ "$(docker inspect --format '{{.State.Health.Status}}' "$postgres_id")" == healthy ]] && break
  sleep 2
done
[[ "$(docker inspect --format '{{.State.Health.Status}}' "$postgres_id")" == healthy ]] || fail 'isolated postgres did not become healthy'
openssl enc -d -aes-256-cbc -pbkdf2 -pass "file:$BACKUP_ENCRYPTION_KEY_FILE" -in "$BACKUP_FILE" | \
  compose exec -T postgres psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=1
compose run --rm --no-deps backend dist/scripts/migrate.js
compose up -d backend
backend_id="$(compose ps -q backend)"
for _ in {1..30}; do
  [[ "$(docker inspect --format '{{.State.Health.Status}}' "$backend_id")" == healthy ]] && break
  sleep 2
done
[[ "$(docker inspect --format '{{.State.Health.Status}}' "$backend_id")" == healthy ]] || fail 'isolated backend did not become healthy'
compose exec -T backend /nodejs/bin/node -e "fetch('http://127.0.0.1:3000/health/ready').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

backup_timestamp="$(date -r "$BACKUP_FILE" +%s)"
completed_at="$(date +%s)"
printf 'expressa-restore-verify: status=passed rpo_seconds=%s rto_seconds=%s\n' \
  "$((completed_at - backup_timestamp))" "$((completed_at - started_at))"
