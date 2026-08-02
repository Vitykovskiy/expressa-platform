#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

script_directory="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
readonly script_directory
infrastructure_directory="$(CDPATH='' cd -- "$script_directory/.." && pwd -P)"
readonly infrastructure_directory
readonly compose_file="$infrastructure_directory/compose.yml"
readonly docker_bin="${DEPLOY_DOCKER_BIN:-docker}"
readonly flock_bin="${DEPLOY_FLOCK_BIN:-flock}"
readonly minimum_free_kb="${DEPLOY_MIN_FREE_KB:-1048576}"

usage() { printf '%s\n' 'Usage: deploy.sh --environment development|staging deploy|rollback all|backend|front|back' >&2; exit 64; }
fail() { printf 'deploy: %s\n' "$1" >&2; exit 1; }

validate_path_command() { [[ "$1" != *' '* && "$1" != *$'\t'* && "$1" != *$'\n'* ]] || fail 'command override is invalid'; }

validate_environment() {
  case "$environment" in development|staging) ;; *) fail 'only development and staging are supported' ;; esac
  [[ "$minimum_free_kb" =~ ^[0-9]+$ ]] || fail 'DEPLOY_MIN_FREE_KB must be an integer'
  validate_path_command "$docker_bin"
  validate_path_command "$flock_bin"
}

validate_identifier() { [[ "$1" =~ ^[A-Za-z0-9_]{1,63}$ ]] || fail "$2 must contain only letters, digits, or underscores"; }
validate_app_image() {
  local value="$1" package="$2" name="$3"
  [[ "$value" =~ ^ghcr\.io/vitykovskiy/$package@sha256:[a-f0-9]{64}$ ]] || fail "$name must use canonical package $package and a sha256 digest"
}

parse_runtime() {
  local line key value
  validate_runtime_file
  runtime_keys=''
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" =~ ^([A-Z][A-Z0-9_]*)=(.*)$ ]] || fail 'runtime file has an invalid line'
    key="${BASH_REMATCH[1]}"; value="${BASH_REMATCH[2]}"
    case "$key" in POSTGRES_PASSWORD) ;; *) fail "runtime file contains unknown key: $key" ;; esac
    [[ "|$runtime_keys|" != *"|$key|"* ]] || fail "runtime file contains duplicate key: $key"
    [[ -n "$value" && "$value" != *$'\r'* ]] || fail "runtime file contains invalid value: $key"
    runtime_keys="${runtime_keys:+$runtime_keys|}$key"
    case "$key" in
      POSTGRES_PASSWORD) runtime_postgres_password="$value" ;;
    esac
  done < "$runtime_file"
  [[ "|$runtime_keys|" == *'|POSTGRES_PASSWORD|'* ]] || fail 'runtime file is missing POSTGRES_PASSWORD'
  POSTGRES_DB=expressa; POSTGRES_USER=expressa; POSTGRES_PASSWORD="$runtime_postgres_password"
  unset runtime_keys runtime_postgres_password
}

validate_runtime_file() {
  local metadata owner group mode groups
  [[ -f "$runtime_file" && ! -L "$runtime_file" ]] || fail "invalid runtime file: $runtime_file"
  metadata="$(stat -c '%u:%g:%a' "$runtime_file")" || fail "invalid runtime file: $runtime_file"
  IFS=: read -r owner group mode <<< "$metadata"
  [[ "$owner" == 0 && "$mode" == 640 ]] || fail "invalid runtime file: $runtime_file"
  groups=" $(id -G) "
  [[ "$groups" == *" $group "* ]] || fail "runtime file group is not accessible: $runtime_file"
}

validate_runtime() {
  validate_identifier "$POSTGRES_DB" POSTGRES_DB
  validate_identifier "$POSTGRES_USER" POSTGRES_USER
  [[ "$POSTGRES_PASSWORD" =~ ^[A-Za-z0-9._~-]{16,128}$ ]] || fail 'POSTGRES_PASSWORD must be URL-safe and at least 16 characters'
  DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
}

capture_registry_credentials() {
  : "${GHCR_USERNAME:?GHCR_USERNAME is required}"
  : "${GHCR_TOKEN:?GHCR_TOKEN is required}"
  [[ "$GHCR_USERNAME" =~ ^[A-Za-z0-9-]{1,39}$ ]] || fail 'GHCR_USERNAME is invalid'
  [[ "$GHCR_TOKEN" != *$'\n'* && "$GHCR_TOKEN" != *$'\r'* ]] || fail 'GHCR_TOKEN is invalid'
  registry_username="$GHCR_USERNAME"; registry_token="$GHCR_TOKEN"
  export -n registry_username registry_token
}

