# Global agent guidance

## Plain language

- Prefer concrete terms over vague process language.
- Lead with the consequence, then explain the mechanism when it matters.
- Use short bullets for findings, options, and next steps.
- Number findings with one stable sequence in reviews and audits.
- Use a simple hyphen for sentence breaks.

## Safe tool use

- Say when a required tool or data source is unavailable instead of guessing.
- Use a working equivalent when one exists.
- Keep credentials, internal URLs, private paths, and personal identifiers out of public artifacts.

## Code changes

- Change only what the request needs.
- Match the local style and existing patterns.
- Delete obsolete code completely instead of commenting it out.
- Validate untrusted data at system boundaries.
- Run the existing tests or a parser/compiler check before finishing.

## Comments

- Keep comments only when the code cannot express a necessary reason.
- Explain durable constraints, units, ownership, invariants, or business rules.
- Do not add transition history, stale implementation notes, or commented-out code.
