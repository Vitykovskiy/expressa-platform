#!/usr/bin/env bash

set -Eeuo pipefail

repository_root="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
readonly repository_root
if (( EUID != 0 )); then
  exec docker run --rm --network none -v "$repository_root:/source:ro" ubuntu:24.04 bash -c 'cp -a /source/. /work && bash /work/deploy/test-deploy.sh'
fi
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT HUP INT TERM
fail() { printf 'test-deploy: %s\n' "$1" >&2; exit 1; }
assert_file_contains() { grep -Fqx "$2" "$1" || fail "missing state value: $2"; }
assert_registry_credentials_absent() {
  local root="$1"
  ! grep -E 'ghcr_username=x|ghcr_token=x|docker_config=x|docker login|ghcr\.io' "$root/docker.log" || fail 'registry credentials or GHCR reached Docker command log'
}

fake_docker="$temporary_directory/docker"
infrastructure_directory="$temporary_directory/infra"
mkdir -p "$infrastructure_directory/deploy"
cp "$repository_root/deploy/compose.yml" "$infrastructure_directory/compose.yml"
cp "$repository_root/deploy/deploy.sh" "$infrastructure_directory/deploy/deploy.sh"
chmod 755 "$infrastructure_directory/deploy/deploy.sh"
readonly deploy_script="$infrastructure_directory/deploy/deploy.sh"
read -r -d '' fake_docker_source <<'EOF' || true
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s|backend=%s|front=%s|back=%s|ghcr_username=%s|ghcr_token=%s|docker_config=%s\n' "$*" "${BACKEND_IMAGE:-}" "${FRONT_IMAGE:-}" "${BACK_IMAGE:-}" "${GHCR_USERNAME+x}" "${GHCR_TOKEN+x}" "${DOCKER_CONFIG+x}" >> "$FAKE_LOG"
if [[ "$1" == compose && "${EXPECTED_COMPOSE_FILE:-}" != '' && " $* " != *" --file $EXPECTED_COMPOSE_FILE "* ]]; then exit 29; fi
if [[ "${FAIL_SERVICE:-}" != '' && "$*" == *" up "* && "$*" == *" ${FAIL_SERVICE}"* ]]; then
  if [[ -z "${FAIL_ONCE_FILE:-}" || ! -e "$FAIL_ONCE_FILE" ]]; then [[ -z "${FAIL_ONCE_FILE:-}" ]] || : > "$FAIL_ONCE_FILE"; exit 23; fi
fi
if [[ "${BLOCK_SERVICE:-}" != '' && "$*" == *" up "* && "$*" == *" ${BLOCK_SERVICE}"* ]]; then
  if [[ -z "${BLOCK_ONCE_FILE:-}" || ! -e "$BLOCK_ONCE_FILE" ]]; then
    [[ -z "${BLOCK_ONCE_FILE:-}" ]] || : > "$BLOCK_ONCE_FILE"
    : > "${BLOCK_READY_FILE:?BLOCK_READY_FILE is required when blocking}"
    while :; do sleep 1; done
  fi
fi
if [[ "${WAIT_SERVICE:-}" != '' && "$*" == *" up "* && "$*" == *" ${WAIT_SERVICE}"* ]]; then
  : > "${WAIT_READY_FILE:?WAIT_READY_FILE is required when waiting}"
  while [[ ! -e "${WAIT_RELEASE_FILE:?WAIT_RELEASE_FILE is required when waiting}" ]]; do sleep 0.1; done
fi
if [[ "$1" == inspect ]]; then printf 'healthy\n'; exit 0; fi
if [[ "$1" == network || "$1" == --config ]]; then exit 0; fi
if [[ "$1" == compose ]]; then
  case " $* " in *" ps -q "*) printf 'fake-container\n' ;; *" exec "*" pg_dump "*) [[ "${FAIL_DUMP:-}" == 1 ]] && exit 24; printf 'CREATE TABLE test ();\n' ;; esac
fi
EOF
printf '%s\n' "$fake_docker_source" > "$fake_docker"; chmod 755 "$fake_docker"