state_mode() { stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"; }

load_state() {
  local file="$1" line key value
  [[ -f "$file" && "$(state_mode "$file")" == 600 ]] || fail "invalid state file: $file"
  state_keys=''
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^([A-Z][A-Z0-9_]*)=(.*)$ ]] || fail "invalid state file: $file"
    key="${BASH_REMATCH[1]}"; value="${BASH_REMATCH[2]}"
    case "$key" in DEPLOY_ENV|BACKEND_IMAGE|FRONT_IMAGE|BACK_IMAGE) ;; *) fail "invalid state file: $file" ;; esac
    [[ "|$state_keys|" != *"|$key|"* ]] || fail "invalid state file: $file"
    state_keys="${state_keys:+$state_keys|}$key"
    case "$key" in
      DEPLOY_ENV) state_deploy_env="$value" ;;
      BACKEND_IMAGE) state_backend="$value" ;;
      FRONT_IMAGE) state_front="$value" ;;
      BACK_IMAGE) state_back="$value" ;;
    esac
  done < "$file"
  [[ "${state_deploy_env:-}" == "$environment" ]] || fail "state environment mismatch: $file"
  for key in BACKEND_IMAGE FRONT_IMAGE BACK_IMAGE; do
    [[ "|$state_keys|" == *"|$key|"* ]] || fail "invalid state file: $file"
  done
  current_backend="$state_backend"; current_front="$state_front"; current_back="$state_back"
  validate_app_image "$current_backend" expressa-backend BACKEND_IMAGE
  validate_app_image "$current_front" expressa-front-office FRONT_IMAGE
  validate_app_image "$current_back" expressa-back-office BACK_IMAGE
  unset state_keys state_deploy_env state_backend state_front state_back
}

write_state() {
  local destination="$1" temporary
  temporary="$(mktemp "$state_directory/.state.XXXXXX")"
  chmod 600 "$temporary"
  {
    printf 'DEPLOY_ENV=%s\n' "$environment"
    printf 'BACKEND_IMAGE=%s\n' "$next_backend"
    printf 'FRONT_IMAGE=%s\n' "$next_front"
    printf 'BACK_IMAGE=%s\n' "$next_back"
  } > "$temporary"
  mv -f "$temporary" "$destination"
  chmod 600 "$destination"
}

write_previous_state() {
  local saved_backend="$next_backend" saved_front="$next_front" saved_back="$next_back"
  next_backend="$current_backend"; next_front="$current_front"; next_back="$current_back"
  write_state "$previous_state"
  next_backend="$saved_backend"; next_front="$saved_front"; next_back="$saved_back"
}

compose() { "$docker_bin" compose --project-name "$compose_project" --file "$compose_file" "$@"; }

wait_for_health() {
  local service="$1" container status retries=30
  container="$(compose ps -q "$service")"
  [[ -n "$container" ]] || fail "$service container was not created"
  while (( retries > 0 )); do
    status="$("$docker_bin" inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container")"
    [[ "$status" == healthy ]] && return 0
    [[ "$status" != unhealthy && "$status" != none ]] || fail "$service did not become healthy"
    ((retries -= 1)) || true
    sleep 2
  done
  fail "$service health check timed out"
}

backup_database() {
  local temporary backup
  temporary="$(mktemp "$backup_directory/.postgres.XXXXXX")"
  backup="$backup_directory/postgres-$(date -u +%Y%m%dT%H%M%S)-$(basename "$temporary").sql.gz"
  if ! compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip -c > "$temporary"; then
    rm -f "$temporary"; fail 'pg_dump failed'
  fi
  [[ -s "$temporary" ]] || { rm -f "$temporary"; fail 'pg_dump produced an empty backup'; }
  mv -f "$temporary" "$backup"
}

run_migrations() { compose run --rm --no-deps backend /nodejs/bin/node dist/scripts/migrate.js; }
smoke_backend() { compose exec -T backend /nodejs/bin/node -e "fetch('http://127.0.0.1:3000/health/ready').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"; }
smoke_web() { compose exec -T "$1" wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health; }
ensure_edge_network() { "$docker_bin" network inspect "expressa-${environment}-edge" >/dev/null 2>&1 || "$docker_bin" network create "expressa-${environment}-edge" >/dev/null; }

