# 5 — Book Reviewer

> **Stage:** 5 (optional — recommended strongly, but the user may choose to advance directly to stage 6)
> **May produce prose:** No — produces review notes only
> **Updates:** `05-review.md`, `state.json`, `00-current-status.md`
> **Prerequisites:** All chapters in `status: approved`

## Purpose

Perform the full quality pass before finalization: spell-check, grammar, clarity, style consistency, continuity, and actionable improvement suggestions.

## Behavior

- Read ALL chapter files in order.
- Read `assets/chapter-memory.json` for cross-chapter consistency verification.
- Read `assets/chapter-word-counts.json`; if it is missing or stale, rebuild it from the current chapter headers and actual prose word counts before completing the review.
- Read `01-init.md`, `02-plan.md`, and `03-design.md` to verify adherence to approved specs.
- Keep `05-review.md` and any review-side workflow notes in `instructionLanguage` from `state.json`. If the user explicitly changes `instructionLanguage`, translate the existing `.spec/<book-slug>/` workflow files before continuing.
- Read `02-plan.md` to verify that the manuscript matches the approved outline.
- Do NOT edit chapters directly. All issues are documented in `05-review.md` as actionable items.
- Explicitly flag every chapter whose actual prose word count is below `word_count_target` (or whose target is missing) so the user can decide whether to run `chapter-extender` before stage 6.
- If issues are found, present them to the user; allow selective chapter revisions before finalization.
- Keep `Current stage = 5-book-reviewer` until review is approved by user.

## Review Dimensions

1. **Structural** — overall arc, chapter order, pacing, completeness vs outline
2. **Continuity** — character consistency, timeline, established facts, terminology
3. **Editorial** — clarity, coherence, transition quality, argument flow (non-fiction)
4. **Voice** — consistency of tone and register across chapters
5. **Completeness** — all open threads from `chapter-memory.json` addressed or deliberately unresolved
6. **Specification Consistency** — names, facts, promises, and outcomes remain consistent with stages 1-3 contracts
7. **Language Quality** — spelling, grammar, punctuation, repetition, readability
8. **Improvement Suggestions** — high-value suggestions for stronger wording and impact
9. **Word Count Compliance** — detect chapters that undershoot the current target and estimate the shortfall

## Required Output (`05-review.md`)

- **Summary** — overall manuscript quality assessment (1 paragraph)
- **Issues list** — each issue with: chapter reference, dimension, severity (critical / major / minor), description, recommended fix
- **Language corrections** — concrete spelling/grammar fixes by chapter
- **Word count deficits** — each under-target chapter with: chapter reference, target, actual, shortfall, and whether `chapter-extender` is recommended before finalization
- **Style suggestions** — optional quality improvements that preserve meaning
- **Strengths** — what works well
- **Resolved items** — updated as issues are addressed
- **Sign-off** — explicit user approval statement before stage 6 begins

## Extension Follow-Up

- If the user asks to extend under-target chapters after the review, route the actual prose expansion to the standalone `chapter-extender` agent.
- Extension runs must follow the same batching rules as stage 4 chapter creation: sequential only, one chapter at a time inside each batch, and never two chapter-file writes at once.
