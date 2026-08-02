#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

script_directory="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
readonly script_directory
infrastructure_directory="$(CDPATH='' cd -- "$script_directory/.." && pwd -P)"
readonly infrastructure_directory
readonly compose_file="$infrastructure_directory/compose.yml"
readonly docker_bin="${DEPLOY_DOCKER_BIN:-docker}"
readonly minimum_free_kb="${DEPLOY_MIN_FREE_KB:-1048576}"

usage() { printf '%s\n' 'Usage: deploy.sh --environment development|staging deploy|rollback all|backend|front|back' >&2; exit 64; }
fail() { printf 'deploy: %s\n' "$1" >&2; exit 1; }

validate_path_command() { [[ "$1" != *' '* && "$1" != *$'\t'* && "$1" != *$'\n'* ]] || fail 'command override is invalid'; }

validate_environment() {
  case "$environment" in development|staging) ;; *) fail 'only development and staging are supported' ;; esac
  [[ "$minimum_free_kb" =~ ^[0-9]+$ ]] || fail 'DEPLOY_MIN_FREE_KB must be an integer'
  validate_path_command "$docker_bin"
}

validate_identifier() { [[ "$1" =~ ^[A-Za-z0-9_]{1,63}$ ]] || fail "$2 must contain only letters, digits, or underscores"; }
validate_app_image() {
  local value="$1" package="$2" name="$3"
  [[ "$value" =~ ^127\.0\.0\.1:5000/expressa/$package@sha256:[a-f0-9]{64}$ ]] || fail "$name must use local registry package $package and a sha256 digest"
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
  validate_app_image "$current_backend" backend BACKEND_IMAGE
  validate_app_image "$current_front" front-office FRONT_IMAGE
  validate_app_image "$current_back" back-office BACK_IMAGE
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
compose_quiet() { compose "$@" >/dev/null 2>&1; }

wait_for_health() {
  local service="$1" container status retries=30
  container="$(compose ps -q "$service" 2>/dev/null)"
  [[ -n "$container" ]] || fail "$service container was not created"
  while (( retries > 0 )); do
    status="$("$docker_bin" inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null)"
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
  if ! compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" 2>/dev/null | gzip -c 2>/dev/null > "$temporary"; then
    rm -f "$temporary"; fail 'pg_dump failed'
  fi
  [[ -s "$temporary" ]] || { rm -f "$temporary"; fail 'pg_dump produced an empty backup'; }
  mv -f "$temporary" "$backup"
}

run_migrations() { compose_quiet run --rm --no-deps backend dist/scripts/migrate.js || fail 'migration failed'; }
smoke_backend() { compose_quiet exec -T backend /nodejs/bin/node -e "fetch('http://127.0.0.1:3000/health/ready').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"; }
smoke_web() { compose_quiet exec -T "$1" wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health; }
ensure_edge_network() { "$docker_bin" network inspect "expressa-${environment}-edge" >/dev/null 2>&1 || "$docker_bin" network create "expressa-${environment}-edge" >/dev/null; }

pull_images() { compose_quiet pull "$@"; }

deployment_lock_is_held() {
  local descriptor descriptor_info
  [[ "${DEPLOY_LOCK_HELD:-}" == 1 ]] || return 1
  for descriptor in "/proc/$$/fd"/[0-9]*; do
    [[ "$(readlink -f "$descriptor")" == "$deployment_lock_file" ]] || continue
    descriptor_info="/proc/$$/fdinfo/${descriptor##*/}"
    grep -Eq "^lock:.*FLOCK[[:space:]]+ADVISORY[[:space:]]+WRITE[[:space:]]+$$([[:space:]]|$)" "$descriptor_info" && return 0
  done
  return 1
}

restore_changed_service() {
  local service="$1" changed="$2" current="$3"
  [[ "$changed" == 1 ]] || return 0
  if [[ -n "$current" ]]; then compose_quiet up -d --no-deps "$service" || true; else compose_quiet rm -sf "$service" || true; fi
}
rollback_changed() {
  [[ "${rollback_required:-0}" == 1 ]] || return 0
  rollback_required=0
  if [[ -f "$current_state" ]]; then
    load_state "$current_state"
    current_postgres=postgres
  else
    current_postgres=''; current_backend=''; current_front=''; current_back=''
  fi
  export BACKEND_IMAGE="${current_backend:-$desired_backend}" FRONT_IMAGE="${current_front:-$desired_front}" BACK_IMAGE="${current_back:-$desired_back}"
  restore_changed_service postgres "$changed_postgres" "$current_postgres"
  restore_changed_service backend "$changed_backend" "$current_backend"
  restore_changed_service front "$changed_front" "$current_front"
  restore_changed_service back "$changed_back" "$current_back"
}
mark_changed() { case "$1" in postgres) changed_postgres=1 ;; backend) changed_backend=1 ;; front) changed_front=1 ;; back) changed_back=1 ;; esac; }
rollback_service() {
  local service="$1"
  rollback_required=1; mark_changed "$service"
  compose_quiet up -d --no-deps "$service"
  set_phase smoke; wait_for_health "$service"
  case "$service" in backend) smoke_backend ;; front|back) smoke_web "$service" ;; esac
}
set_phase() {
  current_phase="$1"
  printf 'expressa-deploy: phase=%s status=start\n' "$current_phase" >&2
}
on_exit() {
  local status="$1" failure_phase
  if [[ "$status" == 0 ]]; then
    printf 'expressa-deploy: phase=%s status=complete\n' "$current_phase" >&2
  else
    failure_phase="${failed_phase:-$current_phase}"
    rollback_changed || true
    printf 'expressa-deploy: phase=%s status=failed\n' "$failure_phase" >&2
  fi
  trap - EXIT
  exit "$status"
}
on_error() {
  [[ -n "${failed_phase:-}" ]] || failed_phase="$current_phase"
}
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
readonly deployment_lock_file="$state_directory/.deploy.lock"
[[ -d "$state_directory" ]] || fail "deployment state directory is missing: $state_directory"
if [[ "${DEPLOY_LOCK_HELD:-}" != 1 ]]; then
  exec flock --no-fork --exclusive --nonblock --conflict-exit-code 75 "$deployment_lock_file" env DEPLOY_LOCK_HELD=1 "$0" "$@"
