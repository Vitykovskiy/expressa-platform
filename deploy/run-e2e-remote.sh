#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  printf '%s\n' 'Usage: run-e2e-remote.sh setup-report-host|run|diagnostic build|deploy|readiness|self-test-allowlist' >&2
  exit 64
}

fail() {
  printf 'e2e-runtime: %s\n' "$1" >&2
  exit 1
}

script_directory="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
compose_file="$script_directory/e2e-compose.yml"
gateway_file="$script_directory/e2e-gateway.nginx.conf"
report_template="$script_directory/e2e-report.nginx.conf.template"
report_root="${E2E_REPORT_ROOT:-${XDG_DATA_HOME:-$HOME/.local/share}/expressa/e2e-reports}"
report_config_root="${E2E_REPORT_CONFIG_ROOT:-${XDG_DATA_HOME:-$HOME/.local/share}/expressa/e2e-report-host}"
report_port="${E2E_REPORT_PORT:-8088}"
runtime_file="${E2E_RUNTIME_FILE:-/srv/expressa/development/runtime.env}"
work_root="${E2E_WORK_ROOT:-${XDG_DATA_HOME:-$HOME/.local/share}/expressa/e2e-runs}"
report_container='expressa-e2e-report-host'
project=''
run_directory=''
suite_directory=''
report_entries=()
suite_published=0
suite_diagnostic=''
cleanup_failure=0
stage='runtime'

[[ -f "$compose_file" && ! -L "$compose_file" ]] || fail 'e2e-compose.yml is unavailable'
[[ -f "$gateway_file" && ! -L "$gateway_file" ]] || fail 'e2e gateway configuration is unavailable'
[[ -f "$report_template" && ! -L "$report_template" ]] || fail 'report configuration template is unavailable'

validate_report_host_input() {
  [[ "$report_port" =~ ^[1-9][0-9]{0,4}$ && "$report_port" -le 65535 ]] || fail 'E2E_REPORT_PORT is invalid'
  [[ "${E2E_REPORT_ALLOWLIST:-}" ]] || fail 'E2E_REPORT_ALLOWLIST is required'
  local cidr
  for cidr in $E2E_REPORT_ALLOWLIST; do
    validate_cidr "$cidr" || fail 'E2E_REPORT_ALLOWLIST contains an invalid CIDR'
  done
}

validate_cidr() {
  python3 -c 'import ipaddress; import sys; ipaddress.ip_network(sys.argv[1], strict=False)' "$1" >/dev/null 2>&1
}

self_test_allowlist() {
  validate_cidr '127.0.0.1/32' || fail 'valid IPv4 CIDR was rejected'
  validate_cidr '2001:db8::/32' || fail 'valid IPv6 CIDR was rejected'
  if validate_cidr '999.999.999.999/999'; then
    fail 'invalid IPv4 CIDR was accepted'
  fi
  if validate_cidr '2001:db8::/129'; then
    fail 'invalid IPv6 CIDR was accepted'
  fi
  python3 - <<'PY' || fail 'E2E evidence redaction patterns are invalid'
import json
import re

credentials = {b"+79990000001", b"123456"}
numeric_credentials = {credential for credential in credentials if credential.isdigit()}
phone_pattern = re.compile(rb"\+7(?:[\s()\-]*\d){10}")

def redact(content):
    for credential in credentials - numeric_credentials:
        content = content.replace(credential, b"*" * len(credential))
    for credential in numeric_credentials:
        content = re.sub(
            rb"([\"'])" + re.escape(credential) + rb"\1",
            lambda match: match.group(1) + b"*" * len(credential) + match.group(1),
            content,
        )
        content = re.sub(
            rb"(?i)((?:e2e_)?(?:otp|code|password|token|\xd0\xba\xd0\xbe\xd0\xb4|\xd0\xbf\xd0\xb0\xd1\x80\xd0\xbe\xd0\xbb\xd1\x8c)[^0-9]{0,32})"
            + re.escape(credential)
            + rb"(?![0-9])",
            lambda match: match.group(1) + b"0",
            content,
        )
    return phone_pattern.sub(lambda match: b"*" * len(match.group()), content)

source = b'{"amount":5484.534123456001,"otp":"123456","otpNumeric":123456,"rawPhone":"+79990000001","phone":"+7 (999) 000-00-01"}'
sanitized = redact(source)
if b'"otp":"123456"' in sanitized or b'"otpNumeric":123456' in sanitized or b'+79990000001' in sanitized or b'+7 (999) 000-00-01' in sanitized:
    raise SystemExit(1)
if json.loads(sanitized)["amount"] != json.loads(source)["amount"] or json.loads(sanitized)["otpNumeric"] != 0:
    raise SystemExit(1)
PY
}

