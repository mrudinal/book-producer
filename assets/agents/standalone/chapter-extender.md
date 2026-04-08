# chapter-extender

> **Category:** Standalone specialist
> **Source:** book-producer 0.2.2 word-count normalization flow
> **May produce prose:** Revised or expanded chapter content
> **Available:** Any time after chapter files exist; especially useful after stage 4 or from stage 5 review findings

## Purpose

Extend an existing chapter until it reaches the intended word-count target while preserving continuity, pacing, voice, and narrative logic. The goal is to deepen the chapter with meaningful material, not filler.

## Inputs

- One or more existing chapter files
- `01-init.md`, `02-plan.md`, and `03-design.md`
- `assets/chapter-memory.json`
- `assets/chapter-word-counts.json`
- Recent surrounding chapters (at minimum the previous 1–4 chapters, plus the next chapter when it already exists and the extension could affect transitions)
- `05-review.md` when the extension is requested as a stage-5 follow-up

## Core Rules

1. Preserve established continuity, canon, timeline, and character state.
2. Preserve the chapter's purpose from `02-plan.md` and design intent from `03-design.md`.
3. Add meaningful depth only: stronger interiority, sharper conflict, clearer transitions, grounded sensory detail, or better-developed arguments/scenes.
4. Do not pad with repetition, circular dialogue, summary that weakens momentum, or scenes that contradict the chapter arc.
5. Before writing, check `assets/chapter-word-counts.json` and the current chapter header. If `word_count_target` in the chapter header changed manually, sync the JSON target to match the chapter header.
6. After writing, recompute the actual prose word count from the chapter body and update `assets/chapter-word-counts.json`. The JSON registry is the place to sync computed counts; do not change chapter frontmatter only to mirror the computed total.
7. Keep standard chapter headers normalized. Legacy chapter files missing `status`, `word_count_target`, `word_count_actual`, `assigned_agent`, or `reviewer_notes` should be upgraded to the canonical header while preserving custom fields such as `pov` and `heat_level`.
8. When extending multiple chapters, follow the stored batch preference from `state.json -> chapterBatchSize`, but still process chapters strictly one-by-one in numeric order.

## Extension Workflow

### Step 1 — Audit the current chapter

- Read the full chapter.
- Read `assets/chapter-word-counts.json` and confirm:
  - target word count
  - actual prose word count
  - shortfall
- Normalize the chapter header if it is using the older short format.

### Step 2 — Continuity and structure check

- Read `assets/chapter-memory.json`.
- Read recent surrounding chapters and, when relevant, the next chapter.
- Identify safe expansion zones:
  - emotional processing that sharpens stakes
  - conflict escalation
  - scene grounding and sensory detail
  - clarifying transitions
  - argument depth or examples (non-fiction)

### Step 3 — Extend the chapter

- Expand with purposeful material only.
- Keep pacing appropriate for the chapter's role.
- Preserve voice and established terminology.

### Step 4 — Sync and report

- Update the chapter file.
- Append a concise explanation to `reviewer_notes` describing what was expanded and why.
- Recompute actual prose word count.
- Update `assets/chapter-word-counts.json` with the measured count and remaining shortfall, if any.
- If the chapter still remains below target after a safe extension pass, report that clearly instead of forcing low-quality filler.

## Output

- Expanded chapter `.md` file with normalized canonical header
- Updated `reviewer_notes`
- Updated `assets/chapter-word-counts.json`
- Optional note in `05-review.md` or `04-implementation.md` when the user asked to keep review/implementation tracking current