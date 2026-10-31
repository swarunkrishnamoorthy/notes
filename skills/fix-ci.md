---
name: fix-ci
description: >-
  Diagnose and fix GitHub Actions CI failures on the current branch's PR: fetch
  failed check runs and job logs via `gh`, read workflow YAML when logs are
  ambiguous, auto-apply high-confidence local fixes (formatters, mechanical lint),
  and ask before commit/push. Auto-detects github.com vs GHE (e.g. [internal host removed]).
  Use when the user says "fix ci", "ci is failing", "CI is red", "fix pipeline",
  "fix github actions", "fix checks", "why is CI red", or asks what failed on their PR.
  Use this skill for one-shot PR diagnosis and local fixes. Use run-ci-checks for
  pre-push local runs without opening GitHub.
---

# Fix CI Checks

Diagnosis-first workflow for GitHub Actions failures on the current branch's PR. Auto-apply high-confidence local fixes; ask before commit or push.

## Prerequisites

- `gh` authenticated for the repo host (`gh auth login -h github.com` or `-h [internal host removed]`).
- Current directory is a git repo with `origin` remote.
- An open PR exists for the current branch.

## Workflow

### Step 0: Detect GitHub host from origin URL

Derive hostname from `origin` so every `gh` call hits the right instance.

```bash
ORIGIN_URL=$(git remote get-url origin)

# Extract hostname - handles both HTTPS and SSH URLs
if echo "$ORIGIN_URL" | grep -q '://'; then
  GH_HOSTNAME=$(echo "$ORIGIN_URL" | sed -E 's|.*://([^/]+).*|\1|' | sed 's/:.*//')
else
  GH_HOSTNAME=$(echo "$ORIGIN_URL" | sed -E 's|.*@([^:]+):.*|\1|')
fi

OWNER=$(echo "$ORIGIN_URL" | sed -E 's|.*[:/]([^/]+)/[^/]+(\.git)?$|\1|')
REPO=$(echo "$ORIGIN_URL" | sed -E 's|.*[:/][^/]+/([^/]+?)(\.git)?$|\1|')
```

Prefix every subsequent `gh` command with `GH_HOST="$GH_HOSTNAME"`. Do not hardcode a host.

### Step 1: Find the PR

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)

PR_JSON=$(GH_HOST="$GH_HOSTNAME" gh pr list --head "$BRANCH" \
  --json number,url,headRefOid --limit 1 2>/dev/null)
```

If `PR_JSON` is empty or `[]`, tell the user no PR was found for branch `$BRANCH` and stop.

Extract `PR_NUMBER` and `SHA` (`headRefOid`).

### Step 2: Get failed checks

```bash
GH_HOST="$GH_HOSTNAME" gh api "repos/$OWNER/$REPO/commits/$SHA/check-runs" \
  --jq '.check_runs[] | select(.conclusion == "failure") | {id, name, html_url}'
```

If no failed check runs, also check commit statuses:

```bash
GH_HOST="$GH_HOSTNAME" gh api "repos/$OWNER/$REPO/commits/$SHA/status" \
  --jq '.statuses[] | select(.state == "failure") | {context, target_url, description}'
```

If everything is green, tell the user CI is passing and stop.

### Step 3: Get logs for each failed job

CI logs are often enormous, so prefer the tools that return only the failed portion and scope the rest aggressively - dumping a whole job log wastes context and buries the real error under setup noise.

**3a. Preferred - `gh run view --log-failed`** returns only the failed steps for the whole run, which is usually all you need:

```bash
JOB_ID=<id from step 2>

# The Actions run behind this job
RUN_ID=$(GH_HOST="$GH_HOSTNAME" gh api "repos/$OWNER/$REPO/actions/jobs/$JOB_ID" --jq '.run_id')
GH_HOST="$GH_HOSTNAME" gh run view "$RUN_ID" --repo "$OWNER/$REPO" --log-failed
```

**3b. Identify which steps failed** so you know where in the log to look:

```bash
GH_HOST="$GH_HOSTNAME" gh api "repos/$OWNER/$REPO/actions/jobs/$JOB_ID" \
  --jq '{name, steps: [.steps[] | select(.conclusion == "failure") | {name, number}]}'
```

**3c. Fallback - raw job logs, scoped to the error region** (only if 3a is unavailable), so you don't flood context with successful setup output:

```bash
GH_HOST="$GH_HOSTNAME" gh api "repos/$OWNER/$REPO/actions/jobs/$JOB_ID/logs" 2>&1 \
  | grep -niE 'error|fail|✕|✗|expected|assert|denied|not found|timed out' | tail -80
