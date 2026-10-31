---
name: pr-loop
description: Review an existing implementation with a /code-review subagent on a different model, apply only High/Critical/must-fix findings, and re-review until those are gone or 2 rounds elapse. Use when the user runs /pr-loop or asks to loop review-and-fix until Highs are cleared.
disable-model-invocation: true
---

# PR Loop

Close High/Critical/must-fix review findings on the current implementation. Do not expand scope. Do not commit unless the user asks.

Do **not** use Bugbot, `/review-bugbot`, `/review-security`, or `/review`.

## Setup (once)

1. Work in the active repo root. If there is no git repo, stop and ask which project to use.
2. Default scope is **branch changes** (committed + staged + unstaged vs the repo default base). Use uncommitted-only if the user says so.
3. If the user named a PR or branch, check it out first. Ask before stash. Review that PR / branch, not some other diff.
4. Cap: **2** rounds unless the user set another number.

Treat as must-fix: **Critical**, **High**, **must-fix**, **P0**, and any finding the reviewer marks blocking. Ignore Medium/Low/P2+ unless they block a must-fix. If a later round reopens a Medium as High, it becomes in-scope.

## Loop

Each round is **spawn review → classify → fix or stop → report**.

### Review - always a subagent

**First action of every round:** spawn exactly one foreground `generalPurpose` subagent to run `/code-review`. Do not review in the parent. Do not compute a substitute review.

The subagent **must** use a **different model** than the current (parent) model. Never pass `inherit`. Never reuse the parent's slug.

When in doubt, use **Opus high** or **Sol high**:

| Parent is already | Subagent model |
|---|---|
| Opus high (`claude-opus-5-thinking-high`) | Sol high (`gpt-5.6-sol-high`) |
| Sol high (`gpt-5.6-sol-high`) | Opus high (`claude-opus-5-thinking-high`) |
| Anything else / unclear | Opus high (`claude-opus-5-thinking-high`) |

Launch:

- `description`: `Code review`
- `subagent_type`: `generalPurpose`
- `model`: the slug from the table above
- `run_in_background`: `false`

Put this in the subagent prompt (include the `/code-review` command verbatim):

```text
Run /code-review on this scope only. Do not edit files.

/code-review:
Review the relevant code with a code review mindset. Prioritize bugs, behavioral regressions, security issues, and missing tests. Findings must be the primary focus, ordered by severity. Do not make code changes unless the user explicitly asks for them.

Full Repository Path: <absolute repo root>
Scope: <branch changes vs default base | this PR: <url or number> | this branch: <name>>
Diff: branch changes (or uncommitted changes if the user asked)

Return a severity-ordered markdown table: Severity | Location (file:line) | Finding.
No code changes.
```

If the subagent fails, retry once with the same prompt and a still-different model (swap Opus high ↔ Sol high). If it fails again, stop and tell the user.

### Classify

From the reviewer's table, keep only must-fix rows. Deduplicate by file + finding.

**Stop (success)** if that list is empty. Report rounds used and "no High/must-fix remaining". Mention ignored lower-severity items in one line each.

**Stop (blocked)** if:

- The same must-fix (same file + same issue) appears in two consecutive rounds after a fix attempt
- **2 rounds** are done and must-fix items remain: tell the user **there's still more to be done** and list every remaining review issue to be fixed. Do not start a third review.
- The reviewer cannot complete after its allowed retry

### Fix

Apply only the current must-fix list. Smallest change that addresses each item. Do not drive-by refactors, extra files, or new features. Do not "fix" ignored lower-severity items.

If a must-fix is a false positive or needs a product decision, skip it, say so in the round report, and do not count it as remaining.

### Report (after every fix round)

For each must-fix you touched, at most two sentences:

```markdown
**Round N/2**
- **<short issue>** → <how we fixed it>
- **<short issue>** → skipped (<why>)
Must-fix left: N. Next: review | stop (reason).
```

Then start the next review unless a stop rule fired.

After a successful final review (no must-fix left), say so in one line. No extra fix list.

## Out of scope

- Bugbot, Security Review, `/review`, `/loop` timers, `/autopilot`, PR comment replies
- Parallel / Best-of-N implementations
- Tests, CI, or lint unless a must-fix requires them
- Medium/Low cleanup after the loop succeeds
