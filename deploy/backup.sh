#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

fail() { printf '%s\n' "backup: $1" >&2; exit 1; }
require_directory() {
  [[ "$1" == /* && "$1" != / && ! -L "$1" ]] || fail 'directory must be an absolute non-root path'
  mkdir -p -- "$1"
}

: "${BACKUP_DIRECTORY:?BACKUP_DIRECTORY is required}"
: "${BACKUP_ENCRYPTION_KEY_FILE:?BACKUP_ENCRYPTION_KEY_FILE is required}"
: "${BACKUP_INTEGRITY_KEY_FILE:?BACKUP_INTEGRITY_KEY_FILE is required}"
: "${BACKUP_METRICS_DIRECTORY:?BACKUP_METRICS_DIRECTORY is required}"
: "${BACKUP_RETENTION_DAYS:?BACKUP_RETENTION_DAYS is required}"
: "${POSTGRES_CONTAINER:?POSTGRES_CONTAINER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
[[ -r "$BACKUP_ENCRYPTION_KEY_FILE" && ! -L "$BACKUP_ENCRYPTION_KEY_FILE" ]] || fail 'backup encryption key is unavailable'
[[ -r "$BACKUP_INTEGRITY_KEY_FILE" && ! -L "$BACKUP_INTEGRITY_KEY_FILE" ]] || fail 'backup integrity key is unavailable'
[[ "$BACKUP_RETENTION_DAYS" =~ ^[1-9][0-9]*$ ]] || fail 'BACKUP_RETENTION_DAYS must be a positive integer'
require_directory "$BACKUP_DIRECTORY"
require_directory "$BACKUP_METRICS_DIRECTORY"
[[ "$(docker inspect --format '{{.State.Running}}' -- "$POSTGRES_CONTAINER" 2>/dev/null || true)" == true ]] || fail 'PostgreSQL container is unavailable'

backup_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$BACKUP_DIRECTORY/expressa-$backup_stamp.sql.enc"
temporary_file="$backup_file.partial"
backup_mac_file="$backup_file.sha256"
temporary_mac_file="$backup_mac_file.partial"
metric_file="$BACKUP_METRICS_DIRECTORY/expressa_backup.prom"
temporary_metric_file="$metric_file.partial"
cleanup() { rm -f -- "$temporary_file" "$temporary_mac_file" "$temporary_metric_file"; }
trap cleanup EXIT

docker exec -- "$POSTGRES_CONTAINER" \
  pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" | \
  openssl enc -aes-256-cbc -pbkdf2 -salt -pass "file:$BACKUP_ENCRYPTION_KEY_FILE" -out "$temporary_file"
[[ -s "$temporary_file" ]] || fail 'encrypted backup is empty'
openssl dgst -sha256 -mac HMAC -macopt "key:file:$BACKUP_INTEGRITY_KEY_FILE" -binary "$temporary_file" | \
  openssl base64 -A > "$temporary_mac_file"
[[ -s "$temporary_mac_file" ]] || fail 'backup integrity MAC is empty'
mv -- "$temporary_file" "$backup_file"
mv -- "$temporary_mac_file" "$backup_mac_file"
find "$BACKUP_DIRECTORY" -type f \( -name 'expressa-*.sql.enc' -o -name 'expressa-*.sql.enc.sha256' \) -mtime +"$BACKUP_RETENTION_DAYS" -delete

backup_timestamp="$(date +%s)"
printf 'expressa_backup_last_success_timestamp_seconds %s\nexpressa_backup_last_success 1\n' "$backup_timestamp" > "$temporary_metric_file"
mv -- "$temporary_metric_file" "$metric_file"
printf 'expressa-backup: status=passed timestamp=%s\n' "$backup_stamp"
