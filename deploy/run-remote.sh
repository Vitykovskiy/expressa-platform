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
scp -P "$DEPLOY_PORT" -i "$temporary_directory/key" -o UserKnownHostsFile="$temporary_directory/known_hosts" -o StrictHostKeyChecking=yes -o BatchMode=yes deploy/deploy.sh deploy/compose.yml "$image_file" "$DEPLOY_USER@$DEPLOY_HOST:$remote_directory/"
printf '%s\n' "${BOOTSTRAP_ADMIN_PHONE:-}" | ssh "${ssh_options[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "set -Eeuo pipefail; read -r BOOTSTRAP_ADMIN_PHONE; source $(printf %q "$remote_directory/$(basename "$image_file")"); export BACKEND_IMAGE FRONT_IMAGE BACK_IMAGE BOOTSTRAP_ADMIN_PHONE; DEPLOY_ROOT=/srv/expressa bash $(printf %q "$remote_directory/deploy.sh") --environment $(printf %q "$environment") deploy all"
