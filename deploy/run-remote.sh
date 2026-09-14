#!/usr/bin/env bash
set -Eeuo pipefail

[[ "$#" == 2 && "$1" == development ]] || { printf '%s\n' 'Usage: run-remote.sh development image-env-file' >&2; exit 64; }
image_file="$2"
[[ -f "$image_file" && "${VAPID_SUBJECT:-}" && "${VAPID_PUBLIC_KEY:-}" && "${VAPID_PRIVATE_KEY:-}" && "${BOOTSTRAP_ADMIN_PHONE:-}" && "${AUTH_DEVELOPMENT_OTP:-}" ]] || exit 64

temporary_directory="$(mktemp -d)"
cleanup() { rm -rf -- "$temporary_directory"; }
trap cleanup EXIT
printf '%s\n' "$DEPLOY_SSH_PRIVATE_KEY" > "$temporary_directory/key"
printf '%s\n' "$DEPLOY_SSH_KNOWN_HOSTS" > "$temporary_directory/known_hosts"
chmod 600 "$temporary_directory/key" "$temporary_directory/known_hosts"
ssh_options=(-i "$temporary_directory/key" -o UserKnownHostsFile="$temporary_directory/known_hosts" -o StrictHostKeyChecking=yes -o BatchMode=yes -p "$DEPLOY_PORT")
remote_directory="$(ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" 'mktemp -d /tmp/expressa-deploy.XXXXXX')"
trap 'ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "rm -rf -- $(printf %q "$remote_directory")" >/dev/null 2>&1 || true; cleanup' EXIT
scp -P "$DEPLOY_PORT" -i "$temporary_directory/key" -o UserKnownHostsFile="$temporary_directory/known_hosts" -o StrictHostKeyChecking=yes -o BatchMode=yes deploy/deploy.sh deploy/compose.yml "$image_file" "$DEPLOY_USER@$DEPLOY_HOST:$remote_directory/"
printf '%s\0%s\0%s\0%s\0%s\0%s\0' "$BOOTSTRAP_ADMIN_PHONE" "$AUTH_DEVELOPMENT_OTP" "$VAPID_SUBJECT" "$VAPID_PUBLIC_KEY" "$VAPID_PRIVATE_KEY" development |
  ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "set -Eeuo pipefail; IFS= read -r -d '' DELIVERY_BOOTSTRAP_ADMIN_PHONE; IFS= read -r -d '' DELIVERY_AUTH_DEVELOPMENT_OTP; IFS= read -r -d '' DELIVERY_VAPID_SUBJECT; IFS= read -r -d '' DELIVERY_VAPID_PUBLIC_KEY; IFS= read -r -d '' DELIVERY_VAPID_PRIVATE_KEY; IFS= read -r -d '' DELIVERY_ENVIRONMENT; [[ \"\$DELIVERY_ENVIRONMENT\" == development ]] || exit 64; source $(printf %q "$remote_directory/$(basename "$image_file")"); export BACKEND_IMAGE FRONT_IMAGE BACK_IMAGE DELIVERY_BOOTSTRAP_ADMIN_PHONE DELIVERY_AUTH_DEVELOPMENT_OTP DELIVERY_VAPID_SUBJECT DELIVERY_VAPID_PUBLIC_KEY DELIVERY_VAPID_PRIVATE_KEY; DEPLOY_ROOT=/srv/expressa bash $(printf %q "$remote_directory/deploy.sh") --environment development deploy all"
