---
name: grill-me
description: Interview the user about a plan or implementation request before coding. Use when the user says "grill me", asks to stress-test a plan, or gives an ambiguous implementation request that needs a clear plan first.
---

# Grill Me

Before implementation, interview the user until the task has a clear, agreed plan.

## Question Flow

Use Cursor's `AskQuestion` tool for each question.

- Ask one focused question at a time.
- Pick the highest-impact unresolved decision.
- Provide 2-4 concrete options.
- Put the recommended option first and label it `(Recommended)`.
- Include a concise trade-off for each option when the choice is meaningful.
- Wait for the user's answer before asking the next question.

If the answer can be found by reading the repo, inspect the code instead of asking.

## Coverage

Continue until these are clear:

- Goal and user-facing behavior
- Scope and out-of-scope items
- Existing code paths to touch
- Data model, API, or contract changes
- Edge cases and failure behavior
- Test plan
- Rollout or migration concerns, if relevant

## Closeout

When the plan is clear:

- Summarize the decisions.
- Present the implementation plan.
- Wait for approval before editing files.