digest() { printf '127.0.0.1:5000/expressa/%s@sha256:%064d' "$1" "$2"; }
write_runtime() {
  local root="$1"
  mkdir -p "$root/development/state" "$root/development/backups"
  chmod 700 "$root/development"
  rm -f "$root/development/runtime.env" "$root/development/runtime.target"
  printf '%s\n' 'POSTGRES_PASSWORD=development-password' > "$root/development/runtime.env"
  chown root:root "$root/development/runtime.env"
  chmod 640 "$root/development/runtime.env"
}
run_deploy() {
  local state_root="$1" operation="$2" target="$3"
  shift 3
  [[ "${SKIP_RUNTIME_WRITE:-}" == 1 ]] || write_runtime "$state_root"
  env DEPLOY_ROOT="$state_root" DEPLOY_MIN_FREE_KB=0 DEPLOY_DOCKER_BIN="$fake_docker" FAKE_LOG="$state_root/docker.log" EXPECTED_COMPOSE_FILE="$infrastructure_directory/compose.yml" GHCR_USERNAME=must-not-reach-docker GHCR_TOKEN=must-not-reach-docker DOCKER_CONFIG=/must-not-reach-docker "$@" bash "$deploy_script" --environment development "$operation" "$target"
}
run_deploy_as_unprivileged_user() {
  local state_root="$1" operation="$2" target="$3"
  shift 3
  setpriv --reuid 65534 --regid 65534 --clear-groups env DEPLOY_ROOT="$state_root" DEPLOY_MIN_FREE_KB=0 DEPLOY_DOCKER_BIN="$fake_docker" FAKE_LOG="$state_root/development/state/docker.log" EXPECTED_COMPOSE_FILE="$infrastructure_directory/compose.yml" "$@" bash "$deploy_script" --environment development "$operation" "$target"
}
wait_for_file() {
  local file="$1" retries=50
  while (( retries > 0 )); do [[ -e "$file" ]] && return 0; sleep 0.1; ((retries -= 1)); done
  fail "timed out waiting for: $file"
}
start_deploy() {
  local state_root="$1" operation="$2" target="$3" deployment_pid_file deployment_process_group harness_process_group retries=50
  shift 3
  [[ "${SKIP_RUNTIME_WRITE:-}" == 1 ]] || write_runtime "$state_root"
  deployment_pid_file="$(mktemp "$temporary_directory/.deployment.XXXXXX")"
  # shellcheck disable=SC2016
  setsid sh -c 'printf "%s\n" "$$" > "$1"; shift; exec env --default-signal=HUP,INT,TERM "$@"' deploy-harness "$deployment_pid_file" DEPLOY_ROOT="$state_root" DEPLOY_MIN_FREE_KB=0 DEPLOY_DOCKER_BIN="$fake_docker" FAKE_LOG="$state_root/docker.log" EXPECTED_COMPOSE_FILE="$infrastructure_directory/compose.yml" GHCR_USERNAME=must-not-reach-docker GHCR_TOKEN=must-not-reach-docker DOCKER_CONFIG=/must-not-reach-docker "$@" bash "$deploy_script" --environment development "$operation" "$target" &
  while (( retries > 0 )) && [[ ! -s "$deployment_pid_file" ]]; do sleep 0.01; ((retries -= 1)); done
  [[ -s "$deployment_pid_file" ]] || fail 'deployment process did not start'
  read -r deployment_pid < "$deployment_pid_file"
  rm -f "$deployment_pid_file"
  [[ "$deployment_pid" =~ ^[0-9]+$ ]] || fail 'deployment process did not start'
  deployment_process_group="$(ps -o pgid= -p "$deployment_pid" | tr -d ' ')"
  harness_process_group="$(ps -o pgid= -p "$$" | tr -d ' ')"
  [[ "$deployment_process_group" == "$deployment_pid" && "$deployment_process_group" != "$harness_process_group" ]] || fail 'deployment process group is not isolated'
}
assert_lock_reacquired() {
  local root="$1" image="$2"
  run_deploy "$root" deploy front FRONT_IMAGE="$image"
  assert_file_contains "$root/development/state/current" "FRONT_IMAGE=$image"
}
assert_deployment_reaped() {
  local process="$1" root="$2" descriptor
  ! kill -0 "$process" 2>/dev/null || fail 'deployment process was not reaped'
  [[ -z "$(pgrep -P "$process" || true)" ]] || fail 'deployment left a child process'
  for descriptor in /proc/[0-9]*/fd/[0-9]*; do
    [[ "$(readlink -f "$descriptor" 2>/dev/null || true)" != "$root/development/state/.deploy.lock" ]] || fail 'deployment left a lock holder'
  done
}
assert_real_lock_released_after_normal_completion() {
  local root="$temporary_directory/lock-normal" ready="$temporary_directory/lock-normal-ready" release="$temporary_directory/lock-normal-release" pid status
  run_deploy "$root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
  WAIT_SERVICE=front WAIT_READY_FILE="$ready" WAIT_RELEASE_FILE="$release" start_deploy "$root" deploy front FRONT_IMAGE="$(digest front-office 2)"
  pid="$deployment_pid"
  wait_for_file "$ready"
  : > "$release"
  wait "$pid"
  status="$?"
  [[ "$status" == 0 ]] || fail 'normal deployment did not return success status'
  assert_deployment_reaped "$pid" "$root"
  assert_lock_reacquired "$root" "$(digest front-office 2)"
}
assert_real_lock_released_after_signal() {
  local signal="$1" expected_status="$2" pid status
  local root="$temporary_directory/lock-$signal" ready="$temporary_directory/lock-$signal-ready" block_once="$temporary_directory/lock-$signal-blocked"
  run_deploy "$root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
  BLOCK_SERVICE=front BLOCK_READY_FILE="$ready" BLOCK_ONCE_FILE="$block_once" start_deploy "$root" deploy front FRONT_IMAGE="$(digest front-office 2)"
  pid="$deployment_pid"
  wait_for_file "$ready"
  kill "-$signal" -- "-$pid"
  set +e
  wait "$pid"
  status="$?"
  set -e
  [[ "$status" == "$expected_status" ]] || fail "$signal deployment did not return signal status"
  assert_file_contains "$root/development/state/current" "FRONT_IMAGE=$(digest front-office 1)"
  assert_deployment_reaped "$pid" "$root"
  assert_lock_reacquired "$root" "$(digest front-office 3)"
}

