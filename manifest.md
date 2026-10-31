# Export manifest

- Export date: 2026-10-06
- Source: local Cursor, Claude, Codex, and agent skill/rule configurations
- Output: sanitized reference documents for public sharing

## Included

- Skills: 84 deduplicated top-level definitions
- Rules: 15 generic rules and guidance files
- Configuration: sanitized zsh and Git examples

## Omitted

- Company-specific infrastructure and data systems
- Internal integrations, deployment systems, observability systems, and on-call workflows
- Private repositories, personal notes, performance records, and topic databases
- Raw supporting files, scripts, logs, caches, and generated artifacts

## Sanitization

- Removed internal URLs and hostnames
- Removed credentials, tokens, cookies, email addresses, and personal paths
- Replaced company and internal product names with generic placeholders where a skill was retained
- Replaced the local user identity with a generic placeholder

## Safety check

- This export is intended for public review and is not an installable mirror of the local skill environments.
