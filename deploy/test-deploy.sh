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
assert_registry_clean() {
  local root="$1"
  grep -F 'token-not-exported' "$root/docker.log" && fail 'registry token reached Docker command log'
  grep -F 'token=x' "$root/docker.log" && fail 'registry token reached Docker child environment'
  [[ -z "$(find "$root/development/state" -maxdepth 1 -name '.docker-config.*' -print -quit)" ]] || fail 'registry config directory remained after deployment'
}

fake_docker="$temporary_directory/docker"; fake_flock="$temporary_directory/flock"
infrastructure_directory="$temporary_directory/infra"
mkdir -p "$infrastructure_directory/deploy"
cp "$repository_root/deploy/compose.yml" "$infrastructure_directory/compose.yml"
cp "$repository_root/deploy/deploy.sh" "$infrastructure_directory/deploy/deploy.sh"
chmod 700 "$infrastructure_directory/deploy/deploy.sh"
readonly deploy_script="$infrastructure_directory/deploy/deploy.sh"
read -r -d '' fake_docker_source <<'EOF' || true
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s|token=%s|config=%s\n' "$*" "${GHCR_TOKEN+x}" "${DOCKER_CONFIG+x}" >> "$FAKE_LOG"
if [[ "$1" == compose && "${EXPECTED_COMPOSE_FILE:-}" != '' && " $* " != *" --file $EXPECTED_COMPOSE_FILE "* ]]; then exit 29; fi
if [[ "${FAIL_SERVICE:-}" != '' && "$*" == *" up "* && "$*" == *" ${FAIL_SERVICE}"* ]]; then
  if [[ -z "${FAIL_ONCE_FILE:-}" || ! -e "$FAIL_ONCE_FILE" ]]; then [[ -z "${FAIL_ONCE_FILE:-}" ]] || : > "$FAIL_ONCE_FILE"; exit 23; fi
fi
if [[ "$1" == inspect ]]; then printf 'healthy\n'; exit 0; fi
if [[ "$1" == network || "$1" == --config ]]; then exit 0; fi
if [[ "$1" == compose ]]; then
  case " $* " in *" ps -q "*) printf 'fake-container\n' ;; *" exec "*" pg_dump "*) [[ "${FAIL_DUMP:-}" == 1 ]] && exit 24; printf 'CREATE TABLE test ();\n' ;; esac
fi
EOF
read -r -d '' fake_flock_source <<'EOF' || true
#!/usr/bin/env bash
exit 0
EOF
printf '%s\n' "$fake_docker_source" > "$fake_docker"; printf '%s\n' "$fake_flock_source" > "$fake_flock"; chmod 700 "$fake_docker" "$fake_flock"

digest() { printf 'ghcr.io/vitykovskiy/expressa-platform/%s@sha256:%064d' "$1" "$2"; }
write_runtime() {
  local root="$1"
  mkdir -p "$root/development"
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
  env DEPLOY_ROOT="$state_root" DEPLOY_MIN_FREE_KB=0 DEPLOY_DOCKER_BIN="$fake_docker" DEPLOY_FLOCK_BIN="$fake_flock" FAKE_LOG="$state_root/docker.log" EXPECTED_COMPOSE_FILE="$infrastructure_directory/compose.yml" GHCR_USERNAME=deploy-test GHCR_TOKEN=token-not-exported "$@" bash "$deploy_script" --environment development "$operation" "$target"
}

initial_root="$temporary_directory/initial"
set +e
run_deploy "$initial_root" deploy front FRONT_IMAGE="$(digest expressa-front-office 1)"
initial_status="$?"
set -e
[[ "$initial_status" != 0 ]] || fail 'partial first deploy was accepted'
run_deploy "$initial_root" deploy all DEPLOY_COMPOSE_FILE=/tmp/untrusted.yml BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)"
assert_file_contains "$initial_root/development/state/current" "BACKEND_IMAGE=$(digest expressa-backend 1)"
assert_file_contains "$initial_root/development/state/current" "FRONT_IMAGE=$(digest expressa-front-office 1)"
assert_file_contains "$initial_root/development/state/current" "BACK_IMAGE=$(digest expressa-back-office 1)"
[[ "$(wc -l < "$initial_root/development/state/current" | tr -d ' ')" == 4 ]] || fail 'state does not contain exactly three app digests'
assert_registry_clean "$initial_root"

partial_root="$temporary_directory/partial"
run_deploy "$partial_root" deploy all BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)"
run_deploy "$partial_root" deploy front FRONT_IMAGE="$(digest expressa-front-office 2)"
assert_file_contains "$partial_root/development/state/current" "BACKEND_IMAGE=$(digest expressa-backend 1)"
assert_file_contains "$partial_root/development/state/current" "FRONT_IMAGE=$(digest expressa-front-office 2)"
assert_registry_clean "$partial_root"

failure_root="$temporary_directory/failure"
run_deploy "$failure_root" deploy all BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)"
set +e
FAIL_SERVICE=front run_deploy "$failure_root" deploy all BACKEND_IMAGE="$(digest expressa-backend 2)" FRONT_IMAGE="$(digest expressa-front-office 2)" BACK_IMAGE="$(digest expressa-back-office 2)"
failure_status="$?"
set -e
[[ "$failure_status" != 0 ]] || fail 'failed deployment was accepted'
assert_file_contains "$failure_root/development/state/current" "FRONT_IMAGE=$(digest expressa-front-office 1)"

