# Git ↔ SVN Synchronization Plan for Agora

## Context

**Git repo**: `https://github.com/DjeziriOus/Agora.git`
**Your Git identity**: `XeedOus` / `Oussama Djeziri` — email `100945558+DjeziriOus@users.noreply.github.com`
**Team**: 4 members — you (Oussama), Elena (`crreciunela@gmail.com`), Rui (`dennismachn@outlook.com`), Wenxiao (`wenxiaoli_fr@163.com`)

**SVN structure** (from your screenshot):
```
├── branche/
│   ├── elena/
│   ├── oussama/
│   ├── rui/
│   └── wenxiao/
├── tag/
└── trunk/
    ├── backend/
    └── frontend/
```

**Your branches** (12 branches created by you + prod + dev):
| Branch | Creator |
|---|---|
| `prod` | You |
| `dev` | You |
| `f1-auth-google-oauth` | You |
| `f1-email-verification` | You |
| `f1-linking-login` | You |
| `f2-navbar-linking` | You |
| `f2-searching-products` | You |
| `f2-shop-creation` | You |
| `f2-variants-and-carts` | You |
| `f3-page-vendeur` | You |
| `f3-produit-backend` | You |
| `f3-shop-backend` | You |
| `f3-upload-images-frontend` | You |

**Others' branches** (not yours):
| Branch | Creator |
|---|---|
| `f2-Cart-CRUD-API` | Elena |
| `f2-linking-cart-management-client` | Elena |
| `f2-ag-2-6-fix` | Rui |
| `f3-gestion-produit-backend/linking` | Rui |
| `page-404` | Rui |
| `f2-panier` | Wenxiao |

---

## Answers to Your Questions

### 1. Does SVN detect file modifications the same way Git does?

**Yes.** SVN tracks files by path identity — if you replace a file's content but keep the same filename and path, SVN sees it as a **modification** (`M`), not a delete+create. This is the same behavior as Git. The scripts use `rsync --delete` or `find . -delete` + `git archive` which replaces content in-place, and SVN's `svn status` correctly reports `M` (modified), `?` (new/untracked), and `!` (missing/deleted).

### 2. Where should `dev` go in SVN?

Given your SVN folder structure, the best mapping is:

| Git Branch | SVN Location | Rationale |
|---|---|---|
| `prod` | `trunk/` | Standard SVN convention — trunk = production-ready code |
| `dev` | `branche/oussama/dev` | It's your branch, and it's a shared integration branch. Putting it in your folder is correct because you maintain it. Other members can still access it from there. |

