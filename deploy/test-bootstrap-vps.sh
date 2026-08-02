#!/usr/bin/env bash

set -Eeuo pipefail

repository_root="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
readonly repository_root
readonly bootstrap_script="$repository_root/deploy/bootstrap-vps.sh"
temporary_directory="$(mktemp -d)"
trap 'rm -rf -- "$temporary_directory"' EXIT HUP INT TERM

fail() { printf 'test-bootstrap-vps: %s\n' "$1" >&2; exit 1; }
assert_file_contains() { grep -Fq -- "$2" "$1" || fail "missing expected content: $2"; }

for path in /home/codex_macbook/infra/shared-caddy /etc/nginx/sites-available /etc/nginx/sites-enabled; do
  mkdir -p -- "$temporary_directory$path"
done
printf '%s\n' 'example.org { respond "ok" }' > "$temporary_directory/home/codex_macbook/infra/shared-caddy/Caddyfile"
printf '%s\n' 'services: { caddy: { image: caddy:2 } }' > "$temporary_directory/home/codex_macbook/infra/shared-caddy/docker-compose.yml"

fake_bin="$temporary_directory/bin"
mkdir -p -- "$fake_bin"
for command in getent useradd usermod; do
  printf '%s\n' '#!/usr/bin/env bash' 'exit 0' > "$fake_bin/$command"
  chmod 700 "$fake_bin/$command"
