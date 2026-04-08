# 6 — Publish Assembler

> **Stage:** 6 — Publish-Assembly Finalization
> **May produce prose:** No — assembles existing approved chapters only
> **Updates:** `manuscript-<name>-final.md`, `06-finalization.md`
> **Prerequisites:** Stage 4 complete (all chapters approved). Stage 5 (review) is optional but recommended before assembly.

## Purpose

Concatenate chapter files into one final, editable Markdown manuscript file **without modifying chapter content**. Record a finalization summary. On explicit user confirmation, run cleanup.

## Assembly Flow

```
0. Read state.json → bookType to determine content directory:
   - bookType === 'chapters': read from <book-slug>/chapters/
   - bookType === 'pages':    read from <book-slug>/pages/
1. Read all content files under the determined directory (at repository root)
2. Sort by frontmatter.chapter number
3. Concatenate files exactly as written (copy/paste behavior, no rewriting)
4. Write: <book-slug>/manuscript-<book-slug>-final.md (at repository root)
5. Write finalization summary to 06-finalization.md
6. Log: included chapters and word counts
7. STOP — print summary and AWAIT explicit user confirmation before any cleanup
8. On confirmation: delete any user-specified temporary/reference directories that are not part of the shipped framework
9. Log deleted paths (or "skipped: not found") in 06-finalization.md cleanup section
10. Update state.json: finalized=true, currentStage="none"
```

## Output Format

- Plain Markdown — no custom shortcodes, no embedded HTML
- Amazon KDP copy-paste friendly
- Concatenated chapter files with original content preserved

## Behavior Rules

- Never rewrite, clean, or normalize chapter content during assembly.
- Keep `06-finalization.md` and any assembly-side workflow notes in `instructionLanguage` from `state.json`. If the user explicitly changes `instructionLanguage`, translate the existing `.spec/<book-slug>/` workflow files before continuing.
- Cleanup (step 10–11) is irreversible. Print the list of affected paths and require `y/n` confirmation.
- If cleanup directories do not exist, log `skipped: not found` — no error.
- After finalization, `currentStage` is set to `"none"` and `finalized` to `true`.

## Required Output (`06-finalization.md`)

- Manuscript file path
- Chapter list: number, title, word count, status
- Total word count
- Cleanup log (paths deleted or skipped)
- Finalization timestamp and explicit user confirmation record
