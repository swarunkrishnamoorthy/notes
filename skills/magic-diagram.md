---
name: magic-diagram
description: >-
  Interactive, tool-verified pipeline that turns an architecture diagram (plus optional
  EDD/spec) into Teach-me walkthrough OR Build plan - ask which mode every run. Ground
  every node and arrow against real [company] services ([deployment platform]/GitHub/[code search]/[internal search]);
  propose code-backed mappings and confirm with the user before assuming. Use when someone
  shares a diagram and wants to understand it, formalize labels, compare to production,
  or get an execution plan - including "walk me through this architecture", "what does
  this diagram mean?", "what's missing vs prod?", or "turn this into a build plan" even
  without a formal EDD+mermaid pair. Prefer edd-mermaid-to-plan when you already have a
  complete EDD AND mermaid diagram and want a strict batch plan with no interview.
  Prefer repository-overall-architecture-documentation to document an existing repo on
  disk. Build-plan output is plan-only - no EDD, no Jira.
metadata:
  version: 0.6.5
  status: installed
---

# magic-diagram - Diagram → Teach-me Walkthrough or Build Plan

Turn a rough architecture **diagram** (and, if available, an EDD/spec) into one of
two deliverables the user chooses **on every invocation**:

- **Teach me mode** - explain the system. For every component, data movement,
  transition, and endpoint, dig through real code and internal docs
  ([internal search]/Confluence/[code search]/GitHub) and give a brief, grounded description of
  what each piece is and how they talk to each other. No build plan.
- **Build plan mode** - compare the diagram to existing production code, find what
  is missing, align with the user on what needs to be built, then produce a
  detailed execution plan.

Treat the diagram and any doc as **claims to verify, never ground truth** - code and
internal tools are truth.

Run this skill **collaboratively and question-driven**, not autonomously. Interview the
user, verify each answer against real systems, and advance only on items that are
**user-confirmed** or **tool-verified** - guessing produces plans that fail review.

| Field | Value |
|-------|-------|
| Owner | @example-user |
| Required input | An architecture diagram (image or mermaid) |
| Optional input | EDD / spec (Google Doc, Confluence, pasted); named analog; domain context |
| Modes | **Teach me** (explain) · **Build plan** (gap analysis + execution plan) - asked every run |
| Output | Teach me: grounded walkthrough · Build plan: formalized diagram + Evidence Ledger + execution plan |
| Stance | Confirm high-confidence guesses; ask when unsure; **never guess** |

## Ask the mode first (every invocation)

Before doing anything else, ask the user which mode they want (`AskQuestion`:
**Teach me** / **Build plan**). Do not assume - the same diagram supports both modes
with very different effort. See [references/phase-0-mode-select.md](references/phase-0-mode-select.md).

## How to read the diagram (arrows and shapes)

Two defaults drive interrogation. Each is a **starting hypothesis to research and
then confirm**, never a settled conclusion:

- **Every arrow/edge is communication.** Treat it as a data flow, RPC call,
  endpoint, or event/queue message between two components. Find the real contract
  (proto method, REST endpoint, topic) and direction, then confirm with the user.
- **Every shape (box/rectangle/circle/node) is a real thing.** Treat it as either
  an existing [company] **service** or a [company] **framework/infra primitive** ([entity service],
  [queue service], Sendr, Temporal, runtime-config, rate-limiter, …). Resolve the label to
  the real component, then confirm with the user.

If a shape or arrow doesn't fit either default (an actor/team, a manual step, an
external system), say so and confirm that too.

**Contracts live on the mermaid, not just the ledger.** Every redraw (Teach-me,
Build-plan, or diagram-only): **boxes name the entity/component** (a noun);
**arrows name the action/operation** (a verb). Use the shortest name that still
conveys meaning (`operationName`, not `lib.shared.v3.operationName`). No
implementation details on boxes (paths, keys, payloads). Unlabeled sibling
arrows are unfinished. See
[references/diagram-labels.md](references/diagram-labels.md).

## Rules that govern every phase (read first)

1. **Answer from code first.** Check whether real code answers the question with high
   confidence before asking the user.
2. **Offer, then confirm.** Present a high-confidence, code-backed answer as a
   proposal and ask the user to confirm - don't silently assume it.
3. **Low confidence ⇒ ask, never guess.** Don't invent a service, endpoint, table,
   or flow.
4. **Verify with an internal tool whenever possible.** Confirm shapes/names against
   the real artifact (proto/schema/[deployment platform]/[entity service]), never from memory or a doc.
5. **Prefer asking the user over trusting wikis/docs.** When a doc and the user (or
   the code) disagree, the doc loses.

Use the host's **`AskQuestion`** tool for every confirmation/decision checkpoint so
the user can answer in one round-trip.

## Workflow

**Read the linked reference file when you enter each phase** - it holds the full
procedure. Don't start a phase before its predecessor's exit condition is met.

Phase 0 picks the mode. **Phases 1-3 are the shared grounding spine both modes run**
- you can't teach or plan a diagram you haven't grounded. The finish then branches
on the chosen mode.

0. **Phase 0 - Mode select.** Ask the user: Teach me or Build plan. Carry the choice
   through the run.
   → [references/phase-0-mode-select.md](references/phase-0-mode-select.md)
1. **Phase 1 - Tool preflight.** Probe vital tools, show a ✓/✗ checklist, and get the
   user's go / degraded-mode decision before Phase 2.
   → [references/phase-1-preflight.md](references/phase-1-preflight.md)
2. **Phase 2 - Interrogate & match.** Build a node/edge inventory; apply the
   arrow/shape defaults; match each part to a real service (expand abbreviations; run
   a sibling / "did you mean?" search before calling anything new); user-confirm each.
   → [references/phase-2-interrogate.md](references/phase-2-interrogate.md)
3. **Phase 3 - Characterize.** For each component decide RPC / DB / event /
   internal-infra and verify its shape against a real artifact; fill the Evidence
   Ledger.
   → [references/phase-3-characterize.md](references/phase-3-characterize.md)

**Then branch on the chosen mode:**

- **Teach me →** explain each component, data movement, transition, and endpoint,
  grounded in code + docs. No plan.
  → [references/teach-me-mode.md](references/teach-me-mode.md)
- **Build plan →** formalize the diagram, run a gap analysis vs. production, align
  scope with the user, then produce the execution plan.
  → [references/build-plan-mode.md](references/build-plan-mode.md)

Deliver the result in the structure defined in
[references/output-and-validation.md](references/output-and-validation.md), and run
its validation checklist before finishing.

## Guardrails
- **Never guess.** Move forward only on what's user-confirmed or tool-verified;
  anything unverified is an open question, marked `[UNVERIFIED]`.
- **Name-exists ≠ usable** - verify the shape/scope/auth actually support the
  diagram's usage. An RPC that exists but can't take the needed param or auth is a
  *change*, not a reuse.
- **Resolve labels to real names** - a box labeled `FIS` may be a different service
  in code; confirm the mapping before relying on it.
- **Boxes are entities; arrows are operations.** A box says what component it is;
  an arrow says what action it is. No implementation details on boxes. Shortest
  leaf name (`operationName`, not `lib.shared.v3.operationName`). Unlabeled
  arrows are unfinished.
- **Code/tool wins** over any doc or wiki; record the discrepancy.
- **Ask early and often** - prefer a round of questions over a plausible invention.
- **Build plan mode is plan only** - no EDD authored, no Jira created.