done
cat > "$fake_bin/docker" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
[[ -z "${FAKE_DOCKER_LOG:-}" ]] || printf '%s\n' "$*" >> "$FAKE_DOCKER_LOG"
case " $* " in
  ' pull '*) ;;
  ' image inspect '*) printf '%s\n' amd64/linux ;;
  ' container inspect '*)
    name="${!#}"
    state="$FAKE_REGISTRY_STATE_DIR/$name"
    [[ -f "$state" ]] || exit 1
    if [[ "$*" != *' --format '* ]]; then exit 0; fi
    template="$4"
    image="$(cat "$state")"
    case "$template" in
      '{{.Config.Image}}') printf '%s\n' "$image" ;;
      '{{index .Config.Labels "io.expressa.managed"}}') printf '%s\n' registry ;;
      '{{.State.Running}}')
        if [[ -f "$state.stopped" ]]; then printf '%s\n' false; else printf '%s\n' true; fi
        ;;
      '{{.HostConfig.RestartPolicy.Name}}') printf '%s\n' unless-stopped ;;
      '{{.HostConfig.PidsLimit}}') printf '%s\n' 128 ;;
      '{{.HostConfig.Memory}}') printf '%s\n' 536870912 ;;
      '{{.HostConfig.MemoryReservation}}') printf '%s\n' 268435456 ;;
      '{{.HostConfig.NanoCpus}}') printf '%s\n' 1000000000 ;;
      '{{.HostConfig.LogConfig.Type}}') printf '%s\n' local ;;
      '{{index .HostConfig.LogConfig.Config "max-size"}}') printf '%s\n' 10m ;;
      '{{index .HostConfig.LogConfig.Config "max-file"}}') printf '%s\n' 3 ;;
      '{{json .HostConfig.PortBindings}}')
        if [[ -f "$state.public" ]]; then
          printf '%s\n' '{"5000/tcp":[{"HostIp":"0.0.0.0","HostPort":"5000"}]}'
        else
          printf '%s\n' '{"5000/tcp":[{"HostIp":"127.0.0.1","HostPort":"5000"}]}'
        fi
        ;;
      '{{json .Mounts}}') printf '[{"Type":"bind","Source":"%s","Destination":"/var/lib/registry","RW":true}]\n' "$FAKE_REGISTRY_DATA_DIRECTORY" ;;
      '{{json .Config.Env}}')
        if [[ -f "$state.bad-env" ]]; then
          printf '%s\n' '["REGISTRY_STORAGE_DELETE_ENABLED=false","REGISTRY_STORAGE_DELETE_ENABLED=true","REGISTRY_HTTP_ADDR=0.0.0.0:5000","REGISTRY_HTTP_ADDR=0.0.0.0:5000"]'
        else
          printf '%s\n' '["REGISTRY_STORAGE_DELETE_ENABLED=false","REGISTRY_HTTP_ADDR=0.0.0.0:5000"]'
        fi
        ;;
      *) exit 88 ;;
    esac
    ;;
  ' stop '*) touch "$FAKE_REGISTRY_STATE_DIR/$2.stopped" ;;
  ' restart '*) rm -f -- "$FAKE_REGISTRY_STATE_DIR/$2.stopped" "$FAKE_REGISTRY_STATE_DIR/$2.unready" ;;
  ' rename '*)
    mv -- "$FAKE_REGISTRY_STATE_DIR/$2" "$FAKE_REGISTRY_STATE_DIR/$3"
    [[ ! -f "$FAKE_REGISTRY_STATE_DIR/$2.public" ]] || mv -- "$FAKE_REGISTRY_STATE_DIR/$2.public" "$FAKE_REGISTRY_STATE_DIR/$3.public"
    [[ ! -f "$FAKE_REGISTRY_STATE_DIR/$2.bad-env" ]] || mv -- "$FAKE_REGISTRY_STATE_DIR/$2.bad-env" "$FAKE_REGISTRY_STATE_DIR/$3.bad-env"
    [[ ! -f "$FAKE_REGISTRY_STATE_DIR/$2.stopped" ]] || mv -- "$FAKE_REGISTRY_STATE_DIR/$2.stopped" "$FAKE_REGISTRY_STATE_DIR/$3.stopped"
    [[ ! -f "$FAKE_REGISTRY_STATE_DIR/$2.unready" ]] || mv -- "$FAKE_REGISTRY_STATE_DIR/$2.unready" "$FAKE_REGISTRY_STATE_DIR/$3.unready"
    ;;
  ' rm '*)
    name="${!#}"
    rm -f -- "$FAKE_REGISTRY_STATE_DIR/$name" "$FAKE_REGISTRY_STATE_DIR/$name.public" "$FAKE_REGISTRY_STATE_DIR/$name.bad-env" "$FAKE_REGISTRY_STATE_DIR/$name.stopped" "$FAKE_REGISTRY_STATE_DIR/$name.unready"
    ;;
  ' start '*) rm -f -- "$FAKE_REGISTRY_STATE_DIR/$2.stopped" ;;
  ' run '*)
    [[ "${FAIL_REGISTRY_RUN:-}" != 1 ]] || exit 32
    name=''
    for (( index = 1; index <= $#; index++ )); do
      [[ "${!index}" == --name ]] || continue
      next_index=$((index + 1)); name="${!next_index}"; break
    done
    [[ -n "$name" ]] || exit 89
    printf '%s\n' "${!#}" > "$FAKE_REGISTRY_STATE_DIR/$name"
    printf '%s\n' fake-registry
    ;;
  *' config --services '*) printf '%s\n' caddy ;;
  *' ps -q caddy '*) printf '%s\n' fake-caddy ;;
  *' caddy reload '*) [[ "${FAIL_CADDY_RELOAD:-}" != 1 ]] || exit 31 ;;
  ' network inspect '*)
    network="$3"
    [[ -f "$FAKE_NETWORK_STATE_DIR/$network.internal" ]] || exit 1
    case "$*" in
      *'{{.Internal}}'*) cat "$FAKE_NETWORK_STATE_DIR/$network.internal" ;;
      *'{{len .Containers}}'*) cat "$FAKE_NETWORK_STATE_DIR/$network.containers" 2>/dev/null || printf '%s\n' 0 ;;
      *)
        expected_template="{{range \$id, \$_ := .Containers}}{{println \$id}}{{end}}"
        [[ "$*" == *"$expected_template"* ]] || exit 87
        [[ -f "$FAKE_NETWORK_STATE_DIR/$network.caddy" ]] && printf '%s\n' fake-caddy
        ;;
    esac
    ;;
  ' network create '*)
    network="${!#}"
    if [[ " $* " == *' --internal '* ]]; then printf '%s\n' true; else printf '%s\n' false; fi > "$FAKE_NETWORK_STATE_DIR/$network.internal"
    ;;
  ' network rm '*)
    rm -f -- "$FAKE_NETWORK_STATE_DIR/$3.internal" "$FAKE_NETWORK_STATE_DIR/$3.containers" "$FAKE_NETWORK_STATE_DIR/$3.caddy"
    ;;
  ' network connect '*) touch "$FAKE_NETWORK_STATE_DIR/$3.caddy" ;;
  ' network disconnect '*) rm -f -- "$FAKE_NETWORK_STATE_DIR/$3.caddy" ;;
esac
EOF
cat > "$fake_bin/curl" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
[[ "${!#}" == http://127.0.0.1:5000/v2/ ]] || exit 90
[[ ! -f "$FAKE_REGISTRY_STATE_DIR/expressa-registry.stopped" ]]
[[ ! -f "$FAKE_REGISTRY_STATE_DIR/expressa-registry.unready" ]]
EOF
cat > "$fake_bin/nginx" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >> "$FAKE_NGINX_LOG"
EOF
cat > "$fake_bin/id" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  -gn) printf '%s\n' expressa-deploy ;;
  -g) printf '%s\n' 12345 ;;
  *) exit 1 ;;
