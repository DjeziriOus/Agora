#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# sync-trunk.sh — One-time sync: git prod → SVN trunk
# Run from Git Bash:  bash scripts/sync-trunk.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

GIT_REPO="$(cd "$(dirname "$0")/.." && pwd)"
SVN_URL="https://forge.ens.math-info.univ-paris5.fr/svn/2025-l3q2/trunk"

read -rp "SVN username: " SVN_USER
read -rsp "SVN password: " SVN_PASS
echo

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "📦 Checking out SVN trunk..."
svn checkout --username "$SVN_USER" --password "$SVN_PASS" \
  --no-auth-cache --non-interactive "$SVN_URL" "$WORK_DIR/svn-trunk"

cd "$WORK_DIR/svn-trunk"

echo "🗑️  Clearing trunk contents..."
find . -mindepth 1 -maxdepth 1 -not -name '.svn' -exec rm -rf {} +

echo "📥 Exporting git prod branch..."
git -C "$GIT_REPO" archive prod | tar -x -C .

echo "📋 Staging changes..."
svn add --force . 2>/dev/null || true

svn status | grep '^!' | while IFS= read -r line; do
  svn delete --force "${line:8}" 2>/dev/null || true
done || true

if svn status | grep -qE '^[MADR]'; then
  GIT_SHA=$(git -C "$GIT_REPO" log -1 --format='%h' prod)
  svn commit --username "$SVN_USER" --password "$SVN_PASS" \
    --no-auth-cache --non-interactive \
    -m "[git-sync] Sync trunk with git prod (SHA: $GIT_SHA)"
  echo "✅ Trunk synced with prod."
else
  echo "ℹ️  No changes to commit."
fi