fi
deployment_lock_is_held || fail 'deployment lock is not held'
unset DATABASE_URL POSTGRES_IMAGE POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD GHCR_USERNAME GHCR_TOKEN DOCKER_CONFIG
mkdir -p "$backup_directory"
chmod 700 "$state_directory" "$backup_directory"
rollback_required=0; changed_postgres=0; changed_backend=0; changed_front=0; changed_back=0
current_phase=preflight
failed_phase=''
trap 'on_exit "$?"' EXIT
trap 'on_error' ERR
trap 'on_signal TERM 143' TERM
trap 'on_signal INT 130' INT
trap 'on_signal HUP 129' HUP
set_phase preflight
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
      validate_app_image "$desired_backend" backend BACKEND_IMAGE; validate_app_image "$desired_front" front-office FRONT_IMAGE; validate_app_image "$desired_back" back-office BACK_IMAGE
      next_backend="$desired_backend"; next_front="$desired_front"; next_back="$desired_back"
      ;;
    backend)
      : "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"; desired_backend="$BACKEND_IMAGE"; validate_app_image "$desired_backend" backend BACKEND_IMAGE
      desired_front="$current_front"; desired_back="$current_back"; next_backend="$desired_backend"; next_front="$current_front"; next_back="$current_back"
      ;;
    front)
      : "${FRONT_IMAGE:?FRONT_IMAGE is required}"; desired_front="$FRONT_IMAGE"; validate_app_image "$desired_front" front-office FRONT_IMAGE
      desired_backend="$current_backend"; desired_back="$current_back"; next_backend="$current_backend"; next_front="$desired_front"; next_back="$current_back"
      ;;
    back)
      : "${BACK_IMAGE:?BACK_IMAGE is required}"; desired_back="$BACK_IMAGE"; validate_app_image "$desired_back" back-office BACK_IMAGE
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
set_phase compose
compose_quiet config -q; ensure_edge_network
set_phase pull
if [[ "$operation" == deploy ]]; then
  case "$target" in all) pull_images backend front back ;; backend) pull_images backend ;; front) pull_images front ;; back) pull_images back ;; esac
else
  case "$target" in all) pull_images backend front back ;; backend) pull_images backend ;; front) pull_images front ;; back) pull_images back ;; esac
fi

if [[ "$operation" == deploy && ( "$target" == all || "$target" == backend ) ]]; then
  rollback_required=1; changed_postgres=1; set_phase compose; compose_quiet up -d postgres
  set_phase smoke; wait_for_health postgres
  set_phase backup; backup_database
  set_phase migrate; run_migrations
  changed_backend=1; set_phase compose; compose_quiet up -d --no-deps backend
  set_phase smoke; wait_for_health backend; smoke_backend
fi
if [[ "$operation" == deploy && ( "$target" == all || "$target" == front ) ]]; then rollback_required=1; changed_front=1; set_phase compose; compose_quiet up -d --no-deps front; set_phase smoke; wait_for_health front; smoke_web front; fi
if [[ "$operation" == deploy && ( "$target" == all || "$target" == back ) ]]; then rollback_required=1; changed_back=1; set_phase compose; compose_quiet up -d --no-deps back; set_phase smoke; wait_for_health back; smoke_web back; fi
if [[ "$operation" == rollback ]]; then
  set_phase compose
  case "$target" in all) rollback_service backend; rollback_service front; rollback_service back ;; backend) rollback_service backend ;; front) rollback_service front ;; back) rollback_service back ;; esac
fi
set_phase state
[[ ! -f "$current_state" || "$operation" != deploy ]] || write_previous_state
write_state "$current_state"
rollback_required=0
