# 4 — Chapter Writer

> **Stage:** 4 (mandatory)
> **May produce prose:** Yes — this is the only stage that produces chapter or page files
> **Updates:** `<book-slug>/chapters/*.md` or `<book-slug>/pages/*.md`, `assets/chapter-memory.json`, `04-implementation.md`
> **Prerequisites:** Stages 1–3 complete and approved (no stage may be skipped)

## Purpose

Implement the final book design from stage 3 by materializing one file per designed chapter or page, while preserving design intent and continuity. Read `state.json` at stage entry to determine `bookType`, `imageConfig`, and `contentCategory` — these govern directory, file format, and image behavior throughout stage 4.

## Stage-Entry Execution Selection (mandatory)

When stage 4 starts:

- For non-Claude tools, if the user already specified chapter batching for this run, use it.
- For non-Claude tools, if not specified, ask once and require a choice:
  - all requested chapters in one uninterrupted run
  - one chapter at a time
  - grouped batches of N chapters (2, 3, 4, ...)
- For non-Claude prompts, warn that larger uninterrupted runs can exhaust model/API limits.
- Persist non-Claude preference in `.spec/<book-slug>/state.json` as `chapterBatchSize`.
- The user may change non-Claude batch preference at any time; latest explicit user instruction wins.

Claude chapter generation is also strictly one-by-one in numeric sequence for continuity safety.

## Implementation Setup (mandatory)

Before writing any content:
- Read `state.json` to determine `bookType`, `imageConfig`, `contentCategory`, and `instructionLanguage`.
- Keep `04-implementation.md`, continuity notes, and book-scoped workflow memory in `instructionLanguage`. Chapter/page prose still follows the approved book language and content design.
- If the user explicitly changes `instructionLanguage`, translate the existing `.spec/<book-slug>/` workflow files before continuing.
- For `chapters` type: ensure `<book-slug>/chapters/` exists at the repository root.
- For `pages` type: ensure `<book-slug>/pages/` exists at the repository root.
- Create one markdown file per unit defined in `03-design.md`.
- File naming format: `NN-<slug>.md` (e.g., `01-opening-hook.md`).
- Frontmatter title **must** follow the format `"Chapter N: <chapter name>"` (chapters) or `"Page N: <page title>"` (pages) so assembly order can be verified visually. The `chapter:` number field is the primary sort key.
- Canonical chapter header for chapters-type books is:
  - `chapter: N`
  - `title: "Chapter N: <chapter name>"`
  - `status`, `word_count_target`, `word_count_actual`, `assigned_agent`, `reviewer_notes`
  - any optional metadata such as `pov` or `heat_level` after the standard fields
  - Markdown H1 must be `# Chapter N: <chapter name>`
- If you revise or extend a legacy chapter that only has a short header (for example only `chapter`, `title`, and custom metadata), normalize it into the canonical header format before continuing while preserving any extra metadata fields.
- If `imageConfig.enabled === true`: read `assets/chapter-memory.json → globalVisualGuidance` before writing any image prompt. If `globalVisualGuidance` is not yet set, write it from the stage-3 design package before proceeding.

### Pages-type books

- Each page file contains: frontmatter + short text block (matching `textLength`) + image prompt block.
- Image prompt block format:
  ```
  <!-- IMAGE PROMPT
  Style: <globalVisualGuidance summary>
  Scene: <page-specific image description from 03-design.md>
  -->
  ```
- After writing the image prompt: if `imageConfig.strategy` is `generate` or `auto`, produce the image according to the strategy and record the reference in `image_references` in `chapter-memory.json`.
- If `imageConfig.visualContinuity === 'seed'`: record the seed used in `image_seeds` in `chapter-memory.json`.

### Non-fiction books

- Before writing each chapter: run any required research per `researchConfig.strategy` and `03-design.md → research notes` for that chapter.
- Record research sources and key facts verified in `04-implementation.md`.

### Image-enabled chapters-type books

- After each chapter is approved: if `imageConfig.enabled === true`, produce image(s) per `imageConfig.placement` and record references in `image_references` in `chapter-memory.json`.

## Pre-Write Loop (run before each chapter)

**Step 1 — Continuity check (delegate to `continuity-checker`):**
- Read `assets/chapter-memory.json` (all summaries + open threads)
- Read full text of chapters max(1, N-4) → N-1
- Validate both continuity and consistency before chapter N proceeds
- Output: `assets/chapter-N-entry-constraints.md` containing:
  - Facts that must hold in chapter N
  - Open threads that must be addressed or explicitly deferred
  - Tone and voice notes from recent chapters

**Step 2 — Arc planning (delegate to `chapter-arc-architect`):**
- Read `02-plan.md` chapter N description
- Read `assets/chapter-N-entry-constraints.md`
- Output: chapter N beat sheet (appended to `04-implementation.md`)

**Step 3 — Write chapter:**
- Read `assets/chapter-N-entry-constraints.md`
- Read chapter N beat sheet
- Read full text of chapters max(1, N-4) → N-1
- Read `assets/chapter-memory.json` summaries for chapters 1 → N-5
- Read `.spec/<book-slug>/assets/chapter-word-counts.json` when present so target counts stay aligned with the latest chapter header values
- Write `<book-slug>/chapters/NN-<slug>.md` (chapters type) or `<book-slug>/pages/NN-<slug>.md` (pages type) — use `bookType` from `state.json` (status: draft)

## Progression Rule (mandatory)

- Always write chapters in numeric order.
- Always complete chapter N before starting chapter N+1.
- Never write two chapter files simultaneously in any tool mode.
- For grouped or all-chapters runs, "uninterrupted" means continue automatically to the next chapter after chapter N is complete unless the user explicitly asks to pause.
- After each completed chapter, update `04-implementation.md` and `assets/chapter-memory.json` before moving forward.
- After each completed chapter, sync `.spec/<book-slug>/assets/chapter-word-counts.json` from the chapter headers and actual prose word counts. If the measured prose count differs from the JSON registry, update the JSON registry — do not silently rewrite the chapter frontmatter just to match the computed total.
- If the user explicitly requests a full chapter check, delegate that full pass to `continuity-checker` before continuing and validate chapter-by-chapter from 1 through the latest created unit.

## Post-Approval Update

After the user approves chapter N:
- Delegate to `continuity-checker` to update `assets/chapter-memory.json`:
  - Append summary entry for chapter N
  - Resolve any `open_threads` closed by this chapter
  - Flag any new `open_threads` introduced
- Update chapter frontmatter to `status: approved`

## Implementation Summary (required)

`04-implementation.md` must contain:
- Per-chapter implementation record: design summary vs implemented result
- Chapter file path and final word count
- Deviations from stage-3 design (if any) with reason
- Blockers and quality notes

## Chapter File Format

```markdown
---
chapter: N
title: "Chapter N: Chapter Title"
status: draft
word_count_target: 3000
word_count_actual: 0
assigned_agent: chapter-writer
reviewer_notes: ""
---

# Chapter N: Chapter Title

<!-- prose body -->
```

## Behavior Rules

- Never write two chapters simultaneously to the same file.
- Never overwrite a chapter with `status: approved` without user instruction.
- `04-implementation.md` receives a log entry for each chapter: beat sheet, word count, status changes.
- Keep `Current stage = 4-chapter-writer` until all designed chapter files exist, all chapters are approved, and user advances.
