#!/usr/bin/env bash
set -Eeuo pipefail

[[ "$#" == 2 ]] || { printf '%s\n' 'Usage: run-remote.sh development|staging image-env-file' >&2; exit 64; }
environment="$1"; image_file="$2"
case "$environment" in development|staging) ;; *) exit 64 ;; esac
[[ -f "$image_file" ]] || exit 64
temporary_directory="$(mktemp -d)"
cleanup() { rm -rf -- "$temporary_directory"; }
trap cleanup EXIT
printf '%s\n' "$DEPLOY_SSH_PRIVATE_KEY" > "$temporary_directory/key"
printf '%s\n' "$DEPLOY_SSH_KNOWN_HOSTS" > "$temporary_directory/known_hosts"
chmod 600 "$temporary_directory/key" "$temporary_directory/known_hosts"
ssh_options=(-i "$temporary_directory/key" -o UserKnownHostsFile="$temporary_directory/known_hosts" -o StrictHostKeyChecking=yes -o BatchMode=yes -p "$DEPLOY_PORT")
remote_directory="$(ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" 'mktemp -d /tmp/expressa-deploy.XXXXXX')"
trap 'ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "rm -rf -- $(printf %q "$remote_directory")" >/dev/null 2>&1 || true; cleanup' EXIT
scp -P "$DEPLOY_PORT" -i "$temporary_directory/key" -o UserKnownHostsFile="$temporary_directory/known_hosts" -o StrictHostKeyChecking=yes -o BatchMode=yes deploy/deploy.sh deploy/compose.yml deploy/smoke-staging.mjs "$image_file" "$DEPLOY_USER@$DEPLOY_HOST:$remote_directory/"
if [[ "$environment" == staging ]]; then
  [[ "${BOOTSTRAP_ADMIN_PHONE:-}" && "${AUTH_ACCESS_TOKEN_SECRET:-}" && "${AUTH_OTP_PEPPER:-}" && "${CORS_ORIGINS:-}" ]] || exit 64
  printf '%s\0%s\0%s\0%s\0' "$BOOTSTRAP_ADMIN_PHONE" "$AUTH_ACCESS_TOKEN_SECRET" "$AUTH_OTP_PEPPER" "$CORS_ORIGINS" |
    ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "set -Eeuo pipefail; IFS= read -r -d '' BOOTSTRAP_ADMIN_PHONE; IFS= read -r -d '' STAGING_AUTH_ACCESS_TOKEN_SECRET; IFS= read -r -d '' STAGING_AUTH_OTP_PEPPER; IFS= read -r -d '' STAGING_CORS_ORIGINS; source $(printf %q "$remote_directory/$(basename "$image_file")"); export BACKEND_IMAGE FRONT_IMAGE BACK_IMAGE BOOTSTRAP_ADMIN_PHONE STAGING_AUTH_ACCESS_TOKEN_SECRET STAGING_AUTH_OTP_PEPPER STAGING_CORS_ORIGINS; DEPLOY_ROOT=/srv/expressa bash $(printf %q "$remote_directory/deploy.sh") --environment $(printf %q "$environment") deploy all"
else
  printf '%s\n' "${BOOTSTRAP_ADMIN_PHONE:-}" | ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "set -Eeuo pipefail; read -r BOOTSTRAP_ADMIN_PHONE; source $(printf %q "$remote_directory/$(basename "$image_file")"); export BACKEND_IMAGE FRONT_IMAGE BACK_IMAGE BOOTSTRAP_ADMIN_PHONE; DEPLOY_ROOT=/srv/expressa bash $(printf %q "$remote_directory/deploy.sh") --environment $(printf %q "$environment") deploy all"
fi
