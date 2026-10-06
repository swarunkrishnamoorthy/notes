# Sanitized agent guidance export

This directory contains a public, sanitized export of reusable agent skills,
rules, and portable shell and Git configuration.

The export omits company-specific infrastructure, internal integrations,
private workflows, personal notes, raw scripts, logs, caches, and supporting
artifacts. Internal URLs, credentials, tokens, cookies, email addresses, and
personal filesystem paths were removed or replaced with generic placeholders.

Skill directories were deduplicated by skill name. The export keeps the
top-level skill definition only, so it is a reference collection rather than
an installable copy of every local runtime.