validate_metadata() {
  [[ "${E2E_RUN_ID:-}" =~ ^[1-9][0-9]*$ ]] || fail 'E2E_RUN_ID is invalid'
  [[ "${E2E_REVISION:-}" =~ ^[a-f0-9]{40}$ ]] || fail 'E2E_REVISION is invalid'
  [[ "${E2E_RUN_URL:-}" =~ ^https://github\.com/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+/actions/runs/[1-9][0-9]*$ ]] || fail 'E2E_RUN_URL is invalid'
}

ensure_report_host() {
  validate_report_host_input
  [[ ! -L "$report_root" && ! -L "$report_config_root" ]] || fail 'report path must not be a symbolic link'
  install -d -m 755 "$report_root"
  install -d -m 750 "$report_config_root"
  local allow_lines='' cidr
  for cidr in $E2E_REPORT_ALLOWLIST; do
    allow_lines+="    allow $cidr;"$'\n'
  done
  while IFS= read -r line; do
    if [[ "$line" == __ALLOWLIST__ ]]; then
      printf '%s' "$allow_lines"
    else
      printf '%s\n' "$line"
    fi
  done < "$report_template" > "$report_config_root/default.conf"
  if docker inspect "$report_container" >/dev/null 2>&1; then
    docker kill --signal HUP "$report_container" >/dev/null
  else
    docker run --detach --name "$report_container" --restart unless-stopped \
      --publish "$report_port:8080" \
      --volume "$report_root:/usr/share/nginx/html:ro" \
      --volume "$report_config_root/default.conf:/etc/nginx/conf.d/default.conf:ro" \
      "nginxinc/nginx-unprivileged:stable-alpine-slim@sha256:e88d990b349df8cf4aa82f16642d7a23375016638c9ace4e5c6ca25028e62e65" >/dev/null
  fi
}

assert_no_e2e_secret() {
  local publication_directory="$1" secret
  for secret in "${E2E_ADMIN_PHONE:-}" "${E2E_STAFF_PHONE:-}" "${E2E_CUSTOMER_PHONE:-}" "${E2E_CUSTOMER_2_PHONE:-}" "${POSTGRES_PASSWORD:-}" "${AUTH_ACCESS_TOKEN_SECRET:-}" "${AUTH_OTP_PEPPER:-}" "${DELIVERY_VAPID_SUBJECT:-}" "${DELIVERY_VAPID_PUBLIC_KEY:-}" "${DELIVERY_VAPID_PRIVATE_KEY:-}" "${VAPID_SUBJECT:-}" "${VAPID_PUBLIC_KEY:-}" "${VAPID_PRIVATE_KEY:-}"; do
    [[ -n "$secret" ]] || continue
    if grep --recursive --fixed-strings --quiet -- "$secret" "$publication_directory"; then
      fail 'E2E credential was found in report publication'
    fi
  done
  python3 - "$publication_directory" "${E2E_OTP:-}" <<'PY' || fail 'E2E credential was found in report publication'
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
otp = sys.argv[2].encode()
phone_pattern = re.compile(rb"\+7(?:[\s()\-]*\d){10}")
otp_pattern = re.compile(rb"(?<![0-9.])" + re.escape(otp) + rb"(?![0-9.])") if otp else None

for path in root.rglob("*"):
    if not path.is_file() or path.is_symlink():
        continue
    content = path.read_bytes()
    if phone_pattern.search(content) or (otp_pattern and otp_pattern.search(content)):
        raise SystemExit(1)
PY
}

sanitize_e2e_report() {
  local publication_directory="$1"
  python3 - "$publication_directory" <<'PY'
import os
import pathlib
import base64
import io
import re
import sys
import zipfile

root = pathlib.Path(sys.argv[1])
credentials = {
    os.environ.get(name, "").encode()
    for name in (
        "E2E_ADMIN_PHONE",
        "E2E_STAFF_PHONE",
        "E2E_CUSTOMER_PHONE",
        "E2E_CUSTOMER_2_PHONE",
        "E2E_OTP",
        "POSTGRES_PASSWORD",
        "AUTH_ACCESS_TOKEN_SECRET",
        "AUTH_OTP_PEPPER",
        "DELIVERY_VAPID_SUBJECT",
        "DELIVERY_VAPID_PUBLIC_KEY",
        "DELIVERY_VAPID_PRIVATE_KEY",
        "VAPID_SUBJECT",
        "VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY",
    )
}
numeric_credentials = {credential for credential in credentials if credential.isdigit()}
report_pattern = re.compile(
    rb'(<template id="playwrightReportBase64">data:application/zip;base64,)(.*?)(</template>)',
    re.DOTALL,
)
phone_pattern = re.compile(rb"\+7(?:[\s()\-]*\d){10}")

def redact(content: bytes) -> bytes:
    for credential in credentials - numeric_credentials:
        if credential:
            content = content.replace(credential, b"*" * len(credential))
    for credential in numeric_credentials:
        content = re.sub(
            rb"([\"'])" + re.escape(credential) + rb"\1",
            lambda match: match.group(1) + b"*" * len(credential) + match.group(1),
            content,
        )
        content = re.sub(
            rb"(?i)((?:e2e_)?(?:otp|code|password|token|\xd0\xba\xd0\xbe\xd0\xb4|\xd0\xbf\xd0\xb0\xd1\x80\xd0\xbe\xd0\xbb\xd1\x8c)[^0-9]{0,32})"
            + re.escape(credential)
            + rb"(?![0-9])",
            lambda match: match.group(1) + b"0",
            content,
        )
    return phone_pattern.sub(lambda match: b"*" * len(match.group()), content)

def sanitize_embedded_report(match: re.Match[bytes]) -> bytes:
    source = io.BytesIO(base64.b64decode(match.group(2)))
    target = io.BytesIO()
    with zipfile.ZipFile(source, "r") as archive, zipfile.ZipFile(
        target, "w", zipfile.ZIP_DEFLATED
    ) as sanitized_archive:
        for item in archive.infolist():
            sanitized_archive.writestr(item, redact(archive.read(item.filename)))
    return match.group(1) + base64.b64encode(target.getvalue()) + match.group(3)

for path in root.rglob("*"):
    if not path.is_file() or path.is_symlink():
        continue
    content = path.read_bytes()
    sanitized = report_pattern.sub(sanitize_embedded_report, content)
    sanitized = redact(sanitized)
    if sanitized != content:
        path.write_bytes(sanitized)
PY
}

write_suite_index() {
  [[ -n "$suite_directory" ]] || fail 'suite publication is unavailable'
  printf '<!doctype html><meta charset="utf-8"><title>E2E suite report</title><h1>E2E suite report</h1><p>Revision: %s</p><p><a href="%s">GitHub Actions run</a></p><ul>' \
    "$E2E_REVISION" "$E2E_RUN_URL" > "$suite_directory/index.html"
  [[ -z "$suite_diagnostic" ]] || printf '<p>Diagnostic: %s</p>' "$suite_diagnostic" >> "$suite_directory/index.html"
  local entry case_id status
  for entry in "${report_entries[@]}"; do
    IFS='|' read -r case_id status <<< "$entry"
    printf '<li>%s: %s — <a href="%s/">report</a></li>' "$case_id" "$status" "$case_id" >> "$suite_directory/index.html"
  done
  printf '</ul>' >> "$suite_directory/index.html"
}

prepare_suite_report() {
  ensure_report_host
  suite_directory="$(mktemp -d "$report_root/.incoming.${E2E_RUN_ID}.XXXXXX")"
}

publish_diagnostic() {
  local diagnostic_stage="$1"
  validate_metadata
  prepare_suite_report
  suite_diagnostic="Stage: $diagnostic_stage. Playwright did not run."
  finalize_suite_report
}

finalize_suite_report() {
  [[ -n "$suite_directory" ]] || return 0
  write_suite_index
  sanitize_e2e_report "$suite_directory"
  assert_no_e2e_secret "$suite_directory"
  chmod -R a+rX "$suite_directory"
  ln -s "$(basename -- "$suite_directory")" "$report_root/current.next"
  mv -Tf "$report_root/current.next" "$report_root/current"
  suite_published=1
}

copy_playwright_report() {
  local target_directory="$1"
  local source_directory="$E2E_ARTIFACT_DIRECTORY/report"
  [[ -d "$source_directory" && ! -L "$source_directory" && -f "$source_directory/index.html" ]] || fail 'Playwright report is unavailable'
  if find "$source_directory" -type l -print -quit | grep --quiet .; then
    fail 'Playwright report contains a symbolic link'
  fi
  cp -a -- "$source_directory/." "$target_directory/"
}

copy_playwright_output() {
  local target_directory="$1"
  local output_file="$E2E_ARTIFACT_DIRECTORY/playwright-output.log"
  [[ -f "$output_file" && ! -L "$output_file" ]] || fail 'Playwright output is unavailable'
  cp -- "$output_file" "$target_directory/playwright-output.log"
}

publish_case_report() {
  local case_id="$1" status="$2" diagnostic_stage="$3" publication_directory
  [[ -n "$suite_directory" ]] || fail 'suite publication is unavailable'
  publication_directory="$suite_directory/$case_id"
  install -d -m 700 "$publication_directory"
  if [[ -d "${E2E_ARTIFACT_DIRECTORY:-}/report" && -f "${E2E_ARTIFACT_DIRECTORY:-}/report/index.html" ]]; then
    copy_playwright_report "$publication_directory"
    [[ "$status" == passed ]] || copy_playwright_output "$publication_directory"
  else
    [[ -f "${E2E_ARTIFACT_DIRECTORY:-}/playwright-output.log" ]] && copy_playwright_output "$publication_directory"
    printf '<!doctype html><meta charset="utf-8"><title>E2E diagnostic</title><h1>E2E diagnostic</h1><p>Stage: %s. Playwright report is unavailable.</p>' \
      "$diagnostic_stage" > "$publication_directory/index.html"
  fi
  sanitize_e2e_report "$publication_directory"
  assert_no_e2e_secret "$publication_directory"
  report_entries+=("$case_id|$status")
}

compose() {
  docker compose --project-name "$project" --file "$compose_file" "$@"
}

cleanup_runtime() {
  local cleanup_failed=0
  cleanup_failure=0
  if [[ -n "$project" && -n "$run_directory" && -d "$run_directory" ]]; then
    compose run --rm --no-deps --entrypoint sh e2e -c 'chmod -R a+rwX /artifacts' >/dev/null || cleanup_failed=1
  fi
  if [[ -n "$project" ]]; then
    compose down --volumes --remove-orphans >/dev/null || cleanup_failed=1
    if docker ps --all --quiet --filter "label=com.docker.compose.project=$project" | grep --quiet . ||
      docker network ls --quiet --filter "label=com.docker.compose.project=$project" | grep --quiet . ||
      docker volume ls --quiet --filter "label=com.docker.compose.project=$project" | grep --quiet .; then
      printf '%s\n' 'e2e-runtime: Compose project resources remain after cleanup' >&2
      cleanup_failed=1
    fi
  fi
  if [[ -n "$run_directory" && -d "$run_directory" && ! -L "$run_directory" ]]; then
    rm -rf -- "$run_directory" || cleanup_failed=1
    if [[ -e "$run_directory" ]]; then
      printf '%s\n' 'e2e-runtime: E2E run directory remains after cleanup' >&2
      cleanup_failed=1
    fi
  fi
  cleanup_failure="$cleanup_failed"
  (( cleanup_failed == 0 ))
}

on_exit() {
  local exit_status=$?
  trap - EXIT
  trap '' INT TERM HUP
  if (( suite_published == 0 )) && [[ -n "$suite_directory" ]]; then
    finalize_suite_report >/dev/null 2>&1 || true
  fi
  cleanup_runtime || exit_status=1
  exit "$exit_status"
}

on_signal() {
  exit "$1"
}

wait_for_health() {
  local service="$1" container health
  container="$(compose ps -q "$service" 2>/dev/null)"
  [[ -n "$container" ]] || fail "$service container is unavailable"
  for _ in {1..36}; do
    health="$(docker inspect --format '{{.State.Health.Status}}' "$container" 2>/dev/null)"
    [[ "$health" == healthy ]] && return
    sleep 5
  done
  fail "$service did not become healthy"
}

prepare_runtime_environment() {
  local supplied_vapid_subject="${DELIVERY_VAPID_SUBJECT:-}"
  local supplied_vapid_public_key="${DELIVERY_VAPID_PUBLIC_KEY:-}"
  local supplied_vapid_private_key="${DELIVERY_VAPID_PRIVATE_KEY:-}"
  [[ -f "$runtime_file" && ! -L "$runtime_file" ]] || fail 'development runtime environment is unavailable'
  set -a
  # runtime.env remains on VPS and is never copied into reports or logs.
  # shellcheck disable=SC1090
  source "$runtime_file"
  set +a
  VAPID_SUBJECT="${supplied_vapid_subject:-${DELIVERY_VAPID_SUBJECT:-}}"
  VAPID_PUBLIC_KEY="${supplied_vapid_public_key:-${DELIVERY_VAPID_PUBLIC_KEY:-}}"
  VAPID_PRIVATE_KEY="${supplied_vapid_private_key:-${DELIVERY_VAPID_PRIVATE_KEY:-}}"
  export VAPID_SUBJECT VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY
  [[ "${POSTGRES_PASSWORD:-}" && "${AUTH_ACCESS_TOKEN_SECRET:-}" && "${AUTH_OTP_PEPPER:-}" ]] || fail 'runtime environment lacks backend secrets'
  [[ "$VAPID_SUBJECT" && "$VAPID_PUBLIC_KEY" && "$VAPID_PRIVATE_KEY" ]] || fail 'runtime environment lacks VAPID secrets'
  [[ "${E2E_OTP:-}" =~ ^[0-9]{6}$ ]] || fail 'E2E_OTP must contain six digits'
  [[ "${E2E_ADMIN_PHONE:-}" =~ ^\+7[0-9]{10}$ ]] || fail 'E2E_ADMIN_PHONE is invalid'
  [[ "${E2E_STAFF_PHONE:-}" =~ ^\+7[0-9]{10}$ ]] || fail 'E2E_STAFF_PHONE is invalid'
  [[ "${E2E_CUSTOMER_PHONE:-}" =~ ^\+7[0-9]{10}$ ]] || fail 'E2E_CUSTOMER_PHONE is invalid'
  [[ "${E2E_CUSTOMER_2_PHONE:-}" =~ ^\+7[0-9]{10}$ ]] || fail 'E2E_CUSTOMER_2_PHONE is invalid'
  [[ "$E2E_ADMIN_PHONE" != "$E2E_STAFF_PHONE" && "$E2E_ADMIN_PHONE" != "$E2E_CUSTOMER_PHONE" && "$E2E_ADMIN_PHONE" != "$E2E_CUSTOMER_2_PHONE" && "$E2E_STAFF_PHONE" != "$E2E_CUSTOMER_PHONE" && "$E2E_STAFF_PHONE" != "$E2E_CUSTOMER_2_PHONE" && "$E2E_CUSTOMER_PHONE" != "$E2E_CUSTOMER_2_PHONE" ]] || fail 'E2E role phones must be distinct'
  [[ "${BACKEND_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ ]] || fail 'BACKEND_IMAGE must be immutable'
  [[ "${FRONT_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ ]] || fail 'FRONT_IMAGE must be immutable'
  [[ "${BACK_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ ]] || fail 'BACK_IMAGE must be immutable'
  [[ "${E2E_IMAGE:-}" =~ @sha256:[a-f0-9]{64}$ ]] || fail 'E2E_IMAGE must be immutable'
}

run_suite() {
  local test_title="$1" escaped_test_title
  escaped_test_title="$(printf '%s' "$test_title" | sed 's/[][\\.^$*+?(){}|]/\\&/g')"
  compose run --rm -e E2E_SAFE_REPORT=1 -e PLAYWRIGHT_HTML_OUTPUT_DIR=/artifacts/report e2e npm run e2e -- --grep "${escaped_test_title}$" > "$E2E_ARTIFACT_DIRECTORY/playwright-output.log" 2>&1
}

run_readiness_step() {
  local step="$1"
  shift
  printf 'e2e-runtime: %s readiness: %s started\n' "$E2E_PROFILE" "$step" >&2
  if "$@" >/dev/null 2>&1; then
    printf 'e2e-runtime: %s readiness: %s passed\n' "$E2E_PROFILE" "$step" >&2
    return
  fi
  printf 'e2e-runtime: %s readiness: %s failed\n' "$E2E_PROFILE" "$step" >&2
  return 1
}

seed_catalog_for_scenario() {
  local scenario="$1"
  [[ "$scenario" == no-seed ]] && return
  compose run --rm --no-deps \
    -e BOOTSTRAP_ADMIN_PHONE="$E2E_ADMIN_PHONE" \
    -e E2E_CUSTOMER_PHONE="$E2E_CUSTOMER_PHONE" \
    -e E2E_CUSTOMER_2_PHONE="$E2E_CUSTOMER_2_PHONE" \
    -e E2E_STAFF_PHONE="$E2E_STAFF_PHONE" \
    -e E2E_SEED_SCENARIO="$scenario" \
    backend dist/scripts/seed.js
}

run_case() {
  local case_id="$1" profile="$2" scenario="$3" test_title="$4" case_number="$5"
  project="expressa-e2e-$E2E_RUN_ID-$case_number"
  [[ "$project" =~ ^expressa-e2e-[1-9][0-9]*-[1-9][0-9]*$ ]] || fail 'compose project is invalid'
  E2E_PROFILE="$profile"
  export E2E_PROFILE
  install -d -m 700 "$work_root"
  run_directory="$(mktemp -d "$work_root/$E2E_RUN_ID.$case_number.XXXXXX")"
  export E2E_ARTIFACT_DIRECTORY="$run_directory/artifacts"
  install -d -m 700 "$E2E_ARTIFACT_DIRECTORY"

  # A re-run cleans only the exact GitHub-run/test project left by an interrupted attempt.
  compose down --volumes --remove-orphans >/dev/null
  if docker ps --all --quiet --filter "label=com.docker.compose.project=$project" | grep --quiet . ||
    docker network ls --quiet --filter "label=com.docker.compose.project=$project" | grep --quiet . ||
    docker volume ls --quiet --filter "label=com.docker.compose.project=$project" | grep --quiet .; then
    fail 'Compose project resources remain before test startup'
  fi

  stage="$case_id-readiness"
  if ! run_readiness_step 'compose configuration' compose config -q ||
    ! run_readiness_step 'image pull' compose pull ||
    ! run_readiness_step 'PostgreSQL startup' compose up -d postgres ||
    ! run_readiness_step 'PostgreSQL health' wait_for_health postgres ||
    ! run_readiness_step 'database migration' compose run --rm --no-deps backend dist/scripts/migrate.js ||
    ! run_readiness_step 'administrator provisioning' compose run --rm --no-deps backend dist/scripts/staff.js upsert --phone "$E2E_ADMIN_PHONE" --role administrator ||
    ! run_readiness_step 'scenario seeding' seed_catalog_for_scenario "$scenario" ||
    ! run_readiness_step 'barista provisioning' compose run --rm --no-deps backend dist/scripts/staff.js upsert --phone "$E2E_STAFF_PHONE" --role barista ||
    ! run_readiness_step 'application startup' compose up -d backend front back gateway ||
    ! run_readiness_step 'backend health' wait_for_health backend ||
    ! run_readiness_step 'front-office health' wait_for_health front ||
    ! run_readiness_step 'back-office health' wait_for_health back ||
    ! run_readiness_step 'gateway health' wait_for_health gateway; then
    publish_case_report "$case_id" failed "$stage"
    cleanup_runtime || return 1
    project=''
    run_directory=''
    unset E2E_ARTIFACT_DIRECTORY E2E_PROFILE
    return 1
  fi

  stage="$case_id-playwright"
  if ! run_suite "$test_title"; then
    publish_case_report "$case_id" failed "$stage"
    cleanup_runtime || return 1
    project=''
    run_directory=''
    unset E2E_ARTIFACT_DIRECTORY E2E_PROFILE
    return 1
  fi

  publish_case_report "$case_id" passed "$stage"
  if ! cleanup_runtime; then
    return 1
  fi
  project=''
  run_directory=''
  unset E2E_ARTIFACT_DIRECTORY E2E_PROFILE
}

test_cases=(
  'AUTH-01|empty|customer-new|AUTH-01: новый клиент входит по номеру телефона'
  'AUTH-02|seeded|customer-existing|AUTH-02 — Зарегистрированный клиент повторно входит по номеру телефона'
  'AUTH-03|seeded|canonical|AUTH-03 — Клиент не запрашивает код для неполного номера'
  'AUTH-04|seeded|customer-new|AUTH-04 — Клиент видит результат пяти неверных одноразовых кодов'
  'AUTH-06|seeded|customer-new|AUTH-06 — Клиент видит ограничение повторной отправки кода'
  'AUTH-07|seeded|customer-new|AUTH-07 — Клиент восстанавливает и завершает сессию'
  'AUTH-08-barista|seeded|canonical|AUTH-08 — Бариста входит в рабочие разделы back-office'
  'AUTH-08-administrator|seeded|canonical|AUTH-08 — Администратор входит в рабочие разделы back-office'
  'AUTH-09|seeded|customer-existing|AUTH-09 — Клиент получает отказ во входе в back-office'
  'MENU-01|seeded|canonical|MENU-01: покупатель видит опубликованное меню'
  'MENU-02|empty|no-seed|MENU-02: покупатель видит пустое публичное меню'
  'MENU-03|mutating|intake-closed|MENU-03: customer видит меню при закрытом приёме заказов'
  'MENU-04|seeded|canonical|MENU-04: покупатель открывает категорию и товар'
  'MENU-05|seeded|canonical|MENU-05: покупатель видит конфигурацию напитка по умолчанию'
  'MENU-06|mutating|canonical|MENU-06: покупатель не может открыть недоступный товар'
  'MENU-07|mutating|canonical|MENU-07: покупатель не видит неактивный товар'
  'CART-01|seeded|canonical|CART-01: customer добавляет товар в корзину'
  'CART-02|seeded|canonical|CART-02: customer объединяет одинаковые конфигурации'
  'CART-03|seeded|canonical|CART-03: customer видит раздельные конфигурации'
  'CART-04|seeded|canonical|CART-04: customer изменяет количество и итог'
  'CART-05|seeded|canonical|CART-05: customer удаляет позиции и очищает корзину'
  'CART-06|seeded|customer-new|CART-06: customer сохраняет корзину после перезагрузки и входа'
  'CART-07|mutating|canonical|CART-07: customer устраняет недоступную позицию'
  'CHECKOUT-01|mutating|customer-existing|CHECKOUT-01: авторизованный customer оформляет заказ'
  'CHECKOUT-02|mutating|customer-new|CHECKOUT-02: гость возвращается к оформлению после OTP'
  'CHECKOUT-03|mutating|canonical|CHECKOUT-03: customer подтверждает актуальную цену'
  'CHECKOUT-04|mutating|canonical|CHECKOUT-04: customer отменяет оформление после изменения цены'
  'CHECKOUT-05|mutating|canonical|CHECKOUT-05: customer не оформляет корзину с недоступной позицией'
  'CHECKOUT-06|mutating|canonical|CHECKOUT-06: customer видит закрытый приём заказов'
  'CHECKOUT-07|mutating|canonical|CHECKOUT-07: customer не получает второй заказ при повторном оформлении'
  'ORDER-01|mutating|order-snapshot|ORDER-01: customer видит снимок созданного заказа'
  'ORDER-02|mutating|customer-history|ORDER-02: customer не открывает чужой заказ'
  'ORDER-03|mutating|order-created|ORDER-03: customer видит текущий заказ'
  'ORDER-04|mutating|customer-history|ORDER-04: customer загружает следующую часть истории заказов'
  'ORDER-05|mutating|customer-history|ORDER-05: история customer изолирована от заказов другого customer'
  'ORDER-06|mutating|order-issued|ORDER-06: customer повторяет полностью доступный выданный заказ'
  'ORDER-07|mutating|order-repeat-partial|ORDER-07: customer повторяет доступную часть выданного заказа'
  'ORDER-08|mutating|order-repeat-unavailable|ORDER-08: customer не повторяет полностью недоступный выданный заказ'
  'QUEUE-01|empty|no-seed|QUEUE-01: сотрудник видит пустую очередь заказов'
  'QUEUE-02|mutating|queue-populated|QUEUE-02: сотрудник видит заполненную очередь заказов'
  'QUEUE-03|mutating|queue-populated|QUEUE-03: сотрудник фильтрует очередь по стадии'
  'QUEUE-04|mutating|queue-populated|QUEUE-04: сотрудник ищет заказ по номеру'
  'QUEUE-05|mutating|queue-populated|QUEUE-05: сотрудник открывает детали заказа'
  'QUEUE-06|mutating|queue-populated|QUEUE-06: очередь автоматически показывает новый заказ'
  'QUEUE-07|mutating|order-created|QUEUE-07: сотрудник проводит заказ по разрешённым стадиям'
  'AVAIL-01|mutating|canonical|AVAIL-01: сотрудник видит список позиций'
  'AVAIL-02|mutating|canonical|AVAIL-02: сотрудник ищет позицию'
  'AVAIL-03|mutating|canonical|AVAIL-03: сотрудник выключает товар'
  'AVAIL-04|mutating|product-unavailable|AVAIL-04: сотрудник включает товар'
  'AVAIL-05|mutating|canonical|AVAIL-05: сотрудник закрывает приём новых заказов'
  'AVAIL-06|mutating|canonical|AVAIL-06: сотрудник видит метаданные изменения приёма заказов'
  'AVAIL-07|mutating|canonical|AVAIL-07: сотрудник выключает размер напитка'
  'AVAIL-08|mutating|size-unavailable|AVAIL-08: сотрудник включает размер напитка'
  'AVAIL-09|mutating|canonical|AVAIL-09: сотрудник выключает добавку'
  'AVAIL-10|mutating|modifier-unavailable|AVAIL-10: сотрудник включает добавку'
  'AVAIL-11|mutating|intake-closed|AVAIL-11: сотрудник возобновляет приём новых заказов'
  'AVAIL-12|empty|no-seed|AVAIL-12: сотрудник видит пустое состояние доступности'
  'AVAIL-13|mutating|canonical|AVAIL-13: сотрудник фильтрует позиции по категории'
  'CATALOG-01|empty|no-seed|CATALOG-01: администратор видит пустой каталог'
  'CATALOG-02|mutating|canonical|CATALOG-02: администратор создаёт активную категорию'
  'CATALOG-03|mutating|canonical|CATALOG-03: администратор видит валидацию категории'
  'CATALOG-04|mutating|catalog-mutation|CATALOG-04: администратор редактирует категорию'
  'CATALOG-05|mutating|catalog-mutation|CATALOG-05: администратор меняет порядок категорий'
  'CATALOG-06|mutating|catalog-mutation|CATALOG-06: администратор архивирует категорию'
  'CATALOG-07|mutating|canonical|CATALOG-07: администратор создаёт напиток с размерами'
  'CATALOG-08|mutating|canonical|CATALOG-08: администратор создаёт товар без размеров'
  'CATALOG-09|mutating|canonical|CATALOG-09: администратор видит валидацию цены напитка'
  'CATALOG-10|mutating|catalog-mutation|CATALOG-10: администратор редактирует товар'
  'CATALOG-11|mutating|catalog-mutation|CATALOG-11: администратор меняет порядок товаров'
  'CATALOG-12|mutating|catalog-mutation|CATALOG-12: администратор архивирует товар'
  'CATALOG-13|mutating|canonical|CATALOG-13: администратор создаёт группу добавок с вариантом по умолчанию'
  'CATALOG-14|mutating|catalog-mutation|CATALOG-14: администратор меняет порядок вариантов добавок'
  'CATALOG-15|mutating|catalog-mutation|CATALOG-15: администратор назначает группе добавок категорию'
  'JOURNEY-01|mutating|canonical|JOURNEY-01: администратор публикует напиток'
  'JOURNEY-02|mutating|customer-new|JOURNEY-02: клиент оформляет заказ через одноразовый код'
  'JOURNEY-03|mutating|customer-new|JOURNEY-03: сотрудник выдаёт готовый заказ'
  'JOURNEY-04|mutating|customer-new|JOURNEY-04: клиент открывает выданный заказ в истории'
  'JOURNEY-05|mutating|customer-new|JOURNEY-05: публикация, заказ, выдача и история'
)

validate_test_cases() {
  local index other_index record case_id profile scenario test_title other_record other_case_id other_test_title
  for (( index = 0; index < ${#test_cases[@]}; index += 1 )); do
    record="${test_cases[index]}"
    IFS='|' read -r case_id profile scenario test_title <<< "$record"
    [[ "$case_id" =~ ^[A-Z]+-[0-9]+(-[a-z]+)?$ && -n "$test_title" ]] || fail 'E2E test mapping is invalid'
    case "$profile" in empty|seeded|mutating) ;; *) fail 'E2E test mapping profile is invalid' ;; esac
    case "$scenario" in
      no-seed|canonical|customer-new|customer-existing|intake-closed|modifier-unavailable|product-unavailable|size-unavailable|catalog-mutation|order-created|order-accepted|order-preparing|order-ready|order-issued|order-snapshot|order-repeat-unavailable|order-repeat-partial|customer-history|queue-populated) ;;
      *) fail 'E2E test mapping seed scenario is invalid' ;;
    esac
    for (( other_index = index + 1; other_index < ${#test_cases[@]}; other_index += 1 )); do
      other_record="${test_cases[other_index]}"
      IFS='|' read -r other_case_id _ _ other_test_title <<< "$other_record"
      [[ "$case_id" != "$other_case_id" ]] || fail 'E2E test mapping contains a duplicate test id'
      [[ "$test_title" != "$other_test_title" ]] || fail 'E2E test mapping contains a duplicate test title'
    done
  done
}

run() {
  validate_metadata
  prepare_runtime_environment
  prepare_suite_report
  validate_test_cases
  local record case_id profile scenario test_title case_number=0 suite_failed=0
  for record in "${test_cases[@]}"; do
    IFS='|' read -r case_id profile scenario test_title <<< "$record"
    (( case_number += 1 ))
    if ! run_case "$case_id" "$profile" "$scenario" "$test_title" "$case_number"; then
      suite_failed=1
      if (( cleanup_failure != 0 )); then
        suite_diagnostic="Test: $case_id. Stage: $stage. Cleanup failed; suite stopped."
        finalize_suite_report
        return 1
      fi
    fi
  done
  finalize_suite_report
  (( suite_failed == 0 ))
}

[[ "$#" -ge 1 ]] || usage
case "$1" in
  setup-report-host)
    [[ "$#" == 1 ]] || usage
    ensure_report_host
    ;;
  run)
    [[ "$#" == 1 ]] || usage
    trap on_exit EXIT
    trap 'on_signal 130' INT
    trap 'on_signal 143' TERM
    trap 'on_signal 129' HUP
    run
    ;;
  diagnostic)
    [[ "$#" == 2 ]] || usage
    case "$2" in build|deploy|readiness) ;; *) usage ;; esac
    validate_metadata
    publish_diagnostic "$2"
    ;;
  self-test-allowlist)
    [[ "$#" == 1 ]] || usage
    self_test_allowlist
    ;;
  *) usage ;;
esac