initial_root="$temporary_directory/initial"
set +e
run_deploy "$initial_root" deploy front FRONT_IMAGE="$(digest front-office 1)"
initial_status="$?"
set -e
[[ "$initial_status" != 0 ]] || fail 'partial first deploy was accepted'
[[ ! -e "$initial_root/development/state/current" && ! -e "$initial_root/development/state/previous" ]] || fail 'failed first deployment left deployment state'

for invalid_backend in \
  "127.0.0.1:5000/expressa/backend:latest" \
  "127.0.0.1:5000/expressa/backend@sha256:$(printf '%064d' 1):latest" \
  "ghcr.io/vitykovskiy/expressa-backend@sha256:$(printf '%064d' 1)" \
  "127.0.0.1:5001/expressa/backend@sha256:$(printf '%064d' 1)" \
  "127.0.0.1:5000/other/backend@sha256:$(printf '%064d' 1)" \
  "127.0.0.1:5000/expressa/front-office@sha256:$(printf '%064d' 1)"; do
  invalid_root="$temporary_directory/invalid-image-$RANDOM"
  set +e
  run_deploy "$invalid_root" deploy all BACKEND_IMAGE="$invalid_backend" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
  invalid_status="$?"
  set -e
  [[ "$invalid_status" != 0 ]] || fail "invalid image reference was accepted: $invalid_backend"
done

run_deploy "$initial_root" deploy all DEPLOY_COMPOSE_FILE=/tmp/untrusted.yml BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
assert_file_contains "$initial_root/development/state/current" "BACKEND_IMAGE=$(digest backend 1)"
assert_file_contains "$initial_root/development/state/current" "FRONT_IMAGE=$(digest front-office 1)"
assert_file_contains "$initial_root/development/state/current" "BACK_IMAGE=$(digest back-office 1)"
[[ "$(wc -l < "$initial_root/development/state/current" | tr -d ' ')" == 4 ]] || fail 'state does not contain exactly three app digests'
grep -F "pull backend front back|backend=$(digest backend 1)" "$initial_root/docker.log" >/dev/null || fail 'initial images were not pulled by canonical local digest'
assert_registry_credentials_absent "$initial_root"

partial_root="$temporary_directory/partial"
run_deploy "$partial_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
run_deploy "$partial_root" deploy front FRONT_IMAGE="$(digest front-office 2)"
assert_file_contains "$partial_root/development/state/current" "BACKEND_IMAGE=$(digest backend 1)"
assert_file_contains "$partial_root/development/state/current" "FRONT_IMAGE=$(digest front-office 2)"
assert_registry_credentials_absent "$partial_root"

backup_root="$temporary_directory/backups"
run_deploy "$backup_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
run_deploy "$backup_root" deploy backend BACKEND_IMAGE="$(digest backend 2)"
backup_count="$(find "$backup_root/development/backups" -name 'postgres-*.sql.gz' -type f | wc -l | tr -d ' ')"
[[ "$backup_count" == 2 ]] || fail 'backend deployments did not create unique database backups'
backup_failure_root="$temporary_directory/backup-failure"
set +e
FAIL_DUMP=1 run_deploy "$backup_failure_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
backup_failure_status="$?"
set -e
[[ "$backup_failure_status" != 0 ]] || fail 'pg_dump failure was accepted'
[[ ! -e "$backup_failure_root/development/state/current" ]] || fail 'failed first backup wrote deployment state'

