#!/bin/sh

set -eu

repository_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  printf '%s\n' 'test-git-hooks: run this script from a Git working tree.' >&2
  exit 1
}

hook_binaries="$repository_root/node_modules/.bin"
if [ ! -x "$hook_binaries/lint-staged" ]; then
  printf '%s\n' 'test-git-hooks: install root dependencies before running this script.' >&2
  exit 1
fi
export PATH="$hook_binaries:$PATH"

if ! (
  cd "$repository_root"
  .husky/pre-commit
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
mkdir -p "$temporary_repository/.husky"
cp "$repository_root/package.json" "$temporary_repository/package.json"
cp "$repository_root/.husky/pre-commit" "$temporary_repository/.husky/pre-commit"
cp "$repository_root/.husky/pre-push" "$temporary_repository/.husky/pre-push"
chmod +x "$temporary_repository/.husky/pre-commit" \
  "$temporary_repository/.husky/pre-push"

(
  cd "$temporary_repository"
  npm run prepare
)

if [ ! -x "$temporary_repository/.husky/_/pre-commit" ]; then
  printf '%s\n' 'test-git-hooks: Husky did not install pre-commit.' >&2
  exit 1
fi

printf '%s\n' 'const formatted = {value: 1};' > "$temporary_repository/format.ts"
git -C "$temporary_repository" add format.ts
if ! git -C "$temporary_repository" commit -qm format-staged-file >/dev/null 2>&1; then
  printf '%s\n' 'test-git-hooks: staged source was rejected.' >&2
  exit 1
fi

if [ "$(git -C "$temporary_repository" show HEAD:format.ts)" != 'const formatted = { value: 1 };' ]; then
  printf '%s\n' 'test-git-hooks: staged file was not formatted and re-staged.' >&2
  exit 1
fi

printf '%s%s\n' 'api_key=' '123456789012' > "$temporary_repository/runtime.config"
git -C "$temporary_repository" add runtime.config
if git -C "$temporary_repository" commit -qm reject-fixture >/dev/null 2>&1; then
  printf '%s\n' 'test-git-hooks: commit with secret-like content was accepted.' >&2
  exit 1
fi

git -C "$temporary_repository" reset -q
printf '%s%s\n' 'api_key=' '123456789012' > "$temporary_repository/removed.config"
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

printf '%s%s\n' 'const accessToken = ' 'session.accessToken;' > "$temporary_repository/runtime.ts"
git -C "$temporary_repository" add runtime.ts
if ! git -C "$temporary_repository" commit -qm allow-reference >/dev/null 2>&1; then
  printf '%s\n' 'test-git-hooks: commit with credential reference was rejected.' >&2
  exit 1
fi

mkdir -p "$temporary_repository/back-office/tests/e2e"
printf '%s%s%s\n' 'const accessToken = "' 'e2e-dummy-access-token' '";' > "$temporary_repository/back-office/tests/e2e/orders.e2e.ts"
git -C "$temporary_repository" add back-office/tests/e2e/orders.e2e.ts
if ! git -C "$temporary_repository" commit -qm allow-e2e-dummy >/dev/null 2>&1; then
  printf '%s\n' 'test-git-hooks: exact E2E dummy fixture was rejected.' >&2
  exit 1
fi

printf '%s%s%s\n' 'const accessToken = "' 'production-secret-token' '";' > "$temporary_repository/back-office/tests/e2e/orders.e2e.ts"
git -C "$temporary_repository" add back-office/tests/e2e/orders.e2e.ts
if git -C "$temporary_repository" commit -qm reject-e2e-secret >/dev/null 2>&1; then
  printf '%s\n' 'test-git-hooks: E2E secret-like content was accepted.' >&2
  exit 1
fi

git -C "$temporary_repository" reset -q
mkdir -p "$temporary_repository/deploy"
printf '%s%s%s\n' 'const accessToken = "' 'production-secret-token' '";' > "$temporary_repository/deploy/runtime.mjs"
git -C "$temporary_repository" add deploy/runtime.mjs
if git -C "$temporary_repository" commit -qm reject-deploy-secret >/dev/null 2>&1; then
  printf '%s\n' 'test-git-hooks: deploy secret-like content was accepted.' >&2
  exit 1
fi

git -C "$temporary_repository" reset -q
mkdir -p "$temporary_repository/.trusted-hooks"
cp "$temporary_repository/.husky/pre-commit" "$temporary_repository/.trusted-hooks/pre-commit"
malicious_hook_line="  | grep -Fvx '+const accessToken = \""
malicious_hook_line="${malicious_hook_line}production-secret-token\";'"
printf '%s\n' "$malicious_hook_line" >> "$temporary_repository/.husky/pre-commit"
git -C "$temporary_repository" add .husky/pre-commit
if (
  cd "$temporary_repository"
  .trusted-hooks/pre-commit
); then
  printf '%s\n' 'test-git-hooks: malicious hook literal was accepted.' >&2
  exit 1
fi

printf '%s\n' 'Git hook self-test passed.'
