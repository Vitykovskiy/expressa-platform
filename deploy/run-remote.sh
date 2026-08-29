#!/usr/bin/env bash
set -Eeuo pipefail

[[ "$#" == 2 ]] || { printf '%s\n' 'Usage: run-remote.sh development|staging|production image-env-file' >&2; exit 64; }
environment="$1"; image_file="$2"
case "$environment" in development|staging|production) ;; *) exit 64 ;; esac
[[ -f "$image_file" ]] || exit 64
backup_retention_days=7
[[ "${VAPID_SUBJECT:-}" && "${VAPID_PUBLIC_KEY:-}" && "${VAPID_PRIVATE_KEY:-}" ]] || exit 64
[[ "${BACKUP_ENCRYPTION_KEY:-}" && "${BACKUP_INTEGRITY_KEY:-}" && "$backup_retention_days" =~ ^[1-9][0-9]*$ && "$backup_retention_days" == 7 ]] || exit 64
temporary_directory="$(mktemp -d)"
cleanup() { rm -rf -- "$temporary_directory"; }
trap cleanup EXIT
printf '%s\n' "$DEPLOY_SSH_PRIVATE_KEY" > "$temporary_directory/key"
printf '%s\n' "$DEPLOY_SSH_KNOWN_HOSTS" > "$temporary_directory/known_hosts"
chmod 600 "$temporary_directory/key" "$temporary_directory/known_hosts"
ssh_options=(-i "$temporary_directory/key" -o UserKnownHostsFile="$temporary_directory/known_hosts" -o StrictHostKeyChecking=yes -o BatchMode=yes -p "$DEPLOY_PORT")
remote_directory="$(ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" 'mktemp -d /tmp/expressa-deploy.XXXXXX')"
trap 'ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "rm -rf -- $(printf %q "$remote_directory")" >/dev/null 2>&1 || true; cleanup' EXIT
scp -P "$DEPLOY_PORT" -i "$temporary_directory/key" -o UserKnownHostsFile="$temporary_directory/known_hosts" -o StrictHostKeyChecking=yes -o BatchMode=yes deploy/deploy.sh deploy/backup.sh deploy/restore-verify.sh deploy/compose.yml deploy/smoke-staging.mjs deploy/smoke-production.mjs "$image_file" "$DEPLOY_USER@$DEPLOY_HOST:$remote_directory/"
if [[ "$environment" == staging ]]; then
  [[ "${BOOTSTRAP_ADMIN_PHONE:-}" && "${AUTH_ACCESS_TOKEN_SECRET:-}" && "${AUTH_OTP_PEPPER:-}" && "${CORS_ORIGINS:-}" ]] || exit 64
elif [[ "$environment" == development ]]; then
  [[ "${BOOTSTRAP_ADMIN_PHONE:-}" && "${AUTH_DEVELOPMENT_OTP:-}" ]] || exit 64
