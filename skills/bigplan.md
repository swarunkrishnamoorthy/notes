---
name: bigplan
description: >-
  Create or refresh a navigable /bigplan workstream tree. Use when the user
  explicitly runs /bigplan, asks to break a plan into workstreams, or runs
  /bigplan refresh. Refresh mode verifies stale plan facts against the relevant
  source of truth, reconciles statuses, and updates parent rollups. Do NOT use
  for ordinary planning, design, or single-session work.
metadata:
  version: 0.5.0
---

# /bigplan - scaffold a project plan into a workstream/task tree

Turns a plan you already generated into a **navigable, resumable tree** that the
companion skill **`/start-task`** can execute against. This skill is
**manually invoked only** - it never runs on its own.

## Plan-tree conventions (shared with /start-task)

```
<plan-dir>/                              e.g. [agent config path removed]
├── README.md                           PROJECT node
├── parked-for-later.md                 parked project items/workstreams
├── workstream-<n>-<slug>.md            WORKSTREAM node
├── workstream-<n>-<slug>/              tasks for that workstream
│   ├── parked-for-later.md             parked workstream items/tasks
│   └── task-<m>-<slug>.md              TASK node
│       └── task-<m>-<slug>/            (only if the task has subtasks)
│           └── subtask-<k>-<slug>.md   SUBTASK node
└── references.md, decision-rationale.md, …   shared docs (read-only context)
```

**Every node file starts with a link table** (right under the H1), so each layer
navigates to the layer below it:

- **README.md** → `## Workstreams` table: `| ID | Workstream | Status | Plan |`
- **workstream-\*.md** → `## Tasks` table: `| ID | Task | Status | Plan |`
- **task-\*.md** (only if it has subtasks) → `## Subtasks` table: `| ID | Subtask | Status | Plan |`

Every project and workstream also links to its parked-work registry:

- `<plan-dir>/parked-for-later.md` stores parked project items and workstreams.
- `<plan-dir>/workstream-<n>-<slug>/parked-for-later.md` stores parked
  workstream items and tasks.
- Every task and subtask file has an inline `## Parked for later` section for
  deferred task details or child subtasks.

Parked entries never appear in active child tables.

**Stable IDs (how humans refer to nodes).** Every node gets a short ID in the
heading and in the parent table. Use these in chat and in `/start-task`:

- Workstream **n** → `WS<n>` (example: `WS1`)
- Task **m** of that workstream → `WS<n>-T<m>` (example: `WS1-T2`)
- Subtask **k** of that task → `WS<n>-T<m>-S<k>` (example: `WS1-T2-S1`)

Rules:

- Put the ID first in the H1: `# WS1-T2: Verify the seed against the query template`
- Put the ID in the parent table's first column, labeled `ID` (not `#`)
- Prefix each task summary with the ID: `1. **WS1-T2: Verify the seed:** …`
- IDs are stable. Do not renumber when inserting a task; append the next T number.
- `/start-task WS1-T2` must resolve to that node.

**Active status vocabulary:** `todo` · `in-progress` · `blocked` · `done`. Each
node also carries a `Status:` line near the top for machine reading. `parked`
may label a node linked from a parked registry, but it is excluded from active
status and completion rollups.

**Ownership rule (enforced by both skills): read up · write own · seed down ·
never write up.**

- The session working a node writes only that node's own file.
- Parent link/status tables are owned by the parent layer and are synced
  **top-down** by `/bigplan refresh` - a child NEVER edits an ancestor.

### Shared context lives high, task specifics live low

So `/start-task` can inherit everything by walking up, put durable, cross-cutting
facts in the **README** (`## Shared context`: repo path(s), git host, global
constraints like branch-naming / draft-PR rules, Jira project, key reference
docs) and workstream-wide facts in the **workstream** (service, in-repo
precedent, cross-team dependencies). Leave only node-specific detail in the task.

## Steps

