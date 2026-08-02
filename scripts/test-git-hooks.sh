#!/bin/sh

set -eu

repository_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  printf '%s\n' 'test-git-hooks: run this script from a Git working tree.' >&2
  exit 1
}

if ! (
  cd "$repository_root"
  .githooks/pre-commit
); then
  printf '%s\n' 'test-git-hooks: current staged diff was rejected.' >&2
  exit 1
fi

temporary_repository=$(mktemp -d "${TMPDIR:-/tmp}/expressa-git-hooks.XXXXXX") || {
  printf '%s\n' 'test-git-hooks: unable to create temporary repository.' >&2
  exit 1
}

cleanup() {
  rm -rf "$temporary_repository"
}
trap cleanup EXIT HUP INT TERM

git init -q "$temporary_repository"
git -C "$temporary_repository" config user.email hook-test@example.invalid
git -C "$temporary_repository" config user.name hook-test
mkdir -p "$temporary_repository/.githooks" "$temporary_repository/scripts"
cp "$repository_root/.githooks/pre-commit" "$temporary_repository/.githooks/pre-commit"
cp "$repository_root/.githooks/pre-push" "$temporary_repository/.githooks/pre-push"
cp "$repository_root/scripts/install-git-hooks.sh" "$temporary_repository/scripts/install-git-hooks.sh"
chmod +x "$temporary_repository/.githooks/pre-commit" \
  "$temporary_repository/.githooks/pre-push" \
  "$temporary_repository/scripts/install-git-hooks.sh"

(
  cd "$temporary_repository"
  ./scripts/install-git-hooks.sh
)

if [ "$(git -C "$temporary_repository" config --get core.hooksPath)" != '.githooks' ]; then
  printf '%s\n' 'test-git-hooks: installer did not configure core.hooksPath.' >&2
  exit 1
fi

printf '%s\n' 'api_key=123456789012' > "$temporary_repository/runtime.config"
git -C "$temporary_repository" add runtime.config
if git -C "$temporary_repository" commit -qm reject-fixture >/dev/null 2>&1; then
  printf '%s\n' 'test-git-hooks: commit with secret-like content was accepted.' >&2
  exit 1
fi

git -C "$temporary_repository" reset -q
printf '%s\n' 'api_key=123456789012' > "$temporary_repository/removed.config"
git -C "$temporary_repository" add removed.config
git -C "$temporary_repository" -c core.hooksPath=/dev/null commit -qm deletion-fixture
git -C "$temporary_repository" rm -q removed.config
if ! git -C "$temporary_repository" commit -qm allow-deletion >/dev/null 2>&1; then
  printf '%s\n' 'test-git-hooks: deletion of secret-like content was rejected.' >&2
  exit 1
fi

printf '%s\n' 'api_key=${API_KEY}' > "$temporary_repository/runtime.config"
git -C "$temporary_repository" add runtime.config
if ! git -C "$temporary_repository" commit -qm allow-fixture >/dev/null 2>&1; then
  printf '%s\n' 'test-git-hooks: commit with placeholder content was rejected.' >&2
  exit 1
fi

printf '%s\n' 'Git hook self-test passed.'
