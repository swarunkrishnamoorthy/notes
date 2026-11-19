# Export manifest

- Export date: 2026-11-18
- Source: user-managed Cursor skills
- Output: sanitized reference documents for public sharing

## Included

- Generic planning, review, documentation, presentation, testing, and PR
  workflows
- The existing generic rules and `deck-review` reference bundle
- A sanitized `pr-create` workflow, which supersedes the old PR information
  workflow

## Omitted

- Company-specific infrastructure, data systems, repositories, and
  internal integrations
- Deployment, observability, on-call, and credential-broker workflows
- Personal notes, topic databases, evaluation runs, logs, caches, and generated
  artifacts
- Cursor built-in skills that are not user-managed skills

## Sanitization

- Removed internal URLs, hostnames, channel IDs, user IDs, credentials, tokens,
  cookies, and personal filesystem paths
- Replaced company-specific names and tools with generic terms where a workflow
  was useful outside the original environment
- Removed stale built-in exports that are not present in the current user-managed
  Cursor skill tree

## Safety check

- This export is intended for public review and is not an installable mirror of
  the private skill environment.
