#!/usr/bin/env bash

set -Eeuo pipefail

repository_root="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
readonly repository_root
readonly docker_bin="${BOOTSTRAP_DOCKER_BIN:-docker}"
readonly nginx_bin="${BOOTSTRAP_NGINX_BIN:-nginx}"
readonly root_prefix="${BOOTSTRAP_ROOT:-}"
readonly backup_root="${BOOTSTRAP_BACKUP_ROOT:-/var/backups/expressa-infra}"
dry_run=0
deploy_user="${EXPRESSA_DEPLOY_USER:-expressa-deploy}"
backup_directory=''
configuration_changed=0
temporary_routes=''
attached_networks=()

fail() { printf 'bootstrap-vps: %s\n' "$1" >&2; exit 1; }
usage() { printf 'Usage: %s [--dry-run] [--deploy-user USER]\n' "$0" >&2; exit 64; }
root_path() { printf '%s%s' "$root_prefix" "$1"; }
run() {
  if (( dry_run )); then
    printf 'dry-run:' >&2
    printf ' %q' "$@" >&2
    printf '\n' >&2
    return 0
  fi
  "$@"
}

caddy_compose() {
  "$docker_bin" compose --project-name shared_caddy --project-directory "$caddy_directory" --file "$caddy_compose_file" "$@"
}

rollback_configuration() {
  local network nginx_link_state nginx_link_target
  [[ "$configuration_changed" == 1 && -n "$backup_directory" ]] || return 0
  cp -- "$backup_directory/Caddyfile" "$caddy_file"
  if [[ -f "$backup_directory/expressa-redirect" ]]; then
    cp -- "$backup_directory/expressa-redirect" "$nginx_redirect_file"
  else
    rm -f -- "$nginx_redirect_file"
  fi
  IFS= read -r nginx_link_state < "$backup_directory/nginx-enabled-link-state"
  case "$nginx_link_state" in
    absent)
      rm -f -- "$nginx_enabled_file"
      ;;
    symlink)
      IFS= read -r nginx_link_target < <(sed -n '2p' "$backup_directory/nginx-enabled-link-state")
      rm -f -- "$nginx_enabled_file"
      ln -s -- "$nginx_link_target" "$nginx_enabled_file"
      ;;
    other)
      ;;
    *) fail 'invalid nginx enabled-link backup state' ;;
  esac
  for network in "${attached_networks[@]}"; do
    "$docker_bin" network disconnect "$network" "$caddy_container" >/dev/null 2>&1 || true
  done
  caddy_compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 || true
  "$nginx_bin" -s reload >/dev/null 2>&1 || true
}

cleanup() {
  local status="$?"
  [[ -z "$temporary_routes" ]] || rm -f -- "$temporary_routes"
  [[ "$status" == 0 ]] || rollback_configuration
}

ensure_network() {
  local network="$1" kind="$2" internal container_count

  if ! internal="$($docker_bin network inspect "$network" --format '{{.Internal}}' 2>/dev/null)"; then
    case "$kind" in
      edge) run "$docker_bin" network create "$network" >/dev/null ;;
      data) run "$docker_bin" network create --internal "$network" >/dev/null ;;
      *) fail 'network kind is invalid' ;;
    esac
    return 0
  fi
  case "$internal:$kind" in
    false:edge|true:data) return 0 ;;
    true:edge) fail "edge network must not be internal: $network" ;;
    false:data)
      container_count="$($docker_bin network inspect "$network" --format '{{len .Containers}}')"
      [[ "$container_count" =~ ^[0-9]+$ ]] || fail "cannot inspect attached containers: $network"
      [[ "$container_count" == 0 ]] || fail "cannot recreate data network with attached containers: $network"
      run "$docker_bin" network rm "$network" >/dev/null
      run "$docker_bin" network create --internal "$network" >/dev/null
      ;;
    *) fail "cannot inspect network mode: $network" ;;
  esac
}

preflight_data_network() {
  local network="$1" internal container_count

  if ! internal="$($docker_bin network inspect "$network" --format '{{.Internal}}' 2>/dev/null)"; then
    return 0
  fi
  [[ "$internal" == false ]] || return 0
  container_count="$($docker_bin network inspect "$network" --format '{{len .Containers}}')"
  [[ "$container_count" =~ ^[0-9]+$ ]] || fail "cannot inspect attached containers: $network"
  [[ "$container_count" == 0 ]] || fail "cannot recreate data network with attached containers: $network"
}