esac
EOF
cat > "$fake_bin/install" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
arguments=()
while (( "$#" )); do
  case "$1" in
    --owner) shift 2 ;;
    --group) arguments+=(--group=12345); shift 2 ;;
    *) arguments+=("$1"); shift ;;
  esac
done
/usr/bin/install "${arguments[@]}"
EOF
cat > "$fake_bin/chown" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
arguments=("$@")
for index in "${!arguments[@]}"; do
  [[ "${arguments[$index]}" == 'root:expressa-deploy' ]] && arguments[$index]='root:12345'
done
/usr/bin/chown "${arguments[@]}"
EOF
cat > "$fake_bin/openssl" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
[[ -z "${FAKE_OPENSSL_DELAY:-}" ]] || sleep "$FAKE_OPENSSL_DELAY"
exec /usr/bin/openssl "$@"
EOF
cat > "$fake_bin/flock" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
if [[ -x /usr/bin/flock ]]; then
  exec /usr/bin/flock "$@"
fi
[[ "$#" == 1 && "$1" =~ ^[0-9]+$ ]] || exit 64
EOF
chmod 700 "$fake_bin/docker" "$fake_bin/nginx" "$fake_bin/curl" "$fake_bin/install" "$fake_bin/chown" "$fake_bin/openssl" "$fake_bin/flock"
chmod 700 "$fake_bin/id"

run_dry() {
  PATH="$fake_bin:$PATH" BOOTSTRAP_ROOT="$temporary_directory" BOOTSTRAP_DOCKER_BIN="$fake_bin/docker" BOOTSTRAP_NGINX_BIN="$fake_bin/nginx" EXPRESSA_DEPLOY_USER=expressa-deploy bash "$bootstrap_script" --dry-run
}

run_live() {
  local root="$1"
  mkdir -p -- "$root/network-state" "$root/registry-state"
  PATH="$fake_bin:$PATH" BOOTSTRAP_ROOT="$root" BOOTSTRAP_BACKUP_ROOT=/backups BOOTSTRAP_DOCKER_BIN="$fake_bin/docker" BOOTSTRAP_NGINX_BIN="$fake_bin/nginx" BOOTSTRAP_CURL_BIN="$fake_bin/curl" EXPRESSA_DEPLOY_USER=expressa-deploy FAKE_DOCKER_LOG="$root/docker.log" FAKE_NGINX_LOG="$root/nginx.log" FAKE_NETWORK_STATE_DIR="$root/network-state" FAKE_REGISTRY_STATE_DIR="$root/registry-state" FAKE_REGISTRY_DATA_DIRECTORY="$root/srv/expressa/registry/data" bash "$bootstrap_script"
}

prepare_live_root() {
  local root="$1"
  mkdir -p -- "$root/home/codex_macbook/infra/shared-caddy" "$root/etc/nginx/sites-available" "$root/etc/nginx/sites-enabled" "$root/run/lock" "$root/network-state" "$root/registry-state"
  printf '%s\n' 'example.org { respond "ok" }' > "$root/home/codex_macbook/infra/shared-caddy/Caddyfile"
  printf '%s\n' 'services: { caddy: { image: caddy:2 } }' > "$root/home/codex_macbook/infra/shared-caddy/docker-compose.yml"
}

write_runtime_file() {
  local root="$1" environment="$2" password="$3"
  mkdir -p -- "$root/srv/expressa/$environment"
  printf 'POSTGRES_PASSWORD=%s\n' "$password" > "$root/srv/expressa/$environment/runtime.env"
  chmod 0640 -- "$root/srv/expressa/$environment/runtime.env"
  chown root:12345 -- "$root/srv/expressa/$environment/runtime.env"
}

filesystem_state() {
  local root="$1"
  {
    find "$root" \( -path "$root/output.log" -o -path "$root/docker.log" -o -path "$root/nginx.log" \) -prune -o -printf '%y|%m|%U|%G|%p|%l\n' | sort
    find "$root" \( -path "$root/output.log" -o -path "$root/docker.log" -o -path "$root/nginx.log" \) -prune -o -type f -exec cksum {} + | sort
  }
}

