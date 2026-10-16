#!/usr/bin/env bash
# Publishes a finished build to the gh-pages branch.
#
#   MODE=live|preview DIST=apps/website/dist scripts/deploy-pages.sh
#
# Every deploy is ONE fresh commit holding the whole tree, force-pushed with a lease, so the
# branch never grows (images are not piled up in history). If another deploy (live vs preview)
# lands first, the lease fails and we start again from what is now there, so neither is lost.
# REMOTE_URL defaults to this repo over HTTPS with GITHUB_TOKEN; tests point it at a local repo.
set -euo pipefail

MODE="${MODE:?MODE (live or preview) is required}"
DIST="${DIST:?DIST (the build folder) is required}"
BRANCH="${PAGES_BRANCH:-gh-pages}"
REMOTE_URL="${REMOTE_URL:-https://x-access-token:${GITHUB_TOKEN:-}@github.com/${GITHUB_REPOSITORY:-}.git}"
MESSAGE="${COMMIT_MESSAGE:-Publish ${MODE} build}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$(cd "$DIST" && pwd)"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

for attempt in 1 2 3 4 5; do
  rm -rf "$work/pages"
  if git ls-remote --exit-code --heads "$REMOTE_URL" "$BRANCH" >/dev/null 2>&1; then
    git clone --quiet --branch "$BRANCH" --single-branch --depth 1 "$REMOTE_URL" "$work/pages"
    expected="$(git -C "$work/pages" rev-parse HEAD)"
  else
    git init --quiet -b "$BRANCH" "$work/pages"
    git -C "$work/pages" remote add origin "$REMOTE_URL"
    expected=""
  fi

  node "$HERE/publish-pages.mjs" "$MODE" "$DIST" "$work/pages"

  cd "$work/pages"
  git config user.name "site-builder[bot]"
  git config user.email "site-builder@users.noreply.github.com"
  git checkout --quiet --orphan next
  git add -A
  git commit --quiet -m "$MESSAGE"
  if git push --quiet --force-with-lease="$BRANCH:$expected" origin "next:$BRANCH"; then
    echo "Published the $MODE build to $BRANCH (attempt $attempt)."
    exit 0
  fi
  echo "Another publish landed first; trying again ($attempt of 5)."
  cd "$HERE"
  sleep $((attempt * 2))
done

echo "::error::Could not publish after 5 attempts."
exit 1
