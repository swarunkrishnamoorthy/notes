---
name: md-to-google-doc
description: Convert a markdown file into a Google Doc with proper formatting - real headings, real tables, hyperlinks, inline code, lists, and optional monospace post-pass for IDs/timestamps. Use when the user wants to publish a markdown report (status update, incident writeup, design doc, RFC, etc.) to a Google Doc.
---

# md-to-google-doc

Render a local markdown file into a Google Doc using the Docs API. Produces real Google Docs structure (Heading 1/2/3, real tables with bold header rows, real hyperlinks, real inline code) - not a plain-text dump.

## When to use

- Publishing a recurring report (oncall summary, weekly status) to a shared "living" doc
- Posting an incident or alert investigation writeup
- Sharing an RFC or design doc draft
- Any time you have a `.md` file and need it to look polished in Google Docs

## Prerequisites

1. **gcloud auth** with the Drive scope (default for the google MCP):
   ```bash
   gcloud auth login
   ```
   The script reuses the same token the `user-google` MCP uses (`gcloud auth print-access-token`).

2. **Edit access** on the target Google Doc - the authenticated user must be able to edit it.

## Sandbox fallback: gcloud unavailable (gdrive_write MCP)

In some sandboxes (e.g. deCLAWd) `gcloud auth print-access-token` fails because the gcloud wrapper can't source its virtualenv (`~/.config/gcloud/virtenv/bin/activate: Operation not permitted`). The Docs-API script below cannot run there. **Do not keep retrying `gcloud auth login`** - it won't fix a sandbox restriction.

Instead, fall back to the **`gdrive_write` MCP server** (separate OAuth, works in the sandbox):

- Read the markdown file, then call `create_document` with `content_type: "text/markdown"` and the file contents. Drive renders the markdown into native Docs formatting (real headings, tables, lists, links, code blocks) at upload time.
- `folder_id` is **required** - default to **`15n1TpEiGytn22q_JbYRa25SGWGl1IQKS`** unless the user names another folder.

**This fallback is create-only and lossy.** Unlike the script it CANNOT:
- write into a caller-specified existing doc (`--doc-url` / `--doc-id`) - it always creates a **new** doc;
- honor `--mode replace` / `insert-before` / `append`;
- apply the monospace post-pass (PD IDs, JIRA tickets, timestamps);
- match the script's heading map (the markdown renderer uses `#`→H1, `##`→H2; the script uses `#`→Title, `##`→H1).

Note: `update_document` does **not** render markdown - it writes literal plain text (`#`, `|` shown verbatim). Only `create_document(content_type="text/markdown")` renders.

## Inputs

| Input | Required | Default | Notes |
|---|---|---|---|
| `--md PATH` | yes | - | Path to the source markdown file. |
| `--doc-url URL` *or* `--doc-id ID` | yes | - | Target Google Doc. URL form (`https://docs.google.com/document/d/<id>/edit?...`) is parsed automatically. |
| `--mode` | no | `insert-before` | One of `replace`, `insert-before`, `append`. |
| `--insert-before TEXT` | only for `insert-before` mode | `<!-- INSERT HERE -->` | Marker text in the target doc to insert above. Falls back to append if not found. |
| `--monospace-regex REGEX` | no | repeatable | Extra regex patterns to render in Roboto Mono (e.g. PD IDs, timestamps). |
| `--no-default-monospace` | no | off | Disable the built-in monospace patterns (PD IDs, JIRA tickets, PDT timestamps). |
| `--title TEXT` | no | - | If set, also updates the Google Doc title. |
| `--font-size N` | no | `11` | Body text font size in points. Headings keep their default sizes (TITLE=26, H1=20, H2=16, H3=14). |
| `--dry-run` | no | off | Print the planned ops without calling the API. |

## Modes

- **`replace`** - wipes the doc body and writes the MD fresh. Best for living docs that should always reflect the latest report (e.g. a "Latest oncall summary" doc).
- **`insert-before`** *(default)* - finds the first occurrence of `--insert-before TEXT` and inserts the new content immediately above it. Useful for keeping history (place `<!-- INSERT HERE -->` at the top of the doc; each run prepends a new dated section above it).
- **`append`** - appends to the end of the doc.

## Default monospace post-pass

After the main render, the script applies Roboto Mono (`weightedFontFamily.fontFamily = "Roboto Mono"`) to spans matching these built-in regexes (toggle off with `--no-default-monospace`):

