---
name: pr-create
description: Create or refresh a GitHub pull request from the current branch, write a clear title and description from the diff, and add a specific test plan. Use when opening a PR, updating PR information, or asking for a PR test plan.
disable-model-invocation: true
---

# Create PR, fill information, plan tests

Use this workflow to create a PR or refresh an existing PR after a push.

## Preconditions

- The GitHub CLI is authenticated.
- The current branch is not the default branch.
- The working tree is clean.
- The branch has an upstream remote.

Stop and report if any precondition fails.

## Workflow

1. Detect the repository host from `origin` and use that host consistently.
2. Find an open PR for the current branch.
3. Create one if none exists. Never force-push.
4. Read the repository's PR template and use its headings when present.
5. Read the branch diff, commit history, and relevant issue or ticket.
6. Write a short, plain-language title under about 72 characters.
7. Describe the user-visible change and the important implementation boundaries.
8. Write a test plan derived from the changed behavior.
9. Re-read the live PR immediately before updating it. Preserve sections a human
   edited, including previews and uploaded media.
10. Update the PR title and body through the GitHub API.

## Test plan

Each case needs setup, action, expected result, and evidence.

- Unit or integration behavior: name the exact test and command.
- API behavior: name the request and response fields to check.
- Data behavior: name the table or store and the expected result.
- Browser behavior: list the user steps and visible result.
- Negative paths: include errors, empty input, retries, and missing data when
  the diff handles them.
- Missing prerequisites: write `TODO` instead of inventing IDs, credentials,
  endpoints, or results.

Mark a case complete only if it ran in the current session.

## Writing style

- Use concrete, conversational language.
- Do not repeat the title in the body.
- Do not describe unchanged behavior as a change.
- Keep summary, changes, and testing distinct.
- Preserve human-written title and rationale sections.
- Never put credentials, tokens, cookies, or private URLs in the PR.
