#!/bin/sh

set -eu

script_directory=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository_root=$(git -C "$script_directory/.." rev-parse --show-toplevel 2>/dev/null) || {
  printf '%s\n' 'install-git-hooks: run this script from a Git working tree.' >&2
  exit 1
}

if [ ! -x "$repository_root/.githooks/pre-commit" ] || [ ! -x "$repository_root/.githooks/pre-push" ]; then
  printf '%s\n' 'install-git-hooks: versioned hooks must be executable.' >&2
  exit 1
fi

git -C "$repository_root" config core.hooksPath .githooks

if [ "$(git -C "$repository_root" config --get core.hooksPath)" != '.githooks' ]; then
  printf '%s\n' 'install-git-hooks: unable to configure core.hooksPath.' >&2
  exit 1
fi

printf '%s\n' 'Git hooks installed from .githooks.'