connect_caddy() {
  local network="$1"
  # shellcheck disable=SC2016
  if "$docker_bin" network inspect "$network" --format '{{range $id, $_ := .Containers}}{{println $id}}{{end}}' | grep -Fqx -- "$caddy_container"; then
    return 0
  fi
  run "$docker_bin" network connect "$network" "$caddy_container"
  (( dry_run )) || attached_networks+=("$network")
}

write_caddy_routes() {
  local temporary="$1"
  cat > "$temporary" <<'EOF'
# BEGIN expressa managed routes
dev.expressa.vitykovskiy.ru {
    handle /api/v1* {
        reverse_proxy development-backend:3000
    }
    reverse_proxy development-front:8080
}

admin.dev.expressa.vitykovskiy.ru {
    handle /api/v1* {
        reverse_proxy development-backend:3000
    }
    reverse_proxy development-back:8080
}

api.dev.expressa.vitykovskiy.ru {
    reverse_proxy development-backend:3000
}

staging.expressa.vitykovskiy.ru {
    handle /api/v1* {
        reverse_proxy staging-backend:3000
    }
    reverse_proxy staging-front:8080
}

admin.staging.expressa.vitykovskiy.ru {
    handle /api/v1* {
        reverse_proxy staging-backend:3000
    }
    reverse_proxy staging-back:8080
}

api.staging.expressa.vitykovskiy.ru {
    reverse_proxy staging-backend:3000
}
# END expressa managed routes
EOF
}

replace_managed_caddy_block() {
  local routes_file="$1"
  python3 - "$caddy_file" "$routes_file" <<'PY'
from pathlib import Path
import re
import sys

caddy = Path(sys.argv[1])
routes = Path(sys.argv[2]).read_text()
content = caddy.read_text()
pattern = r'(?ms)^# BEGIN expressa managed routes\n.*?^# END expressa managed routes\n?'
updated, count = re.subn(pattern, '', content)
if count > 1:
    raise SystemExit('multiple expressa managed route blocks found')
caddy.write_text(updated.rstrip() + '\n\n' + routes)
PY
}

write_nginx_redirect() {
  cat > "$nginx_redirect_file" <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name dev.expressa.vitykovskiy.ru admin.dev.expressa.vitykovskiy.ru api.dev.expressa.vitykovskiy.ru staging.expressa.vitykovskiy.ru admin.staging.expressa.vitykovskiy.ru api.staging.expressa.vitykovskiy.ru;
    return 308 https://$host$request_uri;
}
EOF
}

validate_deployment_compose() {
  local environment="$1"
  DEPLOY_ENV="$environment" COMPOSE_PROJECT_NAME="expressa-$environment" \
    POSTGRES_DB=expressa POSTGRES_USER=expressa POSTGRES_PASSWORD=validation-password \
    DATABASE_URL='postgresql://expressa:validation-password@postgres:5432/expressa' \
    BACKEND_IMAGE='ghcr.io/vitykovskiy/expressa-backend@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' \
    FRONT_IMAGE='ghcr.io/vitykovskiy/expressa-front-office@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' \
    BACK_IMAGE='ghcr.io/vitykovskiy/expressa-back-office@sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' \
    "$docker_bin" compose --project-name "expressa-$environment" --file "$infra_directory/compose.yml" config -q
}

runtime_password_from_file() {
  local runtime_file="$1"
  local metadata runtime_line

  [[ ! -L "$runtime_file" && -f "$runtime_file" ]] || fail 'runtime environment file must be a regular file'
  metadata="$(stat --format '%u:%g:%a' -- "$runtime_file")"
  [[ "$metadata" == "0:${deploy_group_id}:640" ]] || fail 'runtime environment file has unsafe ownership or mode'
  [[ "$(wc -l < "$runtime_file")" == 1 ]] || fail 'runtime environment file has invalid content'
  grep -Eq '^POSTGRES_PASSWORD=[A-Za-z0-9_-]{64}$' -- "$runtime_file" || fail 'runtime environment file has invalid content'
  IFS= read -r runtime_line < "$runtime_file"
  printf '%s' "${runtime_line#POSTGRES_PASSWORD=}"
}

create_runtime_password() {
  local existing_password="$1"
  local candidate _

  for _ in {1..10}; do
    candidate="$(openssl rand -hex 32)"
    [[ "$candidate" =~ ^[A-Za-z0-9_-]{64}$ ]] || fail 'password generator returned an unsafe value'
    [[ "$candidate" != "$existing_password" ]] || continue
    printf '%s' "$candidate"
    return 0
  done
  fail 'password generator produced a duplicate value'
}

