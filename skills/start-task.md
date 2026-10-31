---
name: start-task
description: >-
  Start executing a specific task or subtask from a /bigplan plan tree in a fresh
  session. Given a pointer to one task/subtask, walk the plan hierarchy top-down
  (project README → workstream → task → subtask) to assemble the full working
  brief automatically - no pasted prompt needed - then begin implementing. On
  progress, update ONLY the target node's own file; never edit an ancestor. Use
  when the user points at a task to work on or runs /start-task WS1-T2 or
  /start-task <task>. Do NOT use for creating plans (that is /bigplan) or for
  general questions.
metadata:
  version: 0.3.1
---

# /start-task - resume a task with full inherited context

Replaces the manual "generate a prompt to paste into a new session" step. Point
this at a task or subtask; it reconstructs the complete brief by reading up the
tree, then executes. **Manually invoked only.**

Assumes the plan follows the **/bigplan tree conventions** (project `README.md`
with a `## Workstreams` table → `workstream-<n>-<slug>.md` with a `## Tasks`
table → `workstream-<n>-<slug>/task-<m>-<slug>.md`, statuses `todo | in-progress
| blocked | done`). The project and each workstream have a
`parked-for-later.md`, and every task/subtask has an inline
`## Parked for later` section. If the pointed-at plan doesn't have that shape,
say so and suggest running `/bigplan` first.

## Steps

1. **Resolve the target node.** Accept a file path, a stable ID (`WS1-T2`,
   `WS1-T2-S1`, `WS1`), a description like "workstream 1 task 2", or a task
   title. Resolution:
   - stable ID → look it up in the README / workstream / task tables (`ID`
     column) and in H1 prefixes; this is the preferred pointer;
   - direct path → use it;
   - name/number → find it via the workstream `## Tasks` table (and README
     `## Workstreams` table);
   - **ambiguous or not found** → list candidate IDs (`WS1-T1`, `WS1-T2`, …)
     from the tables and ask which one. Do not guess.
   - **once resolved, print a clickable Markdown link to the target node's
     file as the first line of user-visible output**, before the working
     brief or any other explanation. Use the human title as the link text and
     the absolute local path as the target, e.g.
     `[WS2: Pin current RGP behavior](/abs/path/workstream-2-rgp-baseline.md)`.
     If a workstream was named and you then start a child task, print both
     links (workstream, then the task you are executing).
2. **Assemble context top-down (read-only - never edit while reading).** Read, in
   order:
   1. **README.md** - Goal + `## Shared context` (repo path, git host, global
      constraints, Jira project).
   2. **project `parked-for-later.md`** - scope explicitly excluded from active
      completion.
   3. **the parent workstream** - Goal + Context + Dependencies.
   4. **the workstream's `parked-for-later.md`** - parked tasks and workstream
      details.
   5. **the target task** (and, if a subtask was named, its parent task then the
      subtask).
   6. **shared reference docs** linked along that chain (e.g. `references.md`,
      eng-plan) - only the sections the nodes point to.
3. **Synthesize the working brief** (the shape of a good hand-written kickoff
   prompt, generated not pasted): **Goal · Repo/host/constraints · Read-first ·
   Current state · In-repo precedent · Steps · Parked scope · Dependencies ·
   Tickets.** Print it as a compact header (≈8-12 lines) so the context is
   visible, then **proceed - do not ask the user to paste anything.** If the
   target is parked, stop and ask whether to unpark it; do not silently change
   scope. Otherwise set the node `Status:` to `in-progress` in its own file.
4. **Execute the task** per its Steps, honoring the constraints inherited from the
   tree (e.g. git host, draft-PR policy, branch-naming - these come from
   `## Shared context`, not hardcoded here). If a hard dependency is unmet, do the
   buildable part and record the block.
5. **Update ONLY the target node's own file** as work progresses and at the end:
   - set `Status:` (`in-progress` / `blocked` / `done`);
   - ensure an inline `## Parked for later` section exists;
   - after an explicit user decision, move non-essential task details or child
     subtasks into that section with their stable ID, reason, resume condition,
     and plan link;
   - append a **Progress log** entry under `## Progress log`: today's date, what
     changed, branch/PR links, key decisions, open items, and the recommended
     next step.
6. **Never write upward.** Do not edit the parent workstream file or the README -
   not even their status tables. If your change makes a parent table's Status
   cell stale, say so and tell the user to run **`/bigplan refresh`** from a
   top-level session to propagate it. If the target task itself must be parked,
   tell the user to run `/bigplan refresh` so it can update the workstream
   registry and all affected ancestors. Do not edit sibling nodes either.

Parked items do not block the task, count as incomplete work, or affect its
completion. Keep them visible in the inline section and do not execute them
unless the user explicitly unparks them.

## Progress log entry format

```markdown
### <YYYY-MM-DD> - <short summary>

- Status: <in-progress|blocked|done>
- Did: <what landed - files, behavior>
- PR/branch: <links>
- Decisions: <non-obvious choices>
- Open / next: <what remains; the next step for whoever resumes>
```

## Guardrails

- **Read up, write own, never write up.** The whole point of the tree is that a
  fresh session inherits context downward and reports status by writing its own
  node - the parent _reads_ it, the child never edits the parent.
- **Don't re-plan.** If the task's Steps are wrong or missing, flag it and update
  _this node's_ Steps; don't silently redesign the workstream.
- **Park without loss.** Never delete deferred scope. Preserve its stable ID,
  reason, resume condition, plan link, and existing history.
- **Link the task file first.** After resolving the target, always print a
  clickable Markdown link to that node's `.md` so the user can open the
  source of the brief. Do this on every `/start-task`, including workstream
  pointers.
- **Opt-in:** acts only when invoked. Pairs with **`/bigplan`**, which produces
  the structure this skill consumes.
