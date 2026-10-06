---
name: review-pr
description: >-
  Take a pull request the user provides, merge it onto latest master in a
  separate worktree, verify every review comment against the code, and explain
  them as a summary table (issue, verified, recommendation) followed by detail
  on each item. Use when the user runs /review-pr or asks to "go through the
  comments on this PR", "explain the PR comments", or "tell me which comments to
  address". Works on github.com and GitHub Enterprise. Read-only toward the PR:
  never posts, replies, or resolves anything.
disable-model-invocation: true
---

# Review PR Comments

Turn a PR's pile of review comments into a decision list: what each comment says, whether it is true, and whether to act on it.

## Inputs

- A PR URL or number. If only a number is given, use the current repo's `origin`.
- Parse host, owner, repo, and number from the URL. [company] work is usually on `[internal host removed]`.

## Ground rules

- Read-only toward the PR. Do not post comments, reply, resolve threads, or push.
- Do not edit the user's current checkout. Any merge or test run happens in a worktree at `[agent config path removed]`.
- Verify before you claim. Every "Verified" must come from reading the merged code, running something, or querying a real source. If a claim cannot be checked, say "Not verified" and why. Never present inference as fact.
- If a key tool is unavailable (GitHub auth, network), flag it at the top and say what could not be checked.

## Steps

### 1. Fetch the PR and every kind of comment

`gh api` needs `--hostname` on GitHub Enterprise, or it queries github.com and returns 404. `gh pr view` infers the host from the repo remote, but `gh api` does not.

```bash
gh pr view N --json title,body,headRefName,baseRefName,state,author,files,additions,deletions,mergeable
gh api --hostname HOST repos/OWNER/REPO/pulls/N/comments --paginate   > /tmp/prN_line.json
gh api --hostname HOST repos/OWNER/REPO/issues/N/comments --paginate  > /tmp/prN_issue.json
gh api --hostname HOST repos/OWNER/REPO/pulls/N/reviews --paginate    > /tmp/prN_reviews.json
```

Write to files and print with a short Python script (id, author, path, line, reply-to, body). Large output gets truncated in the terminal, so check that the last comment printed. Read the tail again if it was cut.

Collect all of these:

- Line comments (with file, line, and `in_reply_to_id` for threads)
- Top-level PR comments
- Review bodies (summary text, approvals, change requests)
- Bot output: coverage reports, security scans, CI summaries, failed AI reviews

### 2. Merge onto latest default branch in a worktree

```bash
git fetch origin <default> <head-branch>
git worktree add -b pr<N>-review [agent config path removed] origin/<head-branch>
cd [agent config path removed] && git merge origin/<default> --no-edit
```

- Report whether the merge was clean. On conflicts, list the files and stop merging; do not resolve them unless asked.
- Say what changed on the default branch and whether it overlaps the PR.
- Reuse the worktree if it already exists. Never use a sibling directory or the repo itself.

### 3. Understand the PR

- Read the PR body, then the diff against the default branch (`git diff origin/<default>...HEAD`).
- Summarize what the PR does in 2 to 4 bullets, in plain language. Say who calls the new code and whether users can see the effect today (for example, a shadow call behind a feature flag).

### 4. Verify each comment

For each comment, open the cited file and lines in the merged worktree and check the claim itself. Also check any claim about other code ("the sibling endpoints do X", "no test covers Y", "all N files under Z do W") by searching for it.

Give each comment one status:

- **Verified**: the code does what the comment says.
- **Partly verified**: the core is right, a detail is off. Say which.
- **Not verified**: could not be checked. Say why.
- **Wrong**: the code contradicts the comment. Say what the code does.

Also check related PRs the comments mention (open, merged, closed) with `gh pr view`. Do not compare designs you did not read.

### 5. Run the PR's tests on the merged result

Run the tests the PR added or touched, not the full suite, unless asked. Use a filter and report passed, failed, and total. If nothing runs (missing toolchain, long build), say so.

### 6. Write the answer

Use the structure below. Keep the reviewer's own numbering (`1`, `2`, `3`). Split a comment that holds two issues into `5a` and `5b`. Number any extra items after the last reviewer number, in one sequence.

Then give each item one recommendation:

- **Fix before merge**: real defect, or would mislead users or callers.
- **Decision needed**: depends on intent. Present it as Option 1 / Option 2 with a one-line pro and con each, and say which you recommend and why.
- **Fix (trivial)**: cheap cleanup, no discussion needed.
- **Your call**: valid but optional. Say what it costs.
- **Skip**: not worth doing now. Say why.

## Output format

```markdown
<one-line result: merged cleanly or not, PR link, where the worktree is, test result>

## What the PR does
- 2-4 bullets

## The comments
<who posted them, and whether they are human or AI-generated>

| # | Issue | Verified? | Recommendation |
|---|---|---|---|
| 1 | short plain-language issue | Yes / Partly / No | Fix before merge |
| ... | | | |

### Address before merge
- **1. Bold plain-language title.**
  - What the code does today and what a caller would observe.
  - The fix, in one or two sentences.
  - Anything that must change with it (tests, related code).

### Decisions for you
- **5b. Question in plain words?**
  - Fact 1, fact 2.
  - **Option 1:** ... Con: ...
  - **Option 2:** ... Con: ...
  - Recommendation and why.

### Cheap cleanups
- **6.** one line each

## Other items on the PR
N. Overlap or duplicate PRs, review-summary notes, coverage report, security scan,
   approvals, failed automated reviews. One numbered bullet each, with your view.

## Suggested order
1. ...

<offer to implement in the worktree, and name any decision still needed first>
```

The table comes first and stays short: one line per issue. Detail goes below it.

## Writing rules

- Lead with the consequence a reader would notice, then the mechanism if needed. Name things by what they do, and gloss an identifier the first time it appears.
- Use concrete numbers ("32 zero totals", "76% patch coverage, 39 lines missing") and round to 2 or 3 significant digits.
- Bullets over paragraphs. No em-dashes. Give the exact file, line, and identifier in the detail lines so the reader can check it.
- Show timestamps in California Pacific Time.
- Every PR mention is a clickable markdown link.
- For bot output (coverage, vulnerability scans), say whether it relates to the diff. Mark a guess as "my inference".
- Do not draft replies to the comments unless the user asks. If asked, reply in one or two lines ("Done." when that is the answer), and give the text in chat. Never post it.

## After the answer

- Do not change any code until the user picks items.
- When the user picks items, make the changes in the same worktree, run the affected tests, and leave the work uncommitted unless asked.
- Tell the user the worktree path and how to remove it (`git worktree remove <path>`).
