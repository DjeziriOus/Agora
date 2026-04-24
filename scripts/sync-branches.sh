#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# sync-branches.sh — One-time upload: git branches → SVN
# Uploads dev → branche/dev, feature branches → branche/oussama/
# Run from Git Bash:  bash scripts/sync-branches.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

GIT_REPO="$(cd "$(dirname "$0")/.." && pwd)"
SVN_BASE="https://forge.ens.math-info.univ-paris5.fr/svn/2025-l3q2"

read -rp "SVN username: " SVN_USER
read -rsp "SVN password: " SVN_PASS
echo

# ── Branch → SVN path mapping ──
declare -A BRANCH_MAP=(
  ["dev"]="branche/dev"
  ["f1-auth-google-oauth"]="branche/oussama/f1-auth-google-oauth"
  ["f1-email-verification"]="branche/oussama/f1-email-verification"
  ["f1-linking-login"]="branche/oussama/f1-linking-login"
  ["f2-navbar-linking"]="branche/oussama/f2-navbar-linking"
  ["f2-searching-products"]="branche/oussama/f2-searching-products"
  ["f2-shop-creation"]="branche/oussama/f2-shop-creation"
  ["f2-variants-and-carts"]="branche/oussama/f2-variants-and-carts"
  ["f3-page-vendeur"]="branche/oussama/f3-page-vendeur"
  ["f3-produit-backend"]="branche/oussama/f3-produit-backend"
  ["f3-shop-backend"]="branche/oussama/f3-shop-backend"
  ["f3-upload-images-frontend"]="branche/oussama/f3-upload-images-frontend"
)

TOTAL=${#BRANCH_MAP[@]}
COUNT=0

for GIT_BRANCH in "${!BRANCH_MAP[@]}"; do
  COUNT=$((COUNT + 1))
  SVN_PATH="${BRANCH_MAP[$GIT_BRANCH]}"
  SVN_URL="$SVN_BASE/$SVN_PATH"

  echo ""
  echo "━━━ [$COUNT/$TOTAL] $GIT_BRANCH → $SVN_PATH ━━━"

  # Verify the git branch exists
  if ! git -C "$GIT_REPO" rev-parse --verify "$GIT_BRANCH" &>/dev/null; then
    echo "⚠️  Git branch '$GIT_BRANCH' not found. Skipping."
    continue
  fi

  WORK_DIR=$(mktemp -d)

  # Create SVN path if needed
  svn mkdir --parents --username "$SVN_USER" --password "$SVN_PASS" \
    --no-auth-cache --non-interactive "$SVN_URL" \
    -m "[git-sync] Create $SVN_PATH" 2>/dev/null || true

  # Checkout SVN path
  svn checkout --username "$SVN_USER" --password "$SVN_PASS" \
    --no-auth-cache --non-interactive "$SVN_URL" "$WORK_DIR/wc"

  cd "$WORK_DIR/wc"

  # Clear and export
  find . -mindepth 1 -maxdepth 1 -not -name '.svn' -exec rm -rf {} +
  git -C "$GIT_REPO" archive "$GIT_BRANCH" | tar -x -C .

  # Stage
  svn add --force . 2>/dev/null || true
  svn status | grep '^!' | while IFS= read -r line; do
    svn delete --force "${line:8}" 2>/dev/null || true
  done || true

  # Commit
  if svn status | grep -qE '^[MADR]'; then
    GIT_SHA=$(git -C "$GIT_REPO" log -1 --format='%h' "$GIT_BRANCH")
    svn commit --username "$SVN_USER" --password "$SVN_PASS" \
      --no-auth-cache --non-interactive \
      -m "[git-sync] Initial import of $GIT_BRANCH (SHA: $GIT_SHA)"
    echo "✅ Done: $GIT_BRANCH"
  else
    echo "ℹ️  No changes: $GIT_BRANCH"
  fi

  cd /tmp
  rm -rf "$WORK_DIR"
done

echo ""
echo "🎉 All branches uploaded to SVN."