> [!IMPORTANT]
> An alternative would be to put `dev` directly under `branche/dev` (at the top level, not inside anyone's folder) since all team members use it. **Your call** — do you want `dev` in `branche/oussama/dev` or `branche/dev`?

### 3. Do Git merges/PR acceptances register to your name in SVN?

**Not automatically, but yes with our script.** Here's how it works:

- When you merge a PR in GitHub, Git creates a **merge commit** authored by whoever clicks the merge button (you).
- The GitHub Actions workflow triggers on pushes to `prod` — a merge to `prod` is a push to `prod`.
- The SVN commit is made by the GitHub Actions runner using **your SVN credentials** (from GitHub Secrets), so **the SVN commit will always be attributed to your SVN username**.
- The **commit message** will contain the original Git commit message (we'll preserve it — see below).

**In short**: Any merge you accept → push to prod → triggers Action → SVN commit under your SVN account. ✅

### 4. What if you commit on someone else's branch?

The improved workflow handles this with **smart branch routing**:

| Scenario | Behavior |
|---|---|
| You push to `prod` | → Syncs to `trunk/` |
| You push to a branch you created (e.g., `f2-shop-creation`) | → Syncs to `branche/oussama/f2-shop-creation` |
| You push to someone else's branch (e.g., `f2-panier` by Wenxiao) that **exists in SVN** under their folder | → Syncs **directly to their branch** in SVN (e.g., `branche/wenxiao/f2-panier`), NOT to your folder |
| You push to someone else's branch that **doesn't exist in SVN** | → **Aborts sync** + sends you a notification (GitHub Actions failure + optional email/Discord webhook) |

> [!IMPORTANT]
> This is the key fix from the original script. We don't copy their branch into your folder — we either commit to their existing SVN branch or abort.

### 5. Will commit messages be identical between Git and SVN?

**Yes, we'll make them identical.** The script will extract the Git commit message using `git log -1 --format='%s'` and pass it as the SVN commit message with a small prefix for traceability:

```
[git-sync] <original git commit message> (SHA: abc1234)
```

If you want them **100% identical** (no prefix), we can do that too. The prefix is just useful for knowing which SVN commits came from the auto-sync vs manual SVN commits.

---

## User Review Required

> [!IMPORTANT]
> **Where to put `dev`?**
> - Option A: `branche/oussama/dev` (your folder, you maintain it)
> - Option B: `branche/dev` (top-level, since all team members use it)
>
> Which do you prefer?

> [!IMPORTANT]
> **Commit message format.** Do you want:
> - Option A: `[git-sync] original message (SHA: abc1234)` — traceable
> - Option B: Exact same message as Git — clean

> [!WARNING]
> **SVN credentials for GitHub Actions.** You'll need to add these as GitHub Secrets:
> - `SVN_USERNAME` — your SVN username
> - `SVN_PASSWORD` — your SVN password
> - `SVN_BASE_URL` — your SVN server URL (e.g., `svn://your-server/repo`)
>
> I'll need you to provide the SVN server URL format so I can configure the scripts correctly.

> [!IMPORTANT]
> **Notification method.** When the sync aborts (e.g., pushing to a non-existent SVN branch), how do you want to be notified?
> - Option A: Just GitHub Actions failure notification (default, you see it in the Actions tab)
> - Option B: Discord webhook
> - Option C: Email notification
> - Option D: Slack webhook

---

## Proposed Changes

### Overview

We create 3 files in the repo:

```
.github/
  workflows/
    svn-sync.yml          ← GitHub Actions workflow (auto-sync on push)
scripts/
  sync-trunk.sh           ← Manual: sync prod → SVN trunk
  sync-branches.sh        ← Manual: upload your 12 branches to SVN
```

---

### Script 1: `sync-trunk.sh` — One-time Trunk Sync

#### [NEW] [sync-trunk.sh](file:///c:/Users/xps/Desktop/Projet L3Q2/Agora/scripts/sync-trunk.sh)

Syncs Git `prod` → SVN `trunk/`. Improvements over the provided script:

- Uses `rsync` instead of `find -delete` + `tar` (safer, handles edge cases better)
- Preserves Git commit message
- Proper error handling with `set -euo pipefail` + `trap` cleanup
- Handles filenames with spaces
- No hardcoded credentials

---

### Script 2: `sync-branches.sh` — One-time Branch Upload

#### [NEW] [sync-branches.sh](file:///c:/Users/xps/Desktop/Projet L3Q2/Agora/scripts/sync-branches.sh)

Uploads your 12 feature branches to `branche/oussama/` in SVN. Improvements:

- Hardcoded list of YOUR branches only (no dynamic detection that could pick up others')
- Converts `/` in branch names to `-` for SVN paths (e.g., `f3-gestion-produit-backend/linking` → `f3-gestion-produit-backend-linking`)
- Each branch gets its own SVN folder under `branche/oussama/`
- Proper cleanup per loop iteration

---

### Script 3: `svn-sync.yml` — GitHub Actions Auto-Sync

#### [NEW] [svn-sync.yml](file:///c:/Users/xps/Desktop/Projet L3Q2/Agora/.github/workflows/svn-sync.yml)

Triggers on every push to `prod` or any branch. Smart routing logic:

```
1. Get the branch name from GITHUB_REF
2. Get the commit author email from git log
3. If branch == "prod":
     → Sync to trunk/
4. Else if author is you (DjeziriOus email):
     a. Check if branch was created by you (in a hardcoded list OR dynamically)
     b. If yes → sync to branche/oussama/<branch-name>
     c. If no → it's someone else's branch
        - Check if it exists in SVN under the correct owner's folder
        - If exists → commit directly to their SVN branch
        - If not exists → ABORT + notification
5. Else (author is not you):
     → Skip (only sync YOUR commits)
```

**Branch-to-SVN-folder mapping** (for "someone else's branch" routing):

```yaml
# Git author email → SVN folder name
elena (crreciunela@gmail.com)  → branche/elena/
rui   (dennismachn@outlook.com) → branche/rui/
wenxiao (wenxiaoli_fr@163.com)  → branche/wenxiao/
```

**Trigger configuration:**
```yaml
on:
  push:
    branches:
      - prod
      - dev
      - 'f1-*'
      - 'f2-*'
      - 'f3-*'
      - 'page-*'
```

This covers all current branch naming patterns. We can change to `'**'` (all branches) if you prefer.

---

## Execution Order

1. **First**: Run `sync-trunk.sh` manually to update SVN trunk with current `prod` content
2. **Second**: Run `sync-branches.sh` manually to upload all 12 of your branches
3. **Third**: Commit & push the `svn-sync.yml` workflow file to enable automatic sync going forward

---

## Open Questions

> [!IMPORTANT]
> 1. **What is your SVN server URL?** (e.g., `svn://server/repo`, `https://svn.example.com/repos/agora`, etc.)
> 2. **Where should `dev` go?** `branche/oussama/dev` or `branche/dev`?
> 3. **Commit message format?** With `[git-sync]` prefix or exact copy?
> 4. **Notification preference?** GitHub Actions tab only, or Discord/email/Slack?
> 5. **Do you have SVN command-line tools installed on your Windows machine?** (We need them for the manual scripts). If not, we'll use the GitHub Actions approach for everything.
> 6. **Branch trigger scope**: Should the workflow trigger on ALL branches (`'**'`), or only the specific patterns listed above?

---

## Verification Plan

### Automated Tests
1. Run `sync-trunk.sh` → verify SVN trunk matches `git archive prod` output
2. Run `sync-branches.sh` → verify each of the 12 branches appears under `branche/oussama/` in SVN
3. Make a test commit on `prod` in Git → verify GitHub Action triggers and SVN trunk updates
4. Make a test commit on one of your feature branches → verify it syncs to `branche/oussama/<branch>`

### Manual Verification
1. Browse SVN repo to confirm folder structure is correct
2. Spot-check file contents between Git and SVN for a few files
3. Verify SVN commit messages match Git messages
4. Test the abort scenario: push to a non-existent SVN branch → confirm workflow fails and notification is sent