fi
printf '%s\0%s\0%s\0%s\0%s\0%s\0%s\0%s\0%s\0%s\0%s\0' \
  "${BOOTSTRAP_ADMIN_PHONE:-}" "${AUTH_ACCESS_TOKEN_SECRET:-}" "${AUTH_OTP_PEPPER:-}" "${CORS_ORIGINS:-}" "${AUTH_DEVELOPMENT_OTP:-}" \
  "$VAPID_SUBJECT" "$VAPID_PUBLIC_KEY" "$VAPID_PRIVATE_KEY" "$BACKUP_ENCRYPTION_KEY" "$BACKUP_INTEGRITY_KEY" "$environment" |
  ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "set -Eeuo pipefail; IFS= read -r -d '' DELIVERY_BOOTSTRAP_PHONE; IFS= read -r -d '' DELIVERY_STAGING_ACCESS_TOKEN_SECRET; IFS= read -r -d '' DELIVERY_STAGING_OTP_PEPPER; IFS= read -r -d '' DELIVERY_STAGING_CORS_ORIGINS; IFS= read -r -d '' DELIVERY_DEVELOPMENT_OTP; IFS= read -r -d '' DELIVERY_VAPID_SUBJECT; IFS= read -r -d '' DELIVERY_VAPID_PUBLIC_KEY; IFS= read -r -d '' DELIVERY_VAPID_PRIVATE_KEY; IFS= read -r -d '' DELIVERY_BACKUP_ENCRYPTION_KEY; IFS= read -r -d '' DELIVERY_BACKUP_INTEGRITY_KEY; IFS= read -r -d '' DELIVERY_ENVIRONMENT; umask 077; BACKUP_ENCRYPTION_KEY_FILE=$(printf %q "$remote_directory/backup-encryption.key"); BACKUP_INTEGRITY_KEY_FILE=$(printf %q "$remote_directory/backup-integrity.key"); printf '%s' \"\$DELIVERY_BACKUP_ENCRYPTION_KEY\" > \"\$BACKUP_ENCRYPTION_KEY_FILE\"; printf '%s' \"\$DELIVERY_BACKUP_INTEGRITY_KEY\" > \"\$BACKUP_INTEGRITY_KEY_FILE\"; chmod 600 \"\$BACKUP_ENCRYPTION_KEY_FILE\" \"\$BACKUP_INTEGRITY_KEY_FILE\"; [[ -f \"\$BACKUP_ENCRYPTION_KEY_FILE\" && ! -L \"\$BACKUP_ENCRYPTION_KEY_FILE\" && -O \"\$BACKUP_ENCRYPTION_KEY_FILE\" && \"\$(stat --format='%a' -- \"\$BACKUP_ENCRYPTION_KEY_FILE\")\" == 600 ]] && [[ -f \"\$BACKUP_INTEGRITY_KEY_FILE\" && ! -L \"\$BACKUP_INTEGRITY_KEY_FILE\" && -O \"\$BACKUP_INTEGRITY_KEY_FILE\" && \"\$(stat --format='%a' -- \"\$BACKUP_INTEGRITY_KEY_FILE\")\" == 600 ]] || exit 1; unset DELIVERY_BACKUP_ENCRYPTION_KEY DELIVERY_BACKUP_INTEGRITY_KEY; case \"\$DELIVERY_ENVIRONMENT\" in development) DELIVERY_BOOTSTRAP_ADMIN_PHONE=\"\$DELIVERY_BOOTSTRAP_PHONE\"; DELIVERY_AUTH_DEVELOPMENT_OTP=\"\$DELIVERY_DEVELOPMENT_OTP\"; export DELIVERY_BOOTSTRAP_ADMIN_PHONE DELIVERY_AUTH_DEVELOPMENT_OTP ;; staging) BOOTSTRAP_ADMIN_PHONE=\"\$DELIVERY_BOOTSTRAP_PHONE\"; STAGING_AUTH_ACCESS_TOKEN_SECRET=\"\$DELIVERY_STAGING_ACCESS_TOKEN_SECRET\"; STAGING_AUTH_OTP_PEPPER=\"\$DELIVERY_STAGING_OTP_PEPPER\"; STAGING_CORS_ORIGINS=\"\$DELIVERY_STAGING_CORS_ORIGINS\"; export BOOTSTRAP_ADMIN_PHONE STAGING_AUTH_ACCESS_TOKEN_SECRET STAGING_AUTH_OTP_PEPPER STAGING_CORS_ORIGINS ;; production) ;; *) exit 64 ;; esac; source $(printf %q "$remote_directory/$(basename "$image_file")"); BACKUP_RETENTION_DAYS=$(printf %q "$backup_retention_days"); export BACKEND_IMAGE FRONT_IMAGE BACK_IMAGE DELIVERY_VAPID_SUBJECT DELIVERY_VAPID_PUBLIC_KEY DELIVERY_VAPID_PRIVATE_KEY BACKUP_ENCRYPTION_KEY_FILE BACKUP_INTEGRITY_KEY_FILE BACKUP_RETENTION_DAYS; DEPLOY_ROOT=/srv/expressa bash $(printf %q "$remote_directory/deploy.sh") --environment \"\$DELIVERY_ENVIRONMENT\" deploy all"
