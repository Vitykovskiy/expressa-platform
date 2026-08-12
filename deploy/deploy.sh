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
  exec flock --exclusive --nonblock --conflict-exit-code 75 "$lock_file" env DEPLOY_LOCK_HELD=1 bash -- "$0" "$@"
fi

set -a
# runtime.env is provisioned on the VPS and contains only deployment secrets.
# shellcheck disable=SC1090
source "$runtime_file"
set +a
if [[ "$environment" == staging ]]; then
  smoke_customer_phone='+79990000001'
  [[ "${BOOTSTRAP_ADMIN_PHONE:-}" =~ ^\+7[0-9]{10}$ ]] || fail 'BOOTSTRAP_ADMIN_PHONE must use +7XXXXXXXXXX'
  [[ "${STAGING_AUTH_ACCESS_TOKEN_SECRET:-}" ]] || fail 'STAGING_AUTH_ACCESS_TOKEN_SECRET is required'
  [[ "${STAGING_AUTH_OTP_PEPPER:-}" ]] || fail 'STAGING_AUTH_OTP_PEPPER is required'
  [[ "${STAGING_CORS_ORIGINS:-}" ]] || fail 'STAGING_CORS_ORIGINS is required'
  AUTH_ACCESS_TOKEN_SECRET="$STAGING_AUTH_ACCESS_TOKEN_SECRET"
  AUTH_OTP_PEPPER="$STAGING_AUTH_OTP_PEPPER"
  CORS_ORIGINS="$STAGING_CORS_ORIGINS"
  AUTH_OTP_MODE=staging_test
  STAGING_TEST_OTP_CODE=000000
  STAGING_TEST_PHONE_ALLOWLIST="$BOOTSTRAP_ADMIN_PHONE,$smoke_customer_phone"
  export AUTH_ACCESS_TOKEN_SECRET AUTH_OTP_PEPPER CORS_ORIGINS AUTH_OTP_MODE STAGING_TEST_OTP_CODE STAGING_TEST_PHONE_ALLOWLIST
  unset STAGING_AUTH_ACCESS_TOKEN_SECRET STAGING_AUTH_OTP_PEPPER STAGING_CORS_ORIGINS
fi
[[ "${POSTGRES_PASSWORD:-}" ]] || fail 'POSTGRES_PASSWORD is required'
[[ "${AUTH_ACCESS_TOKEN_SECRET:-}" ]] || fail 'AUTH_ACCESS_TOKEN_SECRET is required'
[[ "${AUTH_OTP_PEPPER:-}" ]] || fail 'AUTH_OTP_PEPPER is required'
[[ "${CORS_ORIGINS:-}" ]] || fail 'CORS_ORIGINS is required'
if [[ "$environment" == development ]]; then
  [[ "${AUTH_DEVELOPMENT_OTP:-}" =~ ^[0-9]{6}$ ]] || fail 'AUTH_DEVELOPMENT_OTP must contain six digits'
else
  [[ "${AUTH_OTP_MODE:-}" ]] || fail 'AUTH_OTP_MODE is required'
  [[ "${STAGING_TEST_OTP_CODE:-}" ]] || fail 'STAGING_TEST_OTP_CODE is required'
  [[ "${STAGING_TEST_PHONE_ALLOWLIST:-}" ]] || fail 'STAGING_TEST_PHONE_ALLOWLIST is required'
fi
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
if [[ "$environment" == development ]]; then
  unset BOOTSTRAP_ADMIN_PHONE
fi
compose up -d
for service in backend front back; do
  container="$(compose ps -q "$service")"
  for _ in {1..30}; do
    [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == healthy ]] && break
    sleep 2
  done
  [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == healthy ]] || fail "$service did not become healthy"
done
if [[ "$environment" == staging ]]; then
  backend_container="$(compose ps -q backend)"
  docker exec --interactive --env SMOKE_CUSTOMER_PHONE="$smoke_customer_phone" --env SMOKE_STAFF_PHONE="$BOOTSTRAP_ADMIN_PHONE" "$backend_container" \
    /nodejs/bin/node --input-type=module - < "$script_directory/smoke-staging.mjs"
  unset BOOTSTRAP_ADMIN_PHONE
fi
