---
name: status-report
description: >-
  Produce a short executive-summary status report of the current conversation or task -
  what's done, what's left, and what's needed from the user. Adapts to context: in a
  /start-task session, reports the active task's steps/subtasks with live PR/CI status
  and a parent workstream rollup; in a project/multi-area session, groups todos by
  workstream with lettered headings and (% completion); in an ad-hoc session, provides
  a flat numbered list. Reports parked work separately without counting it toward
  completion. Use when the user invokes /status-report or asks to "jog my memory",
  "recap where we are", "what's been done", "what's left", "what do you need from me",
  or wants a quick session catch-up. Not for oncall handoff tables - use docs-markdown
  for Google Docs paste formatting.
---

# Status Report

Give the user a fast, executive-summary catch-up on the current work. This is a memory-jog, not a technical deep-dive.

## Context detection

Determine context in this order:

1. **Task session (active `/start-task` or single task node):**
   The session was launched with `/start-task`, has an active task file (`workstream-<n>-<slug>/task-<m>-<slug>.md` or subtask), or the user refers to a specific task ID (e.g. `/status-report WS3-T2`). → Use **Task session format**.
2. **Project / multi-workstream session:**
   The session spans multiple workstreams, is at the project root (`README.md`), or has no single active task. → Use **Workstream session format**.
3. **Fallback (single-topic session, no project / task tree):**
   An ad-hoc chat with no `.projects/` or `/bigplan` structure. → Use **Fallback format**.

## Output format

Always use **numbered lists** for todos (never bullets). Numbering restarts at `1.` under each heading so the user can reference items as e.g. `A3` or `2` in chat.

### 1. Task session (active task from `/start-task`)

Report the active task's concrete steps or subtasks, ground it with live PR/CI status, and show where it sits in the parent workstream.

```text
## WS<n>-T<m>: <Task title> (NN%)

Parent: [WS<n>: <Workstream title>](<path-to-workstream.md>)
Live state: `<branch>` · PR [#<pr>](<url>) (<draft|open|merged>, <CI summary>)

1. <not-done step or subtask> - not done
2. <in-progress step or subtask> - in review ([#123](<url>))
3. <blocked step or subtask> - blocked on <dependency>
4. <done step or subtask> ✅

### Workstream context: WS<n> (NN%)
1. WS<n>-T1: <task title> ✅
2. WS<n>-T<m>: <task title> (current) - in-progress (NN%)
3. WS<n>-T3: <task title> - todo

## Parked for later (excluded from completion)
1. [WS<n>-T<m>] <parked item> - resume when <condition>
```

- **Task heading:** `## WS<n>-T<m>: <Task title> (NN%)` (or subtask `## WS<n>-T<m>-S<k>: ...`). Completion `%` reflects active, non-parked steps or subtasks that are complete (✅).
- **Context & live state:** One or two compact lines with clickable link to parent workstream and live git/PR/CI status.
- **Task todos:**
  - If the task has child subtasks (`## Subtasks` table or subtask files): use the subtasks.
  - If the task has steps (`## Steps`): use the steps.
  - Numbered `1.`, `2.`, ... with incomplete/in-progress/blocked first, done (✅) last.
- **Workstream context rollup:** A compact summary of sibling tasks in the parent workstream (from the parent workstream's `## Tasks` table), highlighting the current task.
- **Parked for later:** Read the task's own inline `## Parked for later` section (and child subtasks). Do not pull unrelated parked items from other workstreams. If nothing parked: `1. Nothing parked.`

### 2. Workstream session (multi-workstream / project level)

Group todos **by workstream / area**. Each group is a lettered header (`A:`, `B:`, `C:`, …) ending in a **(% completion)**, followed by that group's numbered todos. For **each** todo:

- If it's **done**, append a green check **✅** at the end of the line.
- If it's **not done**, append a short status describing what's left (e.g. `- not done`, `- in review ([#221](<url>))`, `- blocked on <thing>`, `- partial: <detail>`).

```text
## A: <Workstream / area name> (NN%)
1. <not-done todo> - not done
2. <in-progress todo> - in review ([#123](<url>))
3. <done todo> ✅

## B: <Next workstream> (NN%)
1. ...
```

### 3. Fallback (single-topic session, no workstreams)

One short **numbered** list, **hard cap 15-20 items**: incomplete/in-progress/blocked first, then done items with a trailing **✅**. Compress if longer. No lettered headings needed.

### Parked for later

Always finish the work summary with a separate parked section:

```text
## Parked for later (excluded from completion)
1. [WS1] <parked item> - resume when <condition>
```

- **Task session:** Read from the task's inline `## Parked for later` section (and child subtasks).
- **Workstream / Project session:** Read parked work from the project `parked-for-later.md`, each relevant workstream's `parked-for-later.md`, and task/subtask `## Parked for later` sections.
- If an expected parked registry or section is missing, report that the parked inventory is incomplete instead of claiming nothing is parked. If all expected locations exist and nothing is parked, write:

```text
## Parked for later (excluded from completion)
1. Nothing parked.
```

Do not include parked or shelved work in active todo counts, blockers, workstream/task percentages, or the overall completion estimate. A workstream or task with all active work done is 100% even when it has parked items. Report a wholly parked workstream or task only in this section.

Always include a brief **Need from you** line when relevant:

```text
**Need from you:** <decision / input / approval - or "Nothing right now.">
```

## Ordering

- **Workstreams:** list in a stable, logical order (e.g. by dependency), assigning letters `A`, `B`, `C`, … in that order.
- **Within a workstream or task:** not-done / in-progress / blocked items first, then done (✅) items.
- **% completion:** estimate from the share of active, non-parked todos/steps/subtasks that are actually done (round sensibly, e.g. 60%). A fully-done workstream or task is 100%; a no-op / folded one is 100%.

## Rules

- **Numbered lists only, not prose or bullets.** One line per todo. No sub-paragraphs. Numbering restarts at `1.` under each heading.
- **Lettered headings for workstreams; node ID headings for tasks.** Format as `## A: <name> (NN%)` for multi-workstream, `## WS<n>-T<m>: <name> (NN%)` for tasks.
- **Executive altitude.** Report outcomes and status, not implementation detail. Include a technical specific only when it's essential to understanding a decision or blocker.
- **Be honest about state.** If something is partial, blocked, or failed, say so plainly - don't dress it up as done. `%` reflects real merge/commit state, not aspiration.
- **Green check means done-done.** Only append ✅ to an item that is genuinely complete (merged/shipped), not merely written or in review.
- **Parked means excluded, not blocked.** Keep parked work visible only in the parked section and include its resume condition when known.
- **Verify externally verifiable state from live sources** - PR/merge/review via `gh` or GitHub API; file content from the remote's latest default branch (fetch first); CI/deploy from their own systems. Always use clickable links for PRs (e.g. `[#387](https://...)`). If you cannot verify now, mark unverified (e.g. `- reported merged, unverified`) rather than guessing.
- **Ground it in the actual conversation / plan.** Base the report on what has really happened, not an idealized plan. Don't invent progress.
- **Read-only reporting.** `/status-report` is an observational skill. It never writes or updates task files, parent workstreams, or project READMEs (updating task files belongs to `/start-task` or `/bigplan refresh`).
- If the session has barely started or there's no real task yet, say so in one line instead of forcing the format.
