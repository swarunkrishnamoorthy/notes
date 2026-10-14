---
name: docs-markdown
description: >-
  Format Markdown so tables and text paste cleanly into Google Docs - pipe tables
  become native Docs tables on paste/import. Use when creating copyable handoff content,
  oncall status tables, executive summaries for Docs, or any Markdown tables meant for
  Google Docs. Trigger on "google docs table", "paste into docs", "oncall handoff table",
  "copyable table". Not for /status-report session recaps - use status-report instead.
---

# Docs Markdown

Create Markdown that pastes or imports into Google Docs cleanly, especially tables.

## Core Rule

Prefer Markdown tables for Google Docs handoff/report content. Google Docs converts pasted or imported Markdown tables into native Docs tables. Keep the Markdown simple: no HTML inside cells, no multiline cells, and no nested lists inside tables.

## Table Format

Use pipe tables with:

- One header row.
- One separator row.
- One physical line per row.
- Short headers.
- Escaped pipe characters (`\|`) inside cell text.
- `<br>` only when a visual newline inside a cell is truly needed.

Example:

```markdown
| State | Item | Details |
|---|---|---|
| Done | Airflow SLA miss | Source: [Slack thread](https://example.com). Cleared and retried; rerun succeeded. |
| Ongoing | Privacy ticket | Source: [Slack thread](https://example.com). Needs owner to fill out dataset/workflow ownership. |
```

## Google Docs Copy Rules

- Put links inline as Markdown links: `[label](url)`.
- Keep each row concise; long paragraphs make Docs tables hard to scan.
- Avoid raw HTML tables unless the user explicitly wants an HTML page.
- Avoid code fences around the final table if the user will paste into Google Docs; code fences paste as code, not a table.
- If delivering through a local file, create a `.md` file with the table and optionally a `.html` preview only if requested.

## Status Labels

When formatting operational handoffs, prefer a small fixed status vocabulary. If the caller gives a required vocabulary, use it exactly.

For oncall handoffs using Done/Mitigated/Ongoing:

- `Done`: fully resolved or informational with no follow-up.
- `Mitigated`: impact stopped, but monitoring or cleanup remains.
- `Ongoing`: active investigation, owner needed, verification needed, or explicit follow-up remains.

## Validation

Before finalizing a Markdown table:

- Confirm every row has the same number of columns.
- Confirm no unescaped `|` appears inside cell text.
- Confirm links are Markdown links, not bare URLs, unless bare URLs are requested.
- Confirm the final answer or file does not wrap the table in a fenced code block when the user wants to paste it into Google Docs.
