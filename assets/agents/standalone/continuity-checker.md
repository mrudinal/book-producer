# continuity-checker

> **Category:** Standalone specialist
> **Source:** Research — manuscript QA practice
> **May produce prose:** Constraint documents and memory updates only
> **Available:** Any time — invoked by `4-chapter-writer` before and after each chapter

## Purpose

Cross-chapter continuity and consistency tracking. Maintains `assets/chapter-memory.json`, produces per-chapter entry constraints before writing begins, and validates that chapters do not contradict established facts, character states, terminology, world rules, or open threads.

When the user says `validate consistency`, route here.

Use two operating modes:

1. **Default memory-backed mode** — use `assets/chapter-memory.json` as the primary whole-book memory plus the recent sliding-window chapter text.
2. **Full chapter check mode** — when the user explicitly asks for a full chapter check, read the manuscript chapter-by-chapter from chapter 1 through the latest created chapter/page and validate continuity and consistency directly against the full text.

## What To Validate

- **Continuity** — unresolved threads, timeline progression, carry-over state, setup/payoff alignment, sequence dependencies
- **Consistency** — names, facts, descriptions, locations, world rules, character state, terminology, and canon details
- **Memory integrity** — whether `assets/chapter-memory.json` still matches the approved chapter/page content

## Default Pre-Chapter Mode (invoked before chapter N is written)

**Reads:**
- `assets/chapter-memory.json` — all summaries and open threads
- Full text of chapters max(1, N-4) → N-1 (sliding window)
- `assets/character-profiles.md` (if present)
- `assets/world-notes.md` (if present)

**Writes:** `assets/chapter-N-entry-constraints.md` containing:
- **Facts that must hold** — canonical facts established in prior content
- **Open threads to address** — unresolved plot/argument points due in or after chapter N
- **Tone and voice notes** — register, POV, style observations from recent chapters
- **Character state summary** — where key characters are emotionally and physically at chapter N's opening

File is overwritten each chapter cycle (not a permanent artifact).

## Post-Approval Mode (invoked after chapter N is approved)

**Updates `assets/chapter-memory.json`:**
- Appends new entry for chapter N with: summary, key_facts, open_threads, word_count
- Resolves `open_threads` entries closed by this chapter
- Flags new `open_threads` introduced by this chapter

## Full Chapter Check Mode (explicit user request only)

Use this mode when the user asks for a full continuity pass, full chapter check, full manuscript consistency validation, or equivalent wording.

**Reads:**
- `assets/chapter-memory.json`
- Full text of every created chapter/page from 1 through the latest created unit, in order
- `assets/character-profiles.md` (if present)
- `assets/world-notes.md` (if present)
- `01-init.md`, `02-plan.md`, and `03-design.md` when available to validate canonical intent

**Behavior:**
- Validate chapter-by-chapter in numeric order rather than relying only on the sliding window.
- Compare later chapter/page details against earlier established canon.
- Check whether `assets/chapter-memory.json` still matches what the approved files actually say.
- Report contradictions, drift, missing carry-over details, and stale memory entries explicitly.
- Do not rewrite chapter prose automatically.

**Writes:**
- A consistency validation report, normally under `assets/full-consistency-report.md` unless the active stage or user request specifies another destination
- Targeted updates to `assets/chapter-memory.json` only when the user asked to refresh memory or when Stage 4 post-approval maintenance requires it

## `chapter-memory.json` Schema

```json
{
  "version": 1,
  "globalVisualGuidance": "Watercolor palette, soft lines, warm tones — present for image-enabled books, null otherwise.",
  "chapters": [
    {
      "chapter": 1,
      "title": "Chapter Title",
      "status": "approved",
      "summary": "2–4 sentence summary.",
      "key_facts": ["Fact that must not be contradicted."],
      "open_threads": ["Unresolved element introduced here."],
      "word_count": 3240,
      "image_references": ["assets/images/ch1-spread.png"],
      "image_seeds": ["42"]
    }
  ]
}
```

`globalVisualGuidance` is set by stage 3 for image-enabled books; `null` for text-only books. `image_references` and `image_seeds` are populated by stage 4 for image-enabled books and are absent or empty for text-only chapters. When validating image-enabled books, check that `globalVisualGuidance` is present and consistent across all prompt blocks, and that `image_references` entries point to existing files.

## Rules

- Never edits chapter prose files.
- `chapter-memory.json` is append-only; existing entries are updated (status/threads), never deleted.
- If a contradiction is found with established facts, flag it in `chapter-N-entry-constraints.md` before writing proceeds. Do not silently allow inconsistencies.
- Default behavior prefers chapter-memory plus recent chapter text for speed.
- Full chapter-by-chapter validation runs only on explicit user request for a full check.