assert_runtime_refusal() {
  local root="$1" label="$2" secret="$3" status before after
  before="$(filesystem_state "$root")"
  set +e
  run_live "$root" > "$root/output.log" 2>&1
  status="$?"
  set -e
  after="$(filesystem_state "$root")"
  [[ "$status" != 0 ]] || fail "$label runtime file was accepted"
  [[ "$before" == "$after" ]] || fail "$label runtime refusal changed filesystem state"
  if grep -Fq 'POSTGRES_PASSWORD=' "$root/output.log"; then
    fail "$label runtime input leaked a password"
  fi
  if grep -Fq "$secret" "$root/output.log"; then
    fail "$label runtime input leaked its known secret"
  fi
}

before="$(find "$temporary_directory" -type f -exec cksum {} + | sort)"
dry_output="$(run_dry 2>&1)"
dry_output+="$(run_dry 2>&1)"
after="$(find "$temporary_directory" -type f -exec cksum {} + | sort)"
[[ "$before" == "$after" ]] || fail 'dry run changed filesystem state'
if grep -Fq 'POSTGRES_PASSWORD=' <<< "$dry_output"; then
  fail 'dry run leaked a password'
fi

if [[ "$EUID" != 0 ]]; then
  printf '%s\n' 'bootstrap-vps non-dry harness requires root'
  exit 0
fi

live_root="$temporary_directory/live"
prepare_live_root "$live_root"
mkdir -p -- "$live_root/network-state"
: > "$live_root/network-state/expressa-development-edge.caddy"
if ! run_live "$live_root" > "$live_root/output.log" 2>&1; then
  cat -- "$live_root/output.log" >&2
  fail 'initial bootstrap failed'
fi
[[ -f "$live_root/srv/expressa/development/runtime.env" && -f "$live_root/srv/expressa/staging/runtime.env" ]] || fail 'runtime environment files were not created'
[[ "$(stat --format '%u:%g:%a' "$live_root/srv/expressa/development/runtime.env")" == '0:12345:640' ]] || fail 'development runtime environment file has unsafe permissions'
[[ "$(stat --format '%u:%g:%a' "$live_root/srv/expressa/staging/runtime.env")" == '0:12345:640' ]] || fail 'staging runtime environment file has unsafe permissions'
[[ -d "$live_root/srv/expressa/registry/data" ]] || fail 'registry data directory was not created'
[[ "$(stat --format '%u:%g:%a' "$live_root/srv/expressa/registry/data")" == '0:12345:750' ]] || fail 'registry data directory has unsafe permissions'
[[ "$(cat "$live_root/registry-state/expressa-registry")" == 'registry@sha256:7518da9b12dd746278282a729dee2e65eabdeb449db4d0b28d46ef6e90308f58' ]] || fail 'registry image is not pinned'
grep -Fq -- 'run --detach --name expressa-registry' "$live_root/docker.log" || fail 'registry container was not created'
grep -Fq -- '--publish 127.0.0.1:5000:5000' "$live_root/docker.log" || fail 'registry is not loopback-bound'
if grep -Eq -- '--publish (0\.0\.0\.0|5000:5000)' "$live_root/docker.log"; then
  fail 'registry exposed a public port'
fi
if grep -F -- 'run --detach --name expressa-registry' "$live_root/docker.log" | grep -Fq -- '--network'; then
  fail 'registry joined a Docker network'
fi
[[ "$(wc -l < "$live_root/srv/expressa/development/runtime.env")" == 1 ]] || fail 'development runtime file is not one line'
grep -Eq '^POSTGRES_PASSWORD=[A-Za-z0-9_-]{64}$' "$live_root/srv/expressa/development/runtime.env" || fail 'development runtime password is not URL-safe'
[[ "$(wc -l < "$live_root/srv/expressa/staging/runtime.env")" == 1 ]] || fail 'staging runtime file is not one line'
grep -Eq '^POSTGRES_PASSWORD=[A-Za-z0-9_-]{64}$' "$live_root/srv/expressa/staging/runtime.env" || fail 'staging runtime password is not URL-safe'
development_checksum="$(cksum "$live_root/srv/expressa/development/runtime.env")"
staging_checksum="$(cksum "$live_root/srv/expressa/staging/runtime.env")"
if cmp -s "$live_root/srv/expressa/development/runtime.env" "$live_root/srv/expressa/staging/runtime.env"; then
  fail 'runtime passwords are identical'
fi
if grep -Fq 'POSTGRES_PASSWORD=' "$live_root/output.log"; then
  fail 'bootstrap output leaked a password'
