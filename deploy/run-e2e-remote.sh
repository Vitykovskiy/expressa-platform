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
report_published=0
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
  for secret in "${E2E_ADMIN_PHONE:-}" "${E2E_STAFF_PHONE:-}" "${E2E_CUSTOMER_PHONE:-}" "${E2E_CUSTOMER_2_PHONE:-}" "${E2E_OTP:-}" "${POSTGRES_PASSWORD:-}" "${AUTH_ACCESS_TOKEN_SECRET:-}" "${AUTH_OTP_PEPPER:-}" "${DELIVERY_VAPID_SUBJECT:-}" "${DELIVERY_VAPID_PUBLIC_KEY:-}" "${DELIVERY_VAPID_PRIVATE_KEY:-}" "${VAPID_SUBJECT:-}" "${VAPID_PUBLIC_KEY:-}" "${VAPID_PRIVATE_KEY:-}"; do
    [[ -n "$secret" ]] || continue
    if grep --recursive --fixed-strings --quiet -- "$secret" "$publication_directory"; then
      fail 'E2E credential was found in report publication'
    fi
  done
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
report_pattern = re.compile(
    rb'(<template id="playwrightReportBase64">data:application/zip;base64,)(.*?)(</template>)',
    re.DOTALL,
)
phone_pattern = re.compile(rb"\+7(?:\d{10}| \d{3} \d{3}-\d{2}-\d{2})")

def redact(content: bytes) -> bytes:
    for credential in credentials:
        if credential:
            content = content.replace(credential, b"*" * len(credential))
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

publish_directory() {
  local title="$1" details="$2" publication_directory
  ensure_report_host
  publication_directory="$(mktemp -d "$report_root/.incoming.${E2E_RUN_ID}.XXXXXX")"
  printf '<!doctype html><meta charset="utf-8"><title>%s</title><h1>%s</h1><p>%s</p><p>Revision: %s</p><p><a href="%s">GitHub Actions run</a></p>' \
    "$title" "$title" "$details" "$E2E_REVISION" "$E2E_RUN_URL" > "$publication_directory/index.html"
  assert_no_e2e_secret "$publication_directory"
  chmod -R a+rX "$publication_directory"
  ln -s "$(basename -- "$publication_directory")" "$report_root/current.next"
  mv -Tf "$report_root/current.next" "$report_root/current"
  report_published=1
}

