---
name: goodreads
description: Maintains a personal to-read list by resolving rough book names into exact full titles and organizing them by topic/subtopic. Use when the user invokes /goodreads or asks to add books to their reading list.
disable-model-invocation: true
---

# My Books

Maintain the user's reading list at `[local path removed]`.

## Workflow

1. Treat the user's message as one or more book names to add. Accept newline-separated, comma-separated, or bulleted lists.
2. Read the existing `books.md` first. If it does not exist, create it from the template below.
3. For each requested book, find the exact full title and author(s). Use web search when the title is incomplete, ambiguous, or likely has a subtitle. Prefer authoritative sources such as publisher pages, author sites, library catalogs, WorldCat, Open Library, or ISBN records.
4. If multiple editions of the same book match, choose the most suitable edition, with a slight preference for recency when all else is equal. If two or more genuinely different books match the same rough name, ask the user to choose instead of guessing.
5. Avoid duplicates. Match existing entries by normalized title and author, ignoring case, punctuation, leading articles, and subtitle differences. If an existing entry has a less complete title, update that entry rather than adding another.
6. Add each new book as an unchecked markdown task using this format:

```markdown
- [ ] *Full Book Title: Subtitle* - Author Name
```

7. After adding books, regroup the entire list by topic and, only when useful, subtopic. Preserve all existing task states, notes, dates, and user-added text on each book line.

## Grouping Rules

- Keep the hierarchy compact: aim for 4-8 top-level topics across the whole file.
- Use subtopics sparingly: at most 2-4 subtopics under a topic, and only when there are several related books or a clear cluster.
- If a topic has only a few books, put them directly under the topic without subtopics.
- Prefer stable, broad categories over clever or overly specific ones.
- Categorize by the book's primary subject, not by format, popularity, or where the title came from.
- If a book reasonably belongs in multiple places, choose the most useful shelf for future browsing and do not duplicate it.

## File Template

```markdown
# My Books

To-read list maintained by `/goodreads`.

## Topic Name

- [ ] *Full Book Title: Subtitle* - Author Name
```

## Final Response

Briefly report which books were added, which rough names were skipped as duplicates, and whether any titles need user clarification.