failure_root="$temporary_directory/failure"
run_deploy "$failure_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
set +e
FAIL_SERVICE=front run_deploy "$failure_root" deploy all BACKEND_IMAGE="$(digest backend 2)" FRONT_IMAGE="$(digest front-office 2)" BACK_IMAGE="$(digest back-office 2)"
failure_status="$?"
set -e
[[ "$failure_status" != 0 ]] || fail 'failed deployment was accepted'
assert_file_contains "$failure_root/development/state/current" "FRONT_IMAGE=$(digest front-office 1)"

rollback_failure_root="$temporary_directory/rollback-failure"
run_deploy "$rollback_failure_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
run_deploy "$rollback_failure_root" deploy all BACKEND_IMAGE="$(digest backend 2)" FRONT_IMAGE="$(digest front-office 2)" BACK_IMAGE="$(digest back-office 2)"
set +e
FAIL_SERVICE=front run_deploy "$rollback_failure_root" rollback front
rollback_failure_status="$?"
set -e
[[ "$rollback_failure_status" != 0 ]] || fail 'failed rollback was accepted'
assert_file_contains "$rollback_failure_root/development/state/current" "FRONT_IMAGE=$(digest front-office 2)"
run_deploy "$rollback_failure_root" rollback front
assert_file_contains "$rollback_failure_root/development/state/current" "FRONT_IMAGE=$(digest front-office 1)"

signal_root="$temporary_directory/signal-recovery"
run_deploy "$signal_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
signal_ready="$temporary_directory/signal-ready"
signal_block_once="$temporary_directory/signal-blocked"
BLOCK_SERVICE=front BLOCK_READY_FILE="$signal_ready" BLOCK_ONCE_FILE="$signal_block_once" start_deploy "$signal_root" deploy front FRONT_IMAGE="$(digest front-office 2)"
signal_pid="$deployment_pid"
wait_for_file "$signal_ready"
kill -HUP -- "-$signal_pid"
set +e
wait "$signal_pid"
signal_status="$?"
set -e
[[ "$signal_status" == 129 ]] || fail 'HUP deployment did not return signal status'
assert_file_contains "$signal_root/development/state/current" "FRONT_IMAGE=$(digest front-office 1)"

if command -v flock >/dev/null 2>&1; then
  assert_real_lock_released_after_normal_completion
  lock_root="$temporary_directory/lock"
  run_deploy "$lock_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
  assert_lock_reacquired "$lock_root" "$(digest front-office 2)"
  set +e
  DEPLOY_LOCK_HELD=1 run_deploy "$lock_root" deploy front FRONT_IMAGE="$(digest front-office 3)"
  forged_lock_status="$?"
  set -e
  [[ "$forged_lock_status" != 0 ]] || fail 'forged lock marker bypassed deployment lock'
  lock_ready="$temporary_directory/lock-ready"
  lock_block_once="$temporary_directory/lock-blocked"
  BLOCK_SERVICE=front BLOCK_READY_FILE="$lock_ready" BLOCK_ONCE_FILE="$lock_block_once" start_deploy "$lock_root" deploy front FRONT_IMAGE="$(digest front-office 3)"
  lock_pid="$deployment_pid"
  wait_for_file "$lock_ready"
  set +e
  run_deploy "$lock_root" deploy front FRONT_IMAGE="$(digest front-office 4)"
  lock_status="$?"
  set -e
  [[ "$lock_status" == 75 ]] || fail 'concurrent deployment did not return lock conflict status'
  for adversary in 1 2 3; do
    (
      set +e
      run_deploy "$lock_root" deploy front FRONT_IMAGE="$(digest front-office 4)"
      printf '%s\n' "$?" > "$temporary_directory/adversary-$adversary.status"
    ) &
    adversary_pids[adversary]="$!"
  done
  for adversary in 1 2 3; do wait "${adversary_pids[$adversary]}"; done
  for adversary in 1 2 3; do
    [[ "$(< "$temporary_directory/adversary-$adversary.status")" == 75 ]] || fail 'adversarial deployment acquired lock'
  done
  kill -HUP -- "-$lock_pid"
  set +e
  wait "$lock_pid"
  lock_signal_status="$?"
  set -e
  [[ "$lock_signal_status" == 129 ]] || fail 'contended deployment did not return HUP status'
  assert_deployment_reaped "$lock_pid" "$lock_root"
  assert_lock_reacquired "$lock_root" "$(digest front-office 4)"
  assert_real_lock_released_after_signal HUP 129
  assert_real_lock_released_after_signal TERM 143
  assert_real_lock_released_after_signal INT 130
