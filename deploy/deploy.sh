#!/usr/bin/env bash
set -Eeuo pipefail

usage() { printf '%s\n' 'Usage: deploy.sh --environment development|staging deploy all' >&2; exit 64; }
fail() { printf 'deploy: %s\n' "$1" >&2; exit 1; }

[[ "$#" == 4 && "$1" == --environment && "$3" == deploy && "$4" == all ]] || usage
environment="$2"
case "$environment" in development|staging) ;; *) usage ;; esac

script_directory="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
deploy_root="${DEPLOY_ROOT:-/srv/expressa}/$environment"
runtime_file="$deploy_root/runtime.env"
lock_file="$deploy_root/state/.deploy.lock"
compose_file="$script_directory/compose.yml"
[[ -f "$runtime_file" && ! -L "$runtime_file" ]] || fail 'runtime.env is missing'
[[ -f "$compose_file" ]] || fail 'compose.yml is missing'

if [[ "${DEPLOY_LOCK_HELD:-}" != 1 ]]; then
  exec flock --exclusive --nonblock --conflict-exit-code 75 "$lock_file" env DEPLOY_LOCK_HELD=1 "$0" "$@"
fi

set -a
# runtime.env is provisioned on the VPS and contains only deployment secrets.
# shellcheck disable=SC1090
source "$runtime_file"
set +a
[[ "${POSTGRES_PASSWORD:-}" ]] || fail 'POSTGRES_PASSWORD is required'
[[ "${BACKEND_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ ]] || fail 'BACKEND_IMAGE must be an immutable digest'
[[ "${FRONT_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ ]] || fail 'FRONT_IMAGE must be an immutable digest'
[[ "${BACK_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ ]] || fail 'BACK_IMAGE must be an immutable digest'
[[ "${BOOTSTRAP_ADMIN_PHONE:-}" =~ ^\+7[0-9]{10}$ ]] || fail 'BOOTSTRAP_ADMIN_PHONE must use +7XXXXXXXXXX'

export DEPLOY_ENV="$environment" COMPOSE_PROJECT_NAME="expressa-$environment"
export POSTGRES_DB="${POSTGRES_DB:-expressa}" POSTGRES_USER="${POSTGRES_USER:-expressa}"
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
compose() { docker compose --file "$compose_file" "$@"; }

compose config -q
compose pull
compose up -d postgres
postgres_id="$(compose ps -q postgres)"
for _ in {1..30}; do
  [[ "$(docker inspect --format '{{.State.Health.Status}}' "$postgres_id")" == healthy ]] && break
  sleep 2
done
[[ "$(docker inspect --format '{{.State.Health.Status}}' "$postgres_id")" == healthy ]] || fail 'postgres did not become healthy'
compose run --rm --no-deps backend dist/scripts/migrate.js
compose run --rm --no-deps -e BOOTSTRAP_ADMIN_PHONE="$BOOTSTRAP_ADMIN_PHONE" backend dist/scripts/seed.js
unset BOOTSTRAP_ADMIN_PHONE
compose up -d
for service in backend front back; do
  container="$(compose ps -q "$service")"
  for _ in {1..30}; do
    [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == healthy ]] && break
    sleep 2
  done
  [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == healthy ]] || fail "$service did not become healthy"
done