create_runtime_file() {
  local runtime_file="$1"
  local password="$2"
  local temporary_file

  temporary_file="$(mktemp "${runtime_file%/*}/.runtime.env.XXXXXX")"
  chmod 0640 -- "$temporary_file"
  chown "root:${deploy_group}" -- "$temporary_file"
  printf 'POSTGRES_PASSWORD=%s\n' "$password" > "$temporary_file"
  if ! ln -- "$temporary_file" "$runtime_file"; then
    rm -f -- "$temporary_file"
    runtime_password_from_file "$runtime_file" >/dev/null
    return 0
  fi
  rm -f -- "$temporary_file"
}

ensure_runtime_environment_files() {
  local final_development_password final_staging_password

  if [[ -n "$development_password" && -n "$staging_password" && "$development_password" == "$staging_password" ]]; then
    fail 'runtime environment passwords must differ'
  fi
  [[ -n "$development_password" ]] || development_password="$(create_runtime_password "$staging_password")"
  [[ -n "$staging_password" ]] || staging_password="$(create_runtime_password "$development_password")"
  [[ "$development_password" != "$staging_password" ]] || fail 'runtime environment passwords must differ'
  expected_development_password="$development_password"
  expected_staging_password="$staging_password"

  create_runtime_file "$development_file" "$development_password"
  create_runtime_file "$staging_file" "$staging_password"
  load_runtime_passwords
  final_development_password="$development_password"
  final_staging_password="$staging_password"
  [[ "$final_development_password" != "$final_staging_password" ]] || fail 'runtime environment passwords must differ'
  [[ "$final_development_password" == "$expected_development_password" && "$final_staging_password" == "$expected_staging_password" ]] || fail 'runtime environment files changed during bootstrap'
}

runtime_files_exist() {
  [[ -e "$development_file" || -L "$development_file" || -e "$staging_file" || -L "$staging_file" ]]
}

load_runtime_passwords() {
  development_password=''
  staging_password=''
  if [[ -e "$development_file" || -L "$development_file" ]]; then
    development_password="$(runtime_password_from_file "$development_file")"
  fi
  if [[ -e "$staging_file" || -L "$staging_file" ]]; then
    staging_password="$(runtime_password_from_file "$staging_file")"
  fi
  [[ -z "$development_password" || -z "$staging_password" || "$development_password" != "$staging_password" ]] || fail 'runtime environment passwords must differ'
}

preflight_runtime_files() {
  if ! getent passwd "$deploy_user" >/dev/null; then
    runtime_files_exist && fail 'runtime environment files require an existing deploy user'
    return 0
  fi
  deploy_group="$(id -gn "$deploy_user")"
  deploy_group_id="$(id -g "$deploy_user")"
  load_runtime_passwords
}

while (( "$#" )); do
  case "$1" in
    --dry-run) dry_run=1 ;;
    --deploy-user)
      (( "$#" >= 2 )) || usage
      deploy_user="$2"
      shift
      ;;
    *) usage ;;
  esac
  shift
done

[[ "$EUID" == 0 || "$dry_run" == 1 ]] || fail 'must be run as root'
[[ "$deploy_user" =~ ^[a-z_][a-z0-9_-]{0,31}$ ]] || fail 'deploy user must be a POSIX username'
[[ -z "$root_prefix" || "$root_prefix" = /* ]] || fail 'BOOTSTRAP_ROOT must be an absolute path'
command -v "$docker_bin" >/dev/null || fail 'docker is required'
command -v "$nginx_bin" >/dev/null || fail 'nginx is required'
command -v python3 >/dev/null || fail 'python3 is required'
command -v openssl >/dev/null || fail 'openssl is required'
command -v flock >/dev/null || fail 'flock is required'
command -v getent >/dev/null || fail 'getent is required'
command -v useradd >/dev/null || fail 'useradd is required'
command -v usermod >/dev/null || fail 'usermod is required'
[[ -f "$repository_root/deploy/compose.yml" && -f "$repository_root/deploy/deploy.sh" ]] || fail 'approved deployment artifacts are missing'

expressa_root="$(root_path /srv/expressa)"
readonly expressa_root
readonly infra_directory="$expressa_root/infra"
caddy_directory="$(root_path /home/codex_macbook/infra/shared-caddy)"
readonly caddy_directory
readonly caddy_file="$caddy_directory/Caddyfile"
readonly caddy_compose_file="$caddy_directory/docker-compose.yml"
nginx_redirect_file="$(root_path /etc/nginx/sites-available/expressa-redirect)"
readonly nginx_redirect_file
nginx_enabled_file="$(root_path /etc/nginx/sites-enabled/expressa-redirect)"
readonly nginx_enabled_file
readonly development_file="$expressa_root/development/runtime.env"
readonly staging_file="$expressa_root/staging/runtime.env"
development_password=''
staging_password=''
expected_development_password=''
expected_staging_password=''
deploy_group=''
deploy_group_id=''

[[ -f "$caddy_file" && -f "$caddy_compose_file" ]] || fail 'shared Caddy configuration is missing'
if ! (( dry_run )); then
  "$docker_bin" compose version >/dev/null
  caddy_compose config -q
  caddy_compose config --services | grep -Fqx caddy || fail 'shared Caddy compose project has no caddy service'
  caddy_container="$(caddy_compose ps -q caddy)"
  [[ -n "$caddy_container" ]] || fail 'shared Caddy service is not running'
else
  caddy_container='caddy'
fi
readonly caddy_container

if (( dry_run )); then
  preflight_runtime_files
  printf '%s\n' 'bootstrap-vps dry run passed'
  exit 0
fi

preflight_runtime_files
lock_directory="$(root_path /run/lock)"
[[ -d "$lock_directory" ]] || fail 'bootstrap lock directory is missing'
exec {bootstrap_lock_fd}> "$lock_directory/expressa-bootstrap.lock"
flock "$bootstrap_lock_fd"
preflight_runtime_files
if ! getent passwd "$deploy_user" >/dev/null; then
  useradd --create-home --shell /bin/bash "$deploy_user"
  deploy_group="$(id -gn "$deploy_user")"
  deploy_group_id="$(id -g "$deploy_user")"
fi
load_runtime_passwords
usermod --append --groups docker "$deploy_user"
for directory in "$infra_directory" "$expressa_root/development/backups" "$expressa_root/staging/backups"; do
  install --directory --owner "$deploy_user" --group "$deploy_group" --mode 0750 "$directory"
done
install --directory --owner root --group "$deploy_group" --mode 0750 "$infra_directory/deploy"
install --owner root --group "$deploy_group" --mode 0640 "$repository_root/deploy/compose.yml" "$infra_directory/compose.yml"
install --owner root --group "$deploy_group" --mode 0750 "$repository_root/deploy/deploy.sh" "$infra_directory/deploy/deploy.sh"

for environment in development staging; do
  preflight_data_network "expressa-${environment}-data"
done
for environment in development staging; do
  ensure_network "expressa-${environment}-edge" edge
  ensure_network "expressa-${environment}-data" data
done

ensure_runtime_environment_files

for environment in development staging; do
  validate_deployment_compose "$environment"
done

backup_directory="$(root_path "$backup_root")/$(date -u +%Y%m%dT%H%M%SZ)"
install --directory --owner root --group root --mode 0700 "$backup_directory"
cp -- "$caddy_file" "$backup_directory/Caddyfile"
cp -- "$caddy_compose_file" "$backup_directory/docker-compose.yml"
if [[ -f "$nginx_redirect_file" ]]; then
  cp -- "$nginx_redirect_file" "$backup_directory/expressa-redirect"
fi
if [[ -L "$nginx_enabled_file" ]]; then
  {
    printf '%s\n' symlink
    readlink -- "$nginx_enabled_file"
  } > "$backup_directory/nginx-enabled-link-state"
elif [[ -e "$nginx_enabled_file" ]]; then
  printf '%s\n' other > "$backup_directory/nginx-enabled-link-state"
else
  printf '%s\n' absent > "$backup_directory/nginx-enabled-link-state"
fi
configuration_changed=1
temporary_routes="$(mktemp)"
trap cleanup EXIT
write_caddy_routes "$temporary_routes"
replace_managed_caddy_block "$temporary_routes"
write_nginx_redirect
if [[ -e "$nginx_enabled_file" && ! -L "$nginx_enabled_file" ]]; then
  fail 'nginx redirect enable path is not a symlink'
fi
ln -sfn -- ../sites-available/expressa-redirect "$nginx_enabled_file"

caddy_compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
"$nginx_bin" -t
for environment in development staging; do
  connect_caddy "expressa-${environment}-edge"
done
caddy_compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
"$nginx_bin" -s reload
configuration_changed=0
printf '%s\n' 'bootstrap-vps completed'