registry_login() {
  local token="$registry_token"
  unset registry_token
  registry_config="$(mktemp -d "$state_directory/.docker-config.XXXXXX")"
  chmod 700 "$registry_config"
  if ! printf '%s' "$token" | "$docker_bin" --config "$registry_config" login ghcr.io --username "$registry_username" --password-stdin >/dev/null; then
    unset token registry_username
    fail 'registry login failed'
  fi
  unset token registry_username
}
registry_logout() {
  unset DOCKER_CONFIG
  [[ -z "${registry_config:-}" ]] || "$docker_bin" --config "$registry_config" logout ghcr.io >/dev/null 2>&1 || true
  [[ -z "${registry_config:-}" ]] || rm -rf "$registry_config"
  unset registry_config
}
pull_images() { registry_login; export DOCKER_CONFIG="$registry_config"; compose pull "$@"; registry_logout; }

restore_changed_service() {
  local service="$1" changed="$2" current="$3"
  [[ "$changed" == 1 ]] || return 0
  if [[ -n "$current" ]]; then compose up -d --no-deps "$service" || true; else compose rm -sf "$service" || true; fi
}
rollback_changed() {
  [[ "${rollback_required:-0}" == 1 ]] || return 0
  rollback_required=0
  if [[ -f "$current_state" ]]; then load_state "$current_state"; else current_backend=''; current_front=''; current_back=''; fi
  export BACKEND_IMAGE="${current_backend:-$desired_backend}" FRONT_IMAGE="${current_front:-$desired_front}" BACK_IMAGE="${current_back:-$desired_back}"
  restore_changed_service postgres "$changed_postgres" 'postgres'
  restore_changed_service backend "$changed_backend" "$current_backend"
  restore_changed_service front "$changed_front" "$current_front"
  restore_changed_service back "$changed_back" "$current_back"
}
mark_changed() { case "$1" in postgres) changed_postgres=1 ;; backend) changed_backend=1 ;; front) changed_front=1 ;; back) changed_back=1 ;; esac; }
rollback_service() {
  local service="$1"
  rollback_required=1; mark_changed "$service"
  compose up -d --no-deps "$service"; wait_for_health "$service"
  case "$service" in backend) smoke_backend ;; front|back) smoke_web "$service" ;; esac
}
on_exit() { local status="$1"; [[ "$status" == 0 ]] || rollback_changed; registry_logout; trap - EXIT; exit "$status"; }
on_signal() { exit "$2"; }

[[ "$#" == 4 && "$1" == --environment ]] || usage
environment="$2"; operation="$3"; target="$4"
case "$operation" in deploy|rollback) ;; *) usage ;; esac
case "$target" in all|backend|front|back) ;; *) usage ;; esac
validate_environment

readonly compose_project="expressa-$environment"
readonly deploy_root="${DEPLOY_ROOT:-/srv/expressa}/$environment"
readonly runtime_file="$deploy_root/runtime.env"
readonly state_directory="$deploy_root/state"
readonly backup_directory="$deploy_root/backups"
readonly current_state="$state_directory/current"
readonly previous_state="$state_directory/previous"
capture_registry_credentials
unset DATABASE_URL POSTGRES_IMAGE GHCR_USERNAME GHCR_TOKEN POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD
mkdir -p "$state_directory" "$backup_directory"
chmod 700 "$state_directory" "$backup_directory"
exec 9>"$state_directory/deploy.lock"
"$flock_bin" -n 9 || fail "another $environment deployment is running"
rollback_required=0; changed_postgres=0; changed_backend=0; changed_front=0; changed_back=0
trap 'on_exit "$?"' EXIT
trap 'on_signal TERM 143' TERM
trap 'on_signal INT 130' INT
trap 'on_signal HUP 129' HUP
unset DOCKER_CONFIG

available_kb="$(df -Pk "$deploy_root" | awk 'NR == 2 { print $4 }')"
[[ "$available_kb" =~ ^[0-9]+$ && "$available_kb" -ge "$minimum_free_kb" ]] || fail 'insufficient free disk space'
parse_runtime; validate_runtime
current_backend=''; current_front=''; current_back=''
[[ ! -f "$current_state" ]] || load_state "$current_state"

