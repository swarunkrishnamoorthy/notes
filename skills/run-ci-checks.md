---
name: run-ci-checks
description: >-
  Discover required PR checks from `.github/workflows` and config-as-code, cache
  a manifest of local-safe commands that mirror CI, run them from repo root, and
  iterate fixes until included commands pass. Maps each `check_name` to workflow/job
  when discoverable; marks secret-dependent or deploy checks as not locally reproducible.
  Use when the user says "run CI locally", "pre-push validation", "match required checks",
  "what does CI run?", or wants merge-blocking gates on a laptop before push.
  Prefer fix-ci when a PR check is already red on GitHub and you need job logs.
---

# Run CI checks locally

Approximate merge-blocking CI on a developer machine: discover what GitHub runs, cache **local-safe** commands, run them in order, fix failures, and stop claiming success where the check cannot be mirrored.

## Placement

- **Personal install (recommended):** `[agent config path removed]` - available across all repos.
- **Per-repo local:** `.cursor/skills/local/run-ci-checks/` - gitignored, not checked into the repo.

## Part 1 - Discover and cache required + local-safe commands

### 1. Identify required checks

1. Read config-as-code if present, for example:
   - **[company] [internal product]:** `.github/repo.yml` → `pull_requests.required_status_checks` → each `check_name`.
2. For each `check_name`, map to **workflow file + job name** (and `workflow_call` / reusable workflow if the job uses `uses:` to another workflow file or repo).
3. If a check comes only from an external reusable workflow or hosted runner with secrets, **do not invent a local command** - record "not locally reproducible" with a short reason.

### 2. Enumerate workflows

- List `.github/workflows/*.yml` (and `.yaml` if any).
- For each file, record: **workflow `name`**, **`on:`** triggers, **path filters** (`paths` / `paths-ignore`), and whether it is **`workflow_call` only** (no `push`/`pull_request`/`workflow_dispatch`).

### 3. Derive local commands

From **in-repo** steps (`run:` blocks, `uses:` actions that wrap obvious commands):

- **Include** when equivalent exists without undeclared secrets or production side effects: install, lint, format **check**, typecheck, unit tests, package builds used in CI.
- **Prefer** exact scripts from `package.json`, `turbo.json` / Turbo pipelines, `Makefile`, or documented repo commands when they match CI - **do not guess** package names or flags.
- **Exclude** (list under "CI-only / skipped" in the manifest): deploy, artifact upload, Slack/notifications, merge-queue-only behavior, steps needing cloud credentials or undeclared secrets, Chromatic publish, Docker push, preview environments, etc.

### 4. Cache file (manifest)

Write **one** machine-local artifact (default paths; pick one format):

- `.cursor/skills/local/run-ci-checks/local-ci-manifest.md`, or
- `.cursor/skills/local/run-ci-checks/local-ci-manifest.json`

> **Convention:** All skill-generated local files go under `.cursor/skills/local/<skill-name>/`. Gitignore this directory in every repo.

The manifest **must** include:

- **Last update:** ISO timestamp.
- **Git refs used:** `git rev-parse HEAD` (optional) and **inputs hash**:
  `git log -1 --format=%H -- .github/workflows .github/repo.yml`
  (extend the path list if other config defines required checks).
- **Required checks** → suggested local command(s), or **not locally reproducible** with a one-line reason.
- Optional: **ordered run list** (copy-paste block) - install → lint/format check → types → unit tests → builds.

Schema and example skeleton: [reference.md](reference.md).

### 5. Staleness (skip re-parse)

1. Compute current **workflows config hash**:
   `git log -1 --format=%H -- .github/workflows .github/repo.yml`
   (add paths if your repo uses another required-check source).
2. If the manifest exists and its stored hash **equals** the current hash, **reuse the manifest** and say briefly that workflows/config are unchanged.
3. If missing, hash mismatch, or the user **forces refresh**, re-run Part 1 and overwrite the manifest.

## Part 2 - Run, fix, iterate

1. **Load** the manifest; if missing or refresh forced, run Part 1 first.
2. **Run** only commands marked local-safe, in **dependency order** (install → lint/format check → typecheck → test → build), from **repo root** unless a workflow step sets an explicit `working-directory`.
3. **On failure:** fix the minimum needed for that command; **re-run** from that command (or from install if dependencies changed) until all **included** local commands succeed.
4. **Required checks with no local equivalent:** state explicitly that they were **not** run - do not claim they passed.
5. **Project standards:** follow `.ai/rules/creator-hub-standards.md` (or equivalent), documented Node/tool versions, and repo rules.

### Large suites (E2E, full Cypress)

- Offer **scoped** runs (single spec, affected package, Turbo filter) when the change is localized.
- Label the result as **partial validation** - not a substitute for full critical E2E or hosted checks.

## Guardrails

- Do not run steps that need **undeclared secrets**, or that **publish / deploy / mutate production or shared infra**, unless the user **explicitly opts in** - those checks cannot be safely mirrored locally.
- Do not claim "CI will pass" or "all required checks are green" if any required check is **external-only**, **secret-dependent**, or **not in** the manifest's local list.
- Do not pretend a skipped check succeeded.

## Success criteria

1. Refresh vs reuse the manifest using the workflows/config hash.
2. Map required `check_name` entries to workflows and jobs where possible, including reusable workflow edges, and document gaps honestly.
3. Run and fix in a tight loop with clear boundaries on what **can** and **cannot** be mirrored locally.