1. **Locate the plan dir.** Use the path the user gives; else look under
   `[agent config path removed]` or the current dir. Confirm the target before writing.
2. **Read the existing plan** (the `README.md` or the generated plan doc).
3. **Detect whether it's already decomposed.**
   - **Already decomposed** - a `## Workstreams` table exists, or
     `workstream-*.md` files exist → **skip splitting.** Go straight to
     _normalize_ (step 6): ensure the README table, `## Shared context`, parked
     registries, and task-level parked sections exist and are consistent, and
     that each workstream file has a `## Tasks` table.
   - **Not decomposed** → step 4.
4. **Propose workstreams.** Split by **ownership / review boundary** (the unit that
   gets its own reviewing team + PR chain), longest-lead / cross-team work first.
   Aim for a handful, not dozens. **Show the proposed split and get confirmation
   before creating files.**
5. **Create workstream files.** One `workstream-<n>-<slug>.md` per workstream from
   the template below. Write/refresh the README `## Workstreams` table linking to
   each, and the `## Shared context` block. Create the project parked registry
   and one parked registry inside each workstream directory.
6. **Normalize + seed tasks.** For each workstream file ensure: Goal, a `## Tasks`
   table, workstream context, and `Status:`. Create `task-<m>-<slug>.md` subplans
   (in the workstream's subdir) for the tasks actually being worked on - seed from
   the plan; use `TODO` placeholders where unknown. Add an inline
   `## Parked for later` section to every task and subtask. Do not fabricate
   technical facts.
7. **`/bigplan refresh [target]` mode** (when invoked as refresh): refresh
   current evidence and reconcile the plan tree. The target may be a project,
   workstream, task, subtask, direct path, stable ID, title, or an unambiguous
   project inferred from the current workspace.
   - Print `Refreshing <project>: <ID> <title>. Scope: <target and affected nodes>.`
     before querying or editing.
   - Resolve the target before querying. If several nodes match, list their IDs
     and ask the user to choose.
   - Read the project `README.md`, `plan.md`, `decisions.md`, `references.md`,
     project parked registry, target ancestors, workstream parked registry,
     target tasks, linked subtasks, and only the referenced sections needed.
   - Extract facts that can become stale: statuses, completion criteria,
     blockers, dependencies, next actions, branches, commits, pull requests,
     checks, releases, package versions, runtime assertions, data counts,
     ownership, dates, and external handoffs.
   - Build a focused evidence plan from those facts. Query only the sources
     needed to verify them. Use GitHub for merged code and checks, the owning
     configuration system for configuration, deployment tools for deployed
     state, and package feeds, Jira, logs, metrics, databases, [code search], or
     [internal search] search when the plan claim requires them. Never use [internal search] chat.
   - Keep an evidence ledger with the claim, observed value, source, observation
     time, and durable identifier or link. A merged PR does not prove a deploy,
     and a successful build does not prove an image or package was published.
   - If a source is unavailable, try a supported equivalent. If none works,
     label the fact unverified and preserve the prior value.
   - Update the minimum affected set: the target, changed ancestors, descendants
     whose evidence changed, directly affected siblings, parked registries,
     `references.md` for changed source facts, `decisions.md` only for durable
     decisions, and `plan.md` only when scope or milestones changed.
   - Reconcile statuses bottom-up: `todo` means no execution evidence,
     `in-progress` means actionable work remains, `blocked` means a hard
     dependency prevents progress, and `done` requires the node's completion
     criteria plus current evidence. Do not mark work done from a merged PR
     alone when runtime proof, a handoff, or another completion condition is
     required.
   - Keep parked work outside active rollups. Never park or unpark without an
     explicit user decision. Preserve stable IDs, links, reasons, resume
     conditions, and history.
   - Append a concise refresh entry to every changed node, update the project's
     `Updated:` date when present, and summarize aggregate changes on ancestors.
   - Re-read edited files, confirm child statuses match parent tables, search for
     stale contradicted facts, inspect the diff, and run the project refresh
     script so `.projects/INDEX.md` reflects the result when that script exists.

This refresh mode is the only sanctioned upward status propagation. It runs
from the owning top-level session, not from a task session.

Park or unpark work only after an explicit user decision. Preserve stable IDs,
plan files, history, reason, and a concrete `Resume when` condition. Moving an
item to a parked registry removes it from the active parent table. Unparking
restores it to the active table without renumbering.

**Preserve existing prose.** On an already-rich plan, only insert/refresh the top
table, `Status:`, `## Shared context`, parked-work links/sections, and required
parked registries; never rewrite the user's design content. Confirm before
overwriting anything non-trivial.

## Templates

### README.md (project node)

```markdown
# <Project> - plan

Status: in-progress

## Workstreams

| ID  | Workstream | Status | Plan                                             |
| --- | ---------- | ------ | ------------------------------------------------ |
| WS1 | <name>     | todo   | [workstream-1-<slug>.md](workstream-1-<slug>.md) |

## Goal

<one-paragraph goal>

## Shared context

- **Repo(s):** <path> (<git host, e.g. [internal host removed]>)
- **Constraints:** <branch naming, draft-PR policy, gh --hostname, …>
- **Jira project:** <KEY>
- **Reference docs:** [references.md](references.md), …
- **Parked for later:** [parked-for-later.md](parked-for-later.md)
```

### workstream-<n>-<slug>.md (workstream node)

```markdown
# WS<n>: <name>

Status: todo
Parent: [README.md](README.md)
Parked for later: [parked-for-later.md](workstream-<n>-<slug>/parked-for-later.md)

## Tasks

| ID       | Task   | Status | Plan                                                       |
| -------- | ------ | ------ | ---------------------------------------------------------- |
| WS<n>-T1 | <task> | todo   | [task-1-<slug>.md](workstream-<n>-<slug>/task-1-<slug>.md) |

## Goal

<what this workstream delivers>

## Context

- **Service / area:** <…>
- **In-repo precedent:** <path(s) to the closest existing pattern>
- **Dependencies:** <cross-team / cross-workstream blockers>
```

### task-<m>-<slug>.md (task / subtask node)

```markdown
# WS<n>-T<m>: <title>

Status: todo
Parent: [workstream-<n>-<slug>.md](../workstream-<n>-<slug>.md)

## Goal

<one or two sentences - what "done" means>

## Read first

- <the parent workstream + any reference sections that matter>

## Current state

<what exists on master / open PRs / what's stale - the ground truth>

## Steps

1. <step> (link subtasks here with a ## Subtasks table if it splits further)

## Dependencies

<hard blockers; what must land first>

## Constraints

<node-specific rules beyond the project-wide ones>

## Tickets

<Jira / PR references>

## Parked for later

Parked items do not affect this task's status or completion.

| ID  | Item             | Reason | Resume when | Plan |
| --- | ---------------- | ------ | ----------- | ---- |
|     | _Nothing parked_ |        |             |      |

## Progress log

<!-- appended by /start-task; newest last -->
```

### Project parked registry

```markdown
# <Project> - parked for later

Parent: [README.md](README.md)

Parked items do not affect active status or completion percentages.

| ID  | Item             | Reason | Resume when | Plan |
| --- | ---------------- | ------ | ----------- | ---- |
|     | _Nothing parked_ |        |             |      |
```

### Workstream parked registry

```markdown
# WS<n> - parked for later

Parent: [workstream-<n>-<slug>.md](../workstream-<n>-<slug>.md)

Parked items do not affect the workstream's status or completion percentage.

| ID  | Item             | Reason | Resume when | Plan |
| --- | ---------------- | ------ | ----------- | ---- |
|     | _Nothing parked_ |        |             |      |
```

## Notes

- **Opt-in by design:** installing this changes no other conversation. It acts only
  when you invoke `/bigplan`. Keep it out of CLAUDE.md and hooks.
- Pairs with **`/start-task`**, which consumes exactly this structure.