fi

run_deploy "$partial_root" deploy all BACKEND_IMAGE="$(digest backend 3)" FRONT_IMAGE="$(digest front-office 3)" BACK_IMAGE="$(digest back-office 3)"
run_deploy "$partial_root" rollback front
assert_file_contains "$partial_root/development/state/current" "FRONT_IMAGE=$(digest front-office 2)"
assert_registry_credentials_absent "$partial_root"

permission_lock_root="$temporary_directory/permission-lock"
write_runtime "$permission_lock_root"
chown root:65534 "$permission_lock_root/development/runtime.env"
chown 65534:65534 "$permission_lock_root/development/state" "$permission_lock_root/development/backups"
chmod 700 "$permission_lock_root/development/state" "$permission_lock_root/development/backups"
chmod 555 "$permission_lock_root/development"
chmod 755 "$temporary_directory" "$permission_lock_root"
run_deploy_as_unprivileged_user "$permission_lock_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
[[ -f "$permission_lock_root/development/state/.deploy.lock" ]] || fail 'deployment lock was not created in writable state directory'
assert_file_contains "$permission_lock_root/development/state/current" "BACKEND_IMAGE=$(digest backend 1)"

permission_root="$temporary_directory/permission-runtime"
write_runtime "$permission_root"
chmod 600 "$permission_root/development/runtime.env"
set +e
SKIP_RUNTIME_WRITE=1 run_deploy "$permission_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
permission_status="$?"
set -e
[[ "$permission_status" != 0 ]] || fail 'runtime file with mode 0600 was accepted'

write_runtime "$permission_root"
chown 65534:root "$permission_root/development/runtime.env"
set +e
SKIP_RUNTIME_WRITE=1 run_deploy "$permission_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
owner_status="$?"
set -e
[[ "$owner_status" != 0 ]] || fail 'runtime file with non-root owner was accepted'

write_runtime "$permission_root"
chown root:65534 "$permission_root/development/runtime.env"
set +e
SKIP_RUNTIME_WRITE=1 run_deploy "$permission_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
group_status="$?"
set -e
[[ "$group_status" != 0 ]] || fail 'runtime file without deploy-group access was accepted'

write_runtime "$permission_root"
mv "$permission_root/development/runtime.env" "$permission_root/development/runtime.target"
ln -s runtime.target "$permission_root/development/runtime.env"
set +e
SKIP_RUNTIME_WRITE=1 run_deploy "$permission_root" deploy all BACKEND_IMAGE="$(digest backend 1)" FRONT_IMAGE="$(digest front-office 1)" BACK_IMAGE="$(digest back-office 1)"
symlink_status="$?"
set -e
[[ "$symlink_status" != 0 ]] || fail 'runtime file symlink was accepted'

if command -v docker >/dev/null 2>&1; then for environment in development staging; do
  rendered_compose="$(DEPLOY_ENV="$environment" COMPOSE_PROJECT_NAME="expressa-$environment" POSTGRES_DB=expressa POSTGRES_USER=expressa POSTGRES_PASSWORD=development-password DATABASE_URL=postgresql://expressa:development-password@postgres:5432/expressa BACKEND_IMAGE="$(digest backend 9)" FRONT_IMAGE="$(digest front-office 9)" BACK_IMAGE="$(digest back-office 9)" docker compose --project-name "expressa-$environment" --file "$repository_root/deploy/compose.yml" config)"
  grep -F 'postgres:16-alpine@sha256:57c72fd2a128e416c7fcc499958864df5301e940bca0a56f58fddf30ffc07777' <<< "$rendered_compose" >/dev/null || fail 'postgres is not digest-pinned'
  grep -F "name: expressa-$environment-edge" <<< "$rendered_compose" >/dev/null || fail 'edge network name is incorrect'
  grep -F "name: expressa-$environment-data" <<< "$rendered_compose" >/dev/null || fail 'data network name is incorrect'
  grep -F -- "- $environment-backend" <<< "$rendered_compose" >/dev/null || fail 'backend network alias is incorrect'
  grep -F -- "- $environment-front" <<< "$rendered_compose" >/dev/null || fail 'front network alias is incorrect'
  grep -F -- "- $environment-back" <<< "$rendered_compose" >/dev/null || fail 'back network alias is incorrect'
done
fi
printf '%s\n' 'deploy regression harness passed'