publish_diagnostic() {
  local diagnostic_stage="$1"
  validate_metadata
  publish_directory 'E2E deployment diagnostic' "Stage: $diagnostic_stage. Playwright did not produce a report."
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

append_temporary_catalog_diagnostic() {
  local output_file="$E2E_ARTIFACT_DIRECTORY/playwright-output.log"
  [[ -f "$output_file" && ! -L "$output_file" ]] || return

  if ! {
    printf '\nTEMPORARY E2E catalog diagnostic: profile=%s\n' "$E2E_PROFILE"
    compose exec -T postgres psql --quiet --tuples-only --no-align --field-separator='|' \
      --set=ON_ERROR_STOP=on --username=expressa --dbname=expressa <<'SQL'
WITH catalog_diagnostic AS (
  SELECT
    'category'::text AS entity,
    c.id::text AS id,
    NULL::text AS foreign_id,
    NULL::text AS type,
    NULL::integer AS price_minor,
    c.is_active,
    NULL::boolean AS is_available,
    c.archived_at IS NULL AS archived_at_is_null,
    NULL::boolean AS variants_configured
  FROM categories c
  WHERE c.name LIKE 'E2E %'

  UNION ALL

  SELECT
    'product'::text,
    p.id::text,
    p.category_id::text,
    p.type::text,
    p.price_minor,
    p.is_active,
    p.is_available,
    p.archived_at IS NULL,
    EXISTS (
      SELECT 1
      FROM product_variants pv
      WHERE pv.product_id = p.id AND pv.archived_at IS NULL
    )
  FROM products p
  WHERE p.name LIKE 'E2E %'

  UNION ALL

  SELECT
    'product_variant'::text,
    pv.id::text,
    pv.product_id::text,
    pv.product_type::text,
    pv.price_minor,
    NULL::boolean,
    pv.is_available,
    pv.archived_at IS NULL,
    NULL::boolean
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE p.name LIKE 'E2E %'

  UNION ALL

  SELECT
    'modifier_group'::text,
    mg.id::text,
    NULL::text,
    mg.selection_type::text,
    NULL::integer,
    mg.is_active,
    NULL::boolean,
    mg.archived_at IS NULL,
    NULL::boolean
  FROM modifier_groups mg
  WHERE mg.name LIKE 'E2E %'

  UNION ALL

  SELECT
    'category_modifier_group'::text,
    cmg.category_id::text,
    cmg.group_id::text,
    NULL::text,
    NULL::integer,
    NULL::boolean,
    NULL::boolean,
    NULL::boolean,
    NULL::boolean
  FROM category_modifier_groups cmg
  JOIN categories c ON c.id = cmg.category_id
  JOIN modifier_groups mg ON mg.id = cmg.group_id
  WHERE c.name LIKE 'E2E %' AND mg.name LIKE 'E2E %'
)
SELECT
  entity,
  id,
  foreign_id,
  type,
  price_minor,
  is_active,
  is_available,
  archived_at_is_null,
  variants_configured
FROM catalog_diagnostic
ORDER BY entity, id
LIMIT 100;
SQL
  }; then
    printf 'TEMPORARY E2E catalog diagnostic: unavailable\n'
  fi >> "$output_file" 2>/dev/null
}

publish_suite_report() {
  local include_playwright_output="${1:-0}" publication_directory
  ensure_report_host
  publication_directory="$(mktemp -d "$report_root/.incoming.${E2E_RUN_ID}.XXXXXX")"
  copy_playwright_report "$publication_directory"
  [[ "$include_playwright_output" == 0 ]] || copy_playwright_output "$publication_directory"
  sanitize_e2e_report "$publication_directory"
  assert_no_e2e_secret "$publication_directory"
  chmod -R a+rX "$publication_directory"
  ln -s "$(basename -- "$publication_directory")" "$report_root/current.next"
  mv -Tf "$report_root/current.next" "$report_root/current"
  report_published=1
}

publish_playwright_diagnostic() {
  local diagnostic_stage="$1" publication_directory
  ensure_report_host
  publication_directory="$(mktemp -d "$report_root/.incoming.${E2E_RUN_ID}.XXXXXX")"
  copy_playwright_output "$publication_directory"
  printf '<!doctype html><meta charset="utf-8"><title>Playwright diagnostic</title><h1>Playwright diagnostic</h1><p>Stage: %s. Playwright did not produce a report.</p><p><a href="playwright-output.log">Playwright output</a></p>' \
    "$diagnostic_stage" > "$publication_directory/index.html"
  sanitize_e2e_report "$publication_directory"
  assert_no_e2e_secret "$publication_directory"
  chmod -R a+rX "$publication_directory"
  ln -s "$(basename -- "$publication_directory")" "$report_root/current.next"
  mv -Tf "$report_root/current.next" "$report_root/current"
  report_published=1
}

compose() {
  docker compose --project-name "$project" --file "$compose_file" "$@"
}

cleanup_runtime() {
  if [[ -n "$project" && -n "$run_directory" && -d "$run_directory" ]]; then
    compose run --rm --no-deps --entrypoint sh e2e -c 'chmod -R a+rwX /artifacts' >/dev/null 2>&1 || true
  fi
  if [[ -n "$project" ]]; then
    compose down --volumes --remove-orphans >/dev/null 2>&1 || true
  fi
  if [[ -n "$run_directory" && -d "$run_directory" && ! -L "$run_directory" ]]; then
    rm -rf -- "$run_directory"
  fi
}

on_exit() {
  local exit_status=$?
  if (( exit_status != 0 )) && (( report_published == 0 )); then
    publish_diagnostic "$stage" >/dev/null 2>&1 || true
  fi
  cleanup_runtime
  exit "$exit_status"
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
  compose run --rm -e E2E_SAFE_REPORT=1 -e PLAYWRIGHT_HTML_OUTPUT_DIR=/artifacts/report e2e npm run e2e > "$E2E_ARTIFACT_DIRECTORY/playwright-output.log" 2>&1
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

seed_catalog_if_needed() {
  [[ "$E2E_PROFILE" == empty ]] || compose run --rm --no-deps -e BOOTSTRAP_ADMIN_PHONE="$E2E_ADMIN_PHONE" backend dist/scripts/seed.js
}

provision_customer_if_needed() {
  [[ "$E2E_PROFILE" == empty ]] || compose run --rm --no-deps backend dist/scripts/staff.js upsert --phone "$E2E_CUSTOMER_PHONE" --role customer
}

run_profile() {
  local profile="$1"
  project="expressa-e2e-$E2E_RUN_ID-$profile"
  [[ "$project" =~ ^expressa-e2e-[1-9][0-9]*-(empty|seeded|mutating)$ ]] || fail 'compose project is invalid'
  E2E_PROFILE="$profile"
  export E2E_PROFILE

  # A re-run cleans only the exact GitHub-run/profile project left by an interrupted attempt.
  compose down --volumes --remove-orphans >/dev/null 2>&1 || true
  install -d -m 700 "$work_root"
  run_directory="$(mktemp -d "$work_root/$E2E_RUN_ID.$profile.XXXXXX")"
  export E2E_ARTIFACT_DIRECTORY="$run_directory/artifacts"
  install -d -m 700 "$E2E_ARTIFACT_DIRECTORY"

  stage="$profile-readiness"
  if ! run_readiness_step 'compose configuration' compose config -q ||
    ! run_readiness_step 'image pull' compose pull ||
    ! run_readiness_step 'PostgreSQL startup' compose up -d postgres ||
    ! run_readiness_step 'PostgreSQL health' wait_for_health postgres ||
    ! run_readiness_step 'database migration' compose run --rm --no-deps backend dist/scripts/migrate.js ||
    ! run_readiness_step 'customer provisioning' provision_customer_if_needed ||
    ! run_readiness_step 'administrator provisioning' compose run --rm --no-deps backend dist/scripts/staff.js upsert --phone "$E2E_ADMIN_PHONE" --role administrator ||
    ! run_readiness_step 'catalog seeding' seed_catalog_if_needed ||
    ! run_readiness_step 'barista provisioning' compose run --rm --no-deps backend dist/scripts/staff.js upsert --phone "$E2E_STAFF_PHONE" --role barista ||
    ! run_readiness_step 'application startup' compose up -d backend front back gateway ||
    ! run_readiness_step 'backend health' wait_for_health backend ||
    ! run_readiness_step 'front-office health' wait_for_health front ||
    ! run_readiness_step 'back-office health' wait_for_health back ||
    ! run_readiness_step 'gateway health' wait_for_health gateway; then
    publish_diagnostic "$stage" || true
    cleanup_runtime
    project=''
    run_directory=''
    unset E2E_ARTIFACT_DIRECTORY E2E_PROFILE
    return 1
  fi

  stage="$profile-playwright"
  if ! run_suite; then
    append_temporary_catalog_diagnostic
    publish_suite_report 1 || publish_playwright_diagnostic "$stage" || publish_diagnostic "$stage" || true
    cleanup_runtime
    project=''
    run_directory=''
    unset E2E_ARTIFACT_DIRECTORY E2E_PROFILE
    return 1
  fi

  publish_suite_report
  cleanup_runtime
  project=''
  run_directory=''
  unset E2E_ARTIFACT_DIRECTORY E2E_PROFILE
}

run() {
  validate_metadata
  prepare_runtime_environment
  ensure_report_host
  local profile
  for profile in empty seeded mutating; do
    run_profile "$profile" || return 1
  done
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