fi
run_live "$live_root" > "$live_root/idempotent-output.log" 2>&1
[[ "$development_checksum" == "$(cksum "$live_root/srv/expressa/development/runtime.env")" ]] || fail 'development password rotated on repeat bootstrap'
[[ "$staging_checksum" == "$(cksum "$live_root/srv/expressa/staging/runtime.env")" ]] || fail 'staging password rotated on repeat bootstrap'
[[ "$(grep -Fc 'run --detach --name expressa-registry' "$live_root/docker.log")" == 1 ]] || fail 'registry was recreated on an idempotent bootstrap'
assert_file_contains "$live_root/etc/nginx/sites-available/expressa-redirect" "return 308 https://\$host\$request_uri;"
[[ -L "$live_root/etc/nginx/sites-enabled/expressa-redirect" ]] || fail 'successful bootstrap did not enable nginx redirect'
[[ "$(readlink -- "$live_root/etc/nginx/sites-enabled/expressa-redirect")" == '../sites-available/expressa-redirect' ]] || fail 'successful bootstrap used an unexpected nginx redirect target'
if grep -Fq 'validate_deployment_compose' "$live_root/etc/nginx/sites-available/expressa-redirect"; then
  fail 'nginx redirect contains shell source'
fi
grep -Fq -- '--project-name expressa-development' "$live_root/docker.log" || fail 'development compose was not validated'
grep -Fq -- '--project-name expressa-staging' "$live_root/docker.log" || fail 'staging compose was not validated'
grep -Fq -- '--project-name shared_caddy' "$live_root/docker.log" || fail 'shared Caddy project name was not explicit'
network_membership_template="{{range \$id, \$_ := .Containers}}{{println \$id}}{{end}}"
grep -Fq -- "$network_membership_template" "$live_root/docker.log" || fail 'Caddy network membership did not inspect container IDs'
if grep -Fq -- 'network connect expressa-development-edge fake-caddy' "$live_root/docker.log"; then
  fail 'pre-existing development network was connected again'
fi
grep -Fq -- 'network connect expressa-staging-edge fake-caddy' "$live_root/docker.log" || fail 'missing staging network was not connected'
[[ "$(< "$live_root/network-state/expressa-development-edge.internal")" == false ]] || fail 'development edge network is internal'
[[ "$(< "$live_root/network-state/expressa-staging-edge.internal")" == false ]] || fail 'staging edge network is internal'
[[ "$(< "$live_root/network-state/expressa-development-data.internal")" == true ]] || fail 'development data network is not internal'
[[ "$(< "$live_root/network-state/expressa-staging-data.internal")" == true ]] || fail 'staging data network is not internal'
python3 - "$live_root/home/codex_macbook/infra/shared-caddy/Caddyfile" <<'PY'
from pathlib import Path
import re
import sys

content = Path(sys.argv[1]).read_text()
routes = {
    'dev.expressa.vitykovskiy.ru': ('development-backend', 'development-front'),
    'admin.dev.expressa.vitykovskiy.ru': ('development-backend', 'development-back'),
    'staging.expressa.vitykovskiy.ru': ('staging-backend', 'staging-front'),
    'admin.staging.expressa.vitykovskiy.ru': ('staging-backend', 'staging-back'),
}
for host, (backend, fallback) in routes.items():
    expected = rf'''{re.escape(host)} \{{
    handle /api/v1\* \{{
        reverse_proxy {backend}:3000
    \}}
    reverse_proxy {fallback}:8080
\}}'''
    if not re.search(expected, content):
        raise SystemExit(f'UI route ordering is invalid for {host}')
PY
! grep -Fqi 'ghcr' "$bootstrap_script" || fail 'GHCR reference remains'
for image in \
  '127.0.0.1:5000/expressa/backend@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' \
  '127.0.0.1:5000/expressa/front-office@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' \
  '127.0.0.1:5000/expressa/back-office@sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'; do
  sed -n '/validate_deployment_compose() {/,/^}/p' "$bootstrap_script" | grep -Fq "$image" || fail "missing loopback validation image: $image"
done

registry_stopped_root="$temporary_directory/registry-stopped"
prepare_live_root "$registry_stopped_root"
run_live "$registry_stopped_root" > "$registry_stopped_root/output.log" 2>&1
: > "$registry_stopped_root/registry-state/expressa-registry.stopped"
run_live "$registry_stopped_root" > "$registry_stopped_root/restart-output.log" 2>&1
[[ ! -f "$registry_stopped_root/registry-state/expressa-registry.stopped" ]] || fail 'stopped registry was not started'
[[ "$(grep -Fc 'start expressa-registry' "$registry_stopped_root/docker.log")" == 1 ]] || fail 'stopped registry was not started once'
run_live "$registry_stopped_root" > "$registry_stopped_root/idempotent-output.log" 2>&1
[[ "$(grep -Fc 'run --detach --name expressa-registry' "$registry_stopped_root/docker.log")" == 1 ]] || fail 'stopped registry was recreated'
[[ "$(grep -Fc 'start expressa-registry' "$registry_stopped_root/docker.log")" == 1 ]] || fail 'ready registry was started again'