```

If the job is still running, fall back to annotations:

```bash
GH_HOST="$GH_HOSTNAME" gh api "repos/$OWNER/$REPO/check-runs/$JOB_ID/annotations"
```

### Step 4: Read local workflow and action definitions

When logs alone are not enough - or you need the exact command a step runs - read workflow and action files.

**4a. Map the failed check to its workflow file.**

```bash
ls .github/workflows/*.yml .github/workflows/*.yaml 2>/dev/null
```

Match each failed job name to a workflow `name:` or job key, then read that file.

**4b. Read the workflow file for the failing job.**

Extract:
- The `run:` command or `uses:` action for the failing step.
- Any `env:`, `with:`, or `if:` on that step/job.
- Whether the job calls a reusable workflow.

**4c. If the step uses a local composite action, read it too.**

```bash
cat .github/actions/setup-env/action.yml  # adapt path
```

When to read workflows:
- Always do 4a (quick listing).
- Do 4b when logs are ambiguous or step names are generic ("Run script", "Build").
- Do 4c only for local composite actions.

### Step 5: Analyze errors

| Category | Patterns to look for |
|----------|---------------------|
| **Lint / format** | `Diff in`, `StyLua failed`, `selene`, `eslint`, `prettier`, `ruff`, `black`, `gofmt` |
| **Static analysis** | `(E###)`, `LocalUnused`, `error(s) in`, `warning(s) treated as errors` |
| **Test failures** | `FAIL`, `Expected`, `AssertionError`, `test suite failed`, `pytest`, `xunit` |
| **Build / compile** | `error TS`, `error CS`, `SyntaxError`, `CompileError`, `cannot find module`, `build failed` |
| **Type errors** | `Type .* is not assignable`, `TypeError`, `type mismatch` |
| **Dependency** | `Could not resolve`, `Module not found`, `No matching version`, `npm ERR!` |
| **Infra / flaky (not a code bug)** | `Received request to deprovision`, `runner has received a shutdown signal`, `timed out`, `ETIMEDOUT`, `ECONNRESET`, `connection reset`, `429 Too Many Requests`, `no space left on device`, `The operation was canceled` |

If the failure matches the **infra / flaky** row, it is almost certainly not something a code change can fix. Say so plainly, point to the transient signal in the log, and recommend re-running the job rather than inventing a code fix - fabricating changes for an infra flake wastes the user's time and can mask the real issue.

### Step 6: Present findings

Group by job:

```
## CI Failures for PR #<number>

### Job: <job name> ❌
**Failed step:** <step name>

**Errors found:**
1. **<error type>** in `<file>`: <description>
   - Proposed fix: <what to do>
```

Fix guidelines:
- **Formatting:** run the formatter locally, not manual edits.
- **Unused vars:** prefix with `_`.
- **Tests / build / types:** read the source before proposing changes.
- **Dependencies:** update lockfiles or add missing packages.
- **Workflow errors:** propose the YAML edit.

### Step 7: Auto-apply high-confidence fixes (local only)

After diagnosis, apply high-confidence fixes locally without waiting for extra approval (unless the user asked for diagnose-only):

- Formatting-only fixes (`stylua`, `prettier`, `black`, `ruff format`, etc.)
- Mechanical lint with deterministic outcomes (e.g. `_` prefix for unused vars)
- Obvious typo/name mismatches where logs and source agree
- Missing test updates when failure and expected behavior are explicit

When auto-fixing:
1. Make the minimal change.
2. Re-run the most relevant local command(s).
3. Summarize what changed and what now passes.

Do not auto-apply low-confidence fixes (broad refactors, ambiguous behavior, risky dependency upgrades). Present options and ask first.

### Step 8: Wait for commit/push approval

After local fixes validate, ask:

> "I've applied the high-confidence fixes locally. Want me to commit and push these changes?"

Do not commit or push until the user confirms.

## Constraints

- Auto-apply high-confidence fixes locally after diagnosis unless the user wants diagnose-only.
- Do not commit or push without explicit approval.
- Always use `GH_HOST="$GH_HOSTNAME"` from Step 0.
- Prefer formatters/linters over manual style edits.
- If `gh auth status` shows the host is not authenticated, tell the user which `gh auth login -h <host>` to run and stop.
- Don't blindly re-run jobs to paper over real failures. But when the failure is a clear infra flake (see Step 5), recommending a re-run is the correct call - not a code change.

## Validation Checklist

- [ ] GitHub host auto-detected from origin
- [ ] All `gh` commands used `GH_HOST="$GH_HOSTNAME"`
- [ ] Findings grouped by job with clear error types
- [ ] Workflow files consulted when logs were ambiguous
- [ ] High-confidence local fixes applied where appropriate
- [ ] User asked before commit/push
- [ ] No secrets or internal URLs leaked in output
