---
name: scenario-test
description: Plans behavior-first tests and test cases across dependencies. Use for /scenario-test, write tests, add tests, update tests, fix failing tests, unit tests, integration tests, component tests, e2e tests, Cypress specs, regression tests, [internal platform] integration tests, scenario testing, test case generation, coverage gaps, or test quality review.
---

# Scenario Test

Design tests that prove behavior, dependency effects, and user/API contracts.

## When To Use

- Any request to plan, add, update, review, or generate tests.
- Unit, integration, component, e2e, Cypress, [internal platform], scenario, regression, or coverage-gap requests.
- Requests to decide which behaviors, dependencies, or edge cases tests should cover.

## Workflow

If the target area is missing, ask for it before proceeding.

1. Select mode and read the matching reference before generating cases:
   - **General** (default for unit tests, unknown stacks, broad planning, or non-web/non-[internal platform] targets): read [general-testing.md](general-testing.md).
   - **[internal platform] integration tests (C#)**: read [[internal platform]-integration.md]([internal platform]-integration.md). C# unit tests stay in General mode.
   - **Web e2e tests (TypeScript/Cypress)**: read [web-e2e-cypress.md](web-e2e-cypress.md) and use the `cypress` skill for planning/review guidance.
   - If the target spans backend and frontend behavior, build a General dependency map, then run Web mode plus [internal platform] only for C#/.NET [internal platform] integration targets; otherwise use General for backend test planning.
   - If the request lists exemplar repos or dirs without a narrower target, use their union as the target scope instead of asking.

2. Apply the universal test-case rules:
   - Test observable behavior, contracts, dependencies, permissions, state transitions, setup/cleanup, and failure modes.
   - Behavioral tests must cover dependent behavior, not only the immediate handler/component.
   - Target-gate exemplar-specific patterns: request-listed exemplars or nearby suites satisfy the gate; otherwise mark assumptions and non-applicable patterns instead of inventing selectors, APIs, service behavior, fixtures, or domain-specific cases.
   - If investigation reveals likely product, test, fixture, or tooling bugs, include an issue-report section with severity and evidence; create/update a markdown report only when requested.

3. Produce the requested artifact:
   - For planning: prioritized test cases.
   - For authoring: plan cases first, then implement and verify tests when the user explicitly asks to write, add, update, or fix tests.
   - For review: missing behavior gaps and bug risks first.

Bug severities: Critical = likely data loss, security issue, or always-failing shipped path; High = user-visible breakage, CI-blocking flake, or incorrect API contract; Medium = missing meaningful edge-case coverage or fragile test/tooling pattern; Low = cleanup, clarity, or non-blocking consistency issue.

## Output Format

Return one response with mode-specific details slotted into this structure:

1. Selected mode and target area.
2. Dependency map, [internal platform] call-chain research doc, or Cypress route payload.
3. Prioritized scenario test cases and explicit missing-behavior gap list vs exemplars. For Web and [internal platform] modes, use `exemplar dir | exemplar behavior | planned case | gap | assumption` when multiple dirs are surveyed.
4. Exemplar comparison for [internal platform]/Web modes; in General mode, name the nearest suite if found or state that none was found.
5. Verification plan and open assumptions.

## Validation Checklist

- [ ] Target area is explicit.
- [ ] Mode is selected correctly; General is the fallback.
- [ ] Dependent behavior is covered.
- [ ] Matching reference file was read.
- [ ] Specialized mode requirements are satisfied or explicitly marked non-applicable.
- [ ] [internal platform] mode produced a call-chain research doc before cases.
- [ ] Web/Cypress mode surveyed all request-listed exemplar dirs with a per-dir gap table.
- [ ] Potential bugs found during investigation were reported with severities.