registry_unready_root="$temporary_directory/registry-unready"
prepare_live_root "$registry_unready_root"
run_live "$registry_unready_root" > "$registry_unready_root/output.log" 2>&1
: > "$registry_unready_root/registry-state/expressa-registry.unready"
run_live "$registry_unready_root" > "$registry_unready_root/restart-output.log" 2>&1
[[ ! -f "$registry_unready_root/registry-state/expressa-registry.unready" ]] || fail 'unready registry was not restarted'
[[ "$(grep -Fc 'restart expressa-registry' "$registry_unready_root/docker.log")" == 1 ]] || fail 'unready registry was not restarted once'
run_live "$registry_unready_root" > "$registry_unready_root/idempotent-output.log" 2>&1
[[ "$(grep -Fc 'run --detach --name expressa-registry' "$registry_unready_root/docker.log")" == 1 ]] || fail 'unready registry was recreated'
[[ "$(grep -Fc 'restart expressa-registry' "$registry_unready_root/docker.log")" == 1 ]] || fail 'ready registry was restarted again'

registry_reconcile_root="$temporary_directory/registry-reconcile"
prepare_live_root "$registry_reconcile_root"
run_live "$registry_reconcile_root" > "$registry_reconcile_root/output.log" 2>&1
printf '%s\n' 'registry@sha256:wrong' > "$registry_reconcile_root/registry-state/expressa-registry"
run_live "$registry_reconcile_root" > "$registry_reconcile_root/reconcile-output.log" 2>&1
[[ "$(cat "$registry_reconcile_root/registry-state/expressa-registry")" == 'registry@sha256:7518da9b12dd746278282a729dee2e65eabdeb449db4d0b28d46ef6e90308f58' ]] || fail 'registry image mismatch was not reconciled'
grep -Fq -- 'stop expressa-registry' "$registry_reconcile_root/docker.log" || fail 'registry mismatch was not stopped'
grep -Fq -- 'rename expressa-registry expressa-registry-rollback' "$registry_reconcile_root/docker.log" || fail 'registry mismatch was not staged for rollback'

registry_public_root="$temporary_directory/registry-public"
prepare_live_root "$registry_public_root"
run_live "$registry_public_root" > "$registry_public_root/output.log" 2>&1
: > "$registry_public_root/registry-state/expressa-registry.public"
run_live "$registry_public_root" > "$registry_public_root/public-output.log" 2>&1
[[ ! -f "$registry_public_root/registry-state/expressa-registry.public" ]] || fail 'public registry binding was accepted'

registry_environment_root="$temporary_directory/registry-environment"
prepare_live_root "$registry_environment_root"
run_live "$registry_environment_root" > "$registry_environment_root/output.log" 2>&1
: > "$registry_environment_root/registry-state/expressa-registry.bad-env"
run_live "$registry_environment_root" > "$registry_environment_root/environment-output.log" 2>&1
[[ ! -f "$registry_environment_root/registry-state/expressa-registry.bad-env" ]] || fail 'duplicate or conflicting registry environment was accepted'
grep -Fq -- 'stop expressa-registry' "$registry_environment_root/docker.log" || fail 'invalid registry environment was not reconciled'

registry_rollback_root="$temporary_directory/registry-rollback"
prepare_live_root "$registry_rollback_root"
run_live "$registry_rollback_root" > "$registry_rollback_root/output.log" 2>&1
printf '%s\n' 'registry@sha256:wrong' > "$registry_rollback_root/registry-state/expressa-registry"
set +e
FAIL_REGISTRY_RUN=1 run_live "$registry_rollback_root" > "$registry_rollback_root/rollback-output.log" 2>&1
registry_rollback_status="$?"
set -e
[[ "$registry_rollback_status" != 0 ]] || fail 'failed registry replacement was accepted'
[[ "$(cat "$registry_rollback_root/registry-state/expressa-registry")" == 'registry@sha256:wrong' ]] || fail 'failed registry replacement was not rolled back'
[[ ! -f "$registry_rollback_root/registry-state/expressa-registry-rollback" ]] || fail 'failed registry replacement left rollback container'