| Pattern | Rationale |
|---|---|
| `Q[A-Z0-9]{13,15}` | [incident system] incident IDs (`Q3WM7NHWNM7NPU`) |
| `[A-Z]{2,5}-\d{1,6}` | JIRA tickets (`AIM-24`, `ADS-1234`) |
| `\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}\s?(?:AM\|PM)?\s?P[DS]T` | PDT/PST timestamps emitted by oncall reports |

You can add more with `--monospace-regex` (repeatable).

## Formatting rules

- `# h1` → Title (largest, no underline)
- `## h2` → Heading 1 (bold, top spacing)
- `### h3` → Heading 2
- `#### h4` → Heading 3
- Body text: 11pt by default (configurable with `--font-size`); headings keep Google Docs' default sizes (TITLE=26, H1=20, H2=16, H3=14)
- Paragraph spacing: 6pt after, line spacing 1.15 (avoids the "wall of text" feel)
- `**bold**`, `*italic*`, `` `code` `` → preserved with proper text styles
- `[text](url)` → blue underlined hyperlink (`#1155CC`, `link.url` set)
- Bare URLs (`https://…`) → autolinked to the same blue underlined style, including inside table cells (via markdown-it `linkify`)
- `` `code` `` spans → Roboto Mono, light gray cell background
- Bulleted / numbered lists → real bullets via `createParagraphBullets`
- Markdown tables → real Google Docs tables. Header row bold + light gray fill. 6pt vertical / 8pt horizontal cell padding.
- `---` (horizontal rule) → empty paragraph (visual breather, no visible line - keeps the doc uncluttered)
- Fenced code blocks (```` ``` ````) → shaded, bordered Roboto Mono paragraph block

## Workflow

### Step 1: Authenticate

```bash
gcloud auth login
```

If you're already signed in for the `user-google` MCP, this is a no-op.

### Step 2: Run the converter

```bash
uv run skills/md-to-google-doc/scripts/md_to_gdoc.py \
  --md path/to/report.md \
  --doc-url 'https://docs.google.com/document/d/<DOC_ID>/edit' \
  --mode replace
```

For a recurring "living" doc (e.g. weekly oncall summary, weekly status report):

```bash
uv run skills/md-to-google-doc/scripts/md_to_gdoc.py \
  --md report-2026-04-20-to-2026-04-26.md \
  --doc-url 'https://docs.google.com/document/d/<DOC_ID>/edit' \
  --mode replace
```

The script prints progress (`wiped doc: N chars`, `inserting block 1/42 ...`, `applied N monospace styles`) and the final doc URL.

### Step 3: Verify

Open the Google Doc and confirm:
- Headings render as Heading 1 / 2 / 3 (use the document outline to verify)
- Tables are real tables (you can edit cells, not a single text block)
- PD IDs and JIRA tickets render in monospace
- Links are blue and clickable

If anything looks off, re-run with `--dry-run` to inspect the planned ops.

## Error handling

| Scenario | Action |
|---|---|
| `gcloud auth` fails | Run `gcloud auth login` (drive scope is included by default). If it fails with `virtenv/bin/activate: Operation not permitted` (sandbox restriction), switch to the gdrive_write MCP fallback above - don't retry gcloud. |
| `403` on `documents.batchUpdate` | The authenticated user doesn't have edit access. Share the doc with edit permission, or sign in as a user who has it. |
| `404` on doc | The doc ID was parsed wrong. Pass `--doc-id` explicitly. |
| Marker not found (`insert-before` mode) | Script falls back to append and prints a warning. |
| Tables look misaligned | Inspect the source MD - pipe characters inside cells need to be escaped (`\|`). |
| Doc has multiple tabs | The script writes to the default body. Multi-tab targeting is not supported in v1. |

## Calling this skill from another skill

Other skills can chain in a final "publish" step:

> ### Step N (optional): Publish to Google Doc
>
> ```bash
> uv run skills/md-to-google-doc/scripts/md_to_gdoc.py \
>   --md report-<START>-to-<END>.md \
>   --doc-url <doc_url> \
>   --mode replace
> ```

The default monospace patterns already cover PD IDs, JIRA tickets, and PDT/PST timestamps emitted by typical oncall and incident reports.

## Limitations / non-goals (v1)

- Images are not uploaded. Image references (`![alt](url)`) are dropped with a warning.
- Footnotes, definition lists, and HTML blocks are rendered as plain text.
- Nested tables are not supported (rare in real reports).
- The script writes to the default body of single-tab docs.
- Comments and suggestions on the doc are not affected.