if [[ "$operation" == deploy ]]; then
  if [[ -z "$current_backend" && "$target" != all ]]; then fail 'first deployment must target all'; fi
  case "$target" in
    all)
      : "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"; : "${FRONT_IMAGE:?FRONT_IMAGE is required}"; : "${BACK_IMAGE:?BACK_IMAGE is required}"
      desired_backend="$BACKEND_IMAGE"; desired_front="$FRONT_IMAGE"; desired_back="$BACK_IMAGE"
      validate_app_image "$desired_backend" expressa-backend BACKEND_IMAGE; validate_app_image "$desired_front" expressa-front-office FRONT_IMAGE; validate_app_image "$desired_back" expressa-back-office BACK_IMAGE
      next_backend="$desired_backend"; next_front="$desired_front"; next_back="$desired_back"
      ;;
    backend)
      : "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"; desired_backend="$BACKEND_IMAGE"; validate_app_image "$desired_backend" expressa-backend BACKEND_IMAGE
      desired_front="$current_front"; desired_back="$current_back"; next_backend="$desired_backend"; next_front="$current_front"; next_back="$current_back"
      ;;
    front)
      : "${FRONT_IMAGE:?FRONT_IMAGE is required}"; desired_front="$FRONT_IMAGE"; validate_app_image "$desired_front" expressa-front-office FRONT_IMAGE
      desired_backend="$current_backend"; desired_back="$current_back"; next_backend="$current_backend"; next_front="$desired_front"; next_back="$current_back"
      ;;
    back)
      : "${BACK_IMAGE:?BACK_IMAGE is required}"; desired_back="$BACK_IMAGE"; validate_app_image "$desired_back" expressa-back-office BACK_IMAGE
      desired_backend="$current_backend"; desired_front="$current_front"; next_backend="$current_backend"; next_front="$current_front"; next_back="$desired_back"
      ;;
  esac
else
  [[ -f "$current_state" && -f "$previous_state" ]] || fail 'rollback requires current and previous deployment states'
  previous_backend=''; previous_front=''; previous_back=''
  load_state "$previous_state"; previous_backend="$current_backend"; previous_front="$current_front"; previous_back="$current_back"
  load_state "$current_state"
  desired_backend="$current_backend"; desired_front="$current_front"; desired_back="$current_back"
  next_backend="$current_backend"; next_front="$current_front"; next_back="$current_back"
  case "$target" in all) next_backend="$previous_backend"; next_front="$previous_front"; next_back="$previous_back" ;; backend) next_backend="$previous_backend" ;; front) next_front="$previous_front" ;; back) next_back="$previous_back" ;; esac
fi

export DEPLOY_ENV="$environment" COMPOSE_PROJECT_NAME="$compose_project" POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD DATABASE_URL
export BACKEND_IMAGE="$next_backend" FRONT_IMAGE="$next_front" BACK_IMAGE="$next_back"
compose config -q; ensure_edge_network
if [[ "$operation" == deploy ]]; then
  case "$target" in all) pull_images backend front back ;; backend) pull_images backend ;; front) pull_images front ;; back) pull_images back ;; esac
else
  case "$target" in all) pull_images backend front back ;; backend) pull_images backend ;; front) pull_images front ;; back) pull_images back ;; esac
fi

if [[ "$operation" == deploy && ( "$target" == all || "$target" == backend ) ]]; then
  rollback_required=1; changed_postgres=1; compose up -d postgres; wait_for_health postgres
  backup_database; run_migrations
  changed_backend=1; compose up -d --no-deps backend; wait_for_health backend; smoke_backend
fi
if [[ "$operation" == deploy && ( "$target" == all || "$target" == front ) ]]; then rollback_required=1; changed_front=1; compose up -d --no-deps front; wait_for_health front; smoke_web front; fi
if [[ "$operation" == deploy && ( "$target" == all || "$target" == back ) ]]; then rollback_required=1; changed_back=1; compose up -d --no-deps back; wait_for_health back; smoke_web back; fi
if [[ "$operation" == rollback ]]; then
  case "$target" in all) rollback_service backend; rollback_service front; rollback_service back ;; backend) rollback_service backend ;; front) rollback_service front ;; back) rollback_service back ;; esac
fi
[[ ! -f "$current_state" || "$operation" != deploy ]] || write_previous_state
write_state "$current_state"
rollback_required=0