repair_root="$temporary_directory/repair-data-network"
prepare_live_root "$repair_root"
printf '%s\n' false > "$repair_root/network-state/expressa-development-data.internal"
run_live "$repair_root" > "$repair_root/output.log" 2>&1
[[ "$(< "$repair_root/network-state/expressa-development-data.internal")" == true ]] || fail 'empty non-internal data network was not repaired'
grep -Fq -- 'network rm expressa-development-data' "$repair_root/docker.log" || fail 'empty data network was not removed for repair'
grep -Fq -- 'network create --internal expressa-development-data' "$repair_root/docker.log" || fail 'repaired data network was not recreated internal'

refusal_root="$temporary_directory/refuse-data-network"
prepare_live_root "$refusal_root"
printf '%s\n' false > "$refusal_root/network-state/expressa-development-data.internal"
printf '%s\n' 1 > "$refusal_root/network-state/expressa-development-data.containers"
refusal_network_state_before="$(find "$refusal_root/network-state" -type f -exec cksum {} + | sort)"
set +e
run_live "$refusal_root" > "$refusal_root/output.log" 2>&1
refusal_status="$?"
set -e
[[ "$refusal_status" != 0 ]] || fail 'occupied non-internal data network was accepted'
refusal_network_state_after="$(find "$refusal_root/network-state" -type f -exec cksum {} + | sort)"
[[ "$refusal_network_state_before" == "$refusal_network_state_after" ]] || fail 'occupied data network was mutated'

rollback_root="$temporary_directory/rollback"
prepare_live_root "$rollback_root"
printf '%s\n' 'example.org { respond "original" }' > "$rollback_root/home/codex_macbook/infra/shared-caddy/Caddyfile"
printf '%s\n' 'services: { caddy: { image: caddy:2 } }' > "$rollback_root/home/codex_macbook/infra/shared-caddy/docker-compose.yml"
printf '%s\n' 'original nginx redirect' > "$rollback_root/etc/nginx/sites-available/expressa-redirect"
mkdir -p -- "$rollback_root/network-state"
: > "$rollback_root/network-state/expressa-development-edge.caddy"
set +e
FAIL_CADDY_RELOAD=1 run_live "$rollback_root"
rollback_status="$?"
set -e
[[ "$rollback_status" != 0 ]] || fail 'Caddy reload failure was accepted'
assert_file_contains "$rollback_root/home/codex_macbook/infra/shared-caddy/Caddyfile" 'respond "original"'
assert_file_contains "$rollback_root/etc/nginx/sites-available/expressa-redirect" 'original nginx redirect'
[[ ! -e "$rollback_root/etc/nginx/sites-enabled/expressa-redirect" && ! -L "$rollback_root/etc/nginx/sites-enabled/expressa-redirect" ]] || fail 'rollback left a newly-created nginx enabled link'
if grep -Fq -- 'network disconnect expressa-development-edge fake-caddy' "$rollback_root/docker.log"; then
  fail 'rollback detached pre-existing development network'
fi
grep -Fq -- 'network disconnect expressa-staging-edge fake-caddy' "$rollback_root/docker.log" || fail 'rollback did not detach current-run staging network'

for nginx_link_case in correct different; do
  nginx_link_root="$temporary_directory/nginx-link-$nginx_link_case"
  prepare_live_root "$nginx_link_root"
  if [[ "$nginx_link_case" == correct ]]; then
    nginx_link_target='../sites-available/expressa-redirect'
  else
    nginx_link_target='../sites-available/other-redirect'
  fi
  ln -s -- "$nginx_link_target" "$nginx_link_root/etc/nginx/sites-enabled/expressa-redirect"
  set +e
  FAIL_CADDY_RELOAD=1 run_live "$nginx_link_root"
  nginx_link_status="$?"
  set -e
  [[ "$nginx_link_status" != 0 ]] || fail "$nginx_link_case nginx link rollback was accepted"
  [[ -L "$nginx_link_root/etc/nginx/sites-enabled/expressa-redirect" ]] || fail "$nginx_link_case nginx link was not restored"
  [[ "$(readlink -- "$nginx_link_root/etc/nginx/sites-enabled/expressa-redirect")" == "$nginx_link_target" ]] || fail "$nginx_link_case nginx link target changed"
done

duplicate_root="$temporary_directory/duplicate"
prepare_live_root "$duplicate_root"
write_runtime_file "$duplicate_root" development 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
write_runtime_file "$duplicate_root" staging 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
assert_runtime_refusal "$duplicate_root" 'identical passwords' 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

duplicate_line_root="$temporary_directory/duplicate-line"
prepare_live_root "$duplicate_line_root"
mkdir -p -- "$duplicate_line_root/srv/expressa/development"
printf 'POSTGRES_PASSWORD=%s\nPOSTGRES_PASSWORD=%s\n' \
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg' \
  'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg' \
  > "$duplicate_line_root/srv/expressa/development/runtime.env"