run_deploy "$partial_root" deploy all BACKEND_IMAGE="$(digest expressa-backend 3)" FRONT_IMAGE="$(digest expressa-front-office 3)" BACK_IMAGE="$(digest expressa-back-office 3)"
run_deploy "$partial_root" rollback front
assert_file_contains "$partial_root/development/state/current" "FRONT_IMAGE=$(digest expressa-front-office 2)"
assert_registry_clean "$partial_root"

bad_runtime="$temporary_directory/bad-runtime"
mkdir -p "$bad_runtime/development"
printf '%s\n' 'POSTGRES_PASSWORD=development-password' 'GHCR_TOKEN=forbidden' > "$bad_runtime/development/runtime.env"
chown root:root "$bad_runtime/development/runtime.env"
chmod 640 "$bad_runtime/development/runtime.env"
set +e
env DEPLOY_ROOT="$bad_runtime" DEPLOY_MIN_FREE_KB=0 DEPLOY_DOCKER_BIN="$fake_docker" DEPLOY_FLOCK_BIN="$fake_flock" FAKE_LOG="$bad_runtime/docker.log" GHCR_USERNAME=deploy-test GHCR_TOKEN=token BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)" bash "$deploy_script" --environment development deploy all
bad_status="$?"
set -e
[[ "$bad_status" != 0 ]] || fail 'runtime file accepted registry credentials'

missing_root="$temporary_directory/missing-credentials"
write_runtime "$missing_root"
set +e
env -u GHCR_USERNAME -u GHCR_TOKEN DEPLOY_ROOT="$missing_root" DEPLOY_MIN_FREE_KB=0 DEPLOY_DOCKER_BIN="$fake_docker" DEPLOY_FLOCK_BIN="$fake_flock" FAKE_LOG="$missing_root/docker.log" BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)" bash "$deploy_script" --environment development deploy all
missing_status="$?"
set -e
[[ "$missing_status" != 0 ]] || fail 'missing registry credentials were accepted'

malicious_root="$temporary_directory/malicious-credentials"
set +e
run_deploy "$malicious_root" deploy all GHCR_USERNAME='invalid/user' BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)"
malicious_status="$?"
set -e
[[ "$malicious_status" != 0 ]] || fail 'malicious registry username was accepted'

permission_root="$temporary_directory/permission-runtime"
write_runtime "$permission_root"
chmod 600 "$permission_root/development/runtime.env"
set +e
SKIP_RUNTIME_WRITE=1 run_deploy "$permission_root" deploy all BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)"
permission_status="$?"
set -e
[[ "$permission_status" != 0 ]] || fail 'runtime file with mode 0600 was accepted'

write_runtime "$permission_root"
chown 65534:root "$permission_root/development/runtime.env"
set +e
SKIP_RUNTIME_WRITE=1 run_deploy "$permission_root" deploy all BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)"
owner_status="$?"
set -e
[[ "$owner_status" != 0 ]] || fail 'runtime file with non-root owner was accepted'

write_runtime "$permission_root"
chown root:65534 "$permission_root/development/runtime.env"
set +e
SKIP_RUNTIME_WRITE=1 run_deploy "$permission_root" deploy all BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)"
group_status="$?"
set -e
[[ "$group_status" != 0 ]] || fail 'runtime file without deploy-group access was accepted'

write_runtime "$permission_root"
mv "$permission_root/development/runtime.env" "$permission_root/development/runtime.target"
ln -s runtime.target "$permission_root/development/runtime.env"
set +e
SKIP_RUNTIME_WRITE=1 run_deploy "$permission_root" deploy all BACKEND_IMAGE="$(digest expressa-backend 1)" FRONT_IMAGE="$(digest expressa-front-office 1)" BACK_IMAGE="$(digest expressa-back-office 1)"
symlink_status="$?"
set -e
[[ "$symlink_status" != 0 ]] || fail 'runtime file symlink was accepted'

if command -v docker >/dev/null 2>&1; then for environment in development staging; do
  rendered_compose="$(DEPLOY_ENV="$environment" COMPOSE_PROJECT_NAME="expressa-$environment" POSTGRES_DB=expressa POSTGRES_USER=expressa POSTGRES_PASSWORD=development-password DATABASE_URL=postgresql://expressa:development-password@postgres:5432/expressa BACKEND_IMAGE="$(digest expressa-backend 9)" FRONT_IMAGE="$(digest expressa-front-office 9)" BACK_IMAGE="$(digest expressa-back-office 9)" docker compose --project-name "expressa-$environment" --file "$repository_root/deploy/compose.yml" config)"
  grep -F 'postgres:16-alpine@sha256:57c72fd2a128e416c7fcc499958864df5301e940bca0a56f58fddf30ffc07777' <<< "$rendered_compose" >/dev/null || fail 'postgres is not digest-pinned'
  grep -F "name: expressa-$environment-edge" <<< "$rendered_compose" >/dev/null || fail 'edge network name is incorrect'
  grep -F "name: expressa-$environment-data" <<< "$rendered_compose" >/dev/null || fail 'data network name is incorrect'
done
fi
printf '%s\n' 'deploy regression harness passed'
