#!/usr/bin/env bash
set -Eeuo pipefail

usage() { printf '%s\n' 'Usage: deploy.sh --environment development deploy all' >&2; exit 64; }
fail() { printf 'deploy: %s\n' "$1" >&2; exit 1; }
passed() { printf 'expressa-release-evidence: check=%s status=passed\n' "$1" >&2; }

[[ "$#" == 4 && "$1" == --environment && "$2" == development && "$3" == deploy && "$4" == all ]] || usage
script_directory="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
deploy_root="${DEPLOY_ROOT:-/srv/expressa}/development"
runtime_file="$deploy_root/runtime.env"
lock_file="$deploy_root/state/.deploy.lock"
compose_file="$script_directory/compose.yml"
[[ -f "$runtime_file" && ! -L "$runtime_file" && -f "$compose_file" ]] || fail 'deployment inputs are missing'

if [[ "${DEPLOY_LOCK_HELD:-}" != 1 ]]; then
  exec flock --exclusive --nonblock --conflict-exit-code 75 "$lock_file" env DEPLOY_LOCK_HELD=1 bash -- "$0" "$@"
fi
set -a
# runtime.env is provisioned on the VPS and contains only deployment secrets.
# shellcheck disable=SC1090
source "$runtime_file"
set +a
[[ "${DELIVERY_BOOTSTRAP_ADMIN_PHONE:-}" =~ ^\+7[0-9]{10}$ && "${DELIVERY_AUTH_DEVELOPMENT_OTP:-}" =~ ^[0-9]{6}$ ]] || fail 'development bootstrap settings are invalid'
[[ "${DELIVERY_VAPID_SUBJECT:-}" && "${DELIVERY_VAPID_PUBLIC_KEY:-}" && "${DELIVERY_VAPID_PRIVATE_KEY:-}" ]] || fail 'VAPID settings are required'
[[ "${POSTGRES_PASSWORD:-}" && "${AUTH_ACCESS_TOKEN_SECRET:-}" && "${AUTH_OTP_PEPPER:-}" && "${CORS_ORIGINS:-}" ]] || fail 'runtime settings are required'
[[ "${BACKEND_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ && "${FRONT_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ && "${BACK_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ ]] || fail 'image digest is invalid'

export DEPLOY_ENV=development NODE_ENV=development COMPOSE_PROJECT_NAME=expressa-development
export POSTGRES_DB="${POSTGRES_DB:-expressa}" POSTGRES_USER="${POSTGRES_USER:-expressa}"
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
export BOOTSTRAP_ADMIN_PHONE="$DELIVERY_BOOTSTRAP_ADMIN_PHONE" AUTH_DEVELOPMENT_OTP="$DELIVERY_AUTH_DEVELOPMENT_OTP"
export VAPID_SUBJECT="$DELIVERY_VAPID_SUBJECT" VAPID_PUBLIC_KEY="$DELIVERY_VAPID_PUBLIC_KEY" VAPID_PRIVATE_KEY="$DELIVERY_VAPID_PRIVATE_KEY"
compose() { docker compose --file "$compose_file" "$@"; }

validate_development_reset_context() {
  [[ "$DEPLOY_ENV" == development && "$COMPOSE_PROJECT_NAME" == expressa-development ]] || fail 'development database reset context is invalid'
  [[ "$POSTGRES_DB" =~ ^[A-Za-z_][A-Za-z0-9_]*$ && "$POSTGRES_USER" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || fail 'database identifiers are invalid'
  case "$POSTGRES_DB" in postgres|template0|template1) fail 'POSTGRES_DB must not be a PostgreSQL system database' ;; esac
}

reset_development_database() {
  local project_label service_label
  validate_development_reset_context
  project_label="$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' "$postgres_id")"
  service_label="$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.service" }}' "$postgres_id")"
  [[ "$project_label" == expressa-development && "$service_label" == postgres ]] || fail 'postgres labels do not authorize reset'
  docker exec "$postgres_id" dropdb --force --if-exists --maintenance-db=postgres --username "$POSTGRES_USER" "$POSTGRES_DB"
  docker exec "$postgres_id" createdb --maintenance-db=postgres --username "$POSTGRES_USER" --owner "$POSTGRES_USER" "$POSTGRES_DB"
  passed 'development database reset'
}

compose config -q
compose up -d postgres
postgres_id="$(compose ps -q postgres)"
for _ in {1..30}; do
  [[ "$(docker inspect --format '{{.State.Health.Status}}' "$postgres_id")" == healthy ]] && break
  sleep 2
done
[[ "$(docker inspect --format '{{.State.Health.Status}}' "$postgres_id")" == healthy ]] || fail 'postgres did not become healthy'
compose pull
compose stop backend front back
reset_development_database
compose run --rm --no-deps backend dist/scripts/initialize-database.js
passed 'database initialization'
compose run --rm --no-deps backend dist/scripts/seed.js
passed seed
compose up -d
for service in backend front back; do
  container="$(compose ps -q "$service")"
  for _ in {1..30}; do
    [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == healthy ]] && break
    sleep 2
  done
  [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == healthy ]] || fail "$service did not become healthy"
  passed "$service health"
done