chmod 0640 -- "$duplicate_line_root/srv/expressa/development/runtime.env"
chown root:12345 -- "$duplicate_line_root/srv/expressa/development/runtime.env"
assert_runtime_refusal "$duplicate_line_root" 'duplicate password lines' 'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg'

unsafe_root="$temporary_directory/unsafe"
prepare_live_root "$unsafe_root"
write_runtime_file "$unsafe_root" development 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
chmod 0600 -- "$unsafe_root/srv/expressa/development/runtime.env"
assert_runtime_refusal "$unsafe_root" 'unsafe mode' 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

wrong_owner_root="$temporary_directory/wrong-owner"
prepare_live_root "$wrong_owner_root"
write_runtime_file "$wrong_owner_root" development 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'
chown 1:12345 -- "$wrong_owner_root/srv/expressa/development/runtime.env"
assert_runtime_refusal "$wrong_owner_root" 'wrong owner' 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'

wrong_group_root="$temporary_directory/wrong-group"
prepare_live_root "$wrong_group_root"
write_runtime_file "$wrong_group_root" development 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
chown root:12346 -- "$wrong_group_root/srv/expressa/development/runtime.env"
assert_runtime_refusal "$wrong_group_root" 'wrong group' 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'

invalid_root="$temporary_directory/invalid"
prepare_live_root "$invalid_root"
mkdir -p -- "$invalid_root/srv/expressa/development"
printf '%s\n' 'POSTGRES_PASSWORD=not-valid' > "$invalid_root/srv/expressa/development/runtime.env"
chmod 0640 -- "$invalid_root/srv/expressa/development/runtime.env"
chown root:12345 -- "$invalid_root/srv/expressa/development/runtime.env"
assert_runtime_refusal "$invalid_root" 'invalid value' 'not-valid'

unknown_root="$temporary_directory/unknown"
prepare_live_root "$unknown_root"
mkdir -p -- "$unknown_root/srv/expressa/development"
printf '%s\n' 'UNEXPECTED=value' > "$unknown_root/srv/expressa/development/runtime.env"
chmod 0640 -- "$unknown_root/srv/expressa/development/runtime.env"
chown root:12345 -- "$unknown_root/srv/expressa/development/runtime.env"
assert_runtime_refusal "$unknown_root" 'unknown value' 'value'

symlink_root="$temporary_directory/symlink"
prepare_live_root "$symlink_root"
mkdir -p -- "$symlink_root/srv/expressa/development"
printf 'POSTGRES_PASSWORD=%s\n' 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' > "$symlink_root/srv/expressa/development/target.env"
ln -s -- target.env "$symlink_root/srv/expressa/development/runtime.env"
assert_runtime_refusal "$symlink_root" 'symlink' 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

nonregular_root="$temporary_directory/nonregular"
prepare_live_root "$nonregular_root"
mkdir -p -- "$nonregular_root/srv/expressa/development/runtime.env"
printf '%s\n' 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' > "$nonregular_root/srv/expressa/development/runtime.env/known-secret"
assert_runtime_refusal "$nonregular_root" 'nonregular' 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

race_root="$temporary_directory/race"
prepare_live_root "$race_root"
FAKE_OPENSSL_DELAY=1 run_live "$race_root" > "$race_root/first-output.log" 2>&1 &
first_race_pid="$!"
FAKE_OPENSSL_DELAY=1 run_live "$race_root" > "$race_root/second-output.log" 2>&1 &
second_race_pid="$!"
set +e
wait "$first_race_pid"; first_race_status="$?"
wait "$second_race_pid"; second_race_status="$?"
set -e
[[ "$first_race_status" == 0 && "$second_race_status" == 0 ]] || fail 'concurrent bootstrap was not serialized'
if cmp -s "$race_root/srv/expressa/development/runtime.env" "$race_root/srv/expressa/staging/runtime.env"; then
  fail 'race created identical runtime passwords'
fi
grep -Eq '^POSTGRES_PASSWORD=[A-Za-z0-9_-]{64}$' "$race_root/srv/expressa/development/runtime.env" || fail 'race development password is invalid'
grep -Eq '^POSTGRES_PASSWORD=[A-Za-z0-9_-]{64}$' "$race_root/srv/expressa/staging/runtime.env" || fail 'race staging password is invalid'
if grep -Fq 'POSTGRES_PASSWORD=' "$race_root/first-output.log" "$race_root/second-output.log"; then
  fail 'concurrent bootstrap leaked a password'
fi
printf '%s\n' 'bootstrap-vps harness passed'
