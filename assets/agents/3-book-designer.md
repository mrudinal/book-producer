# 3 — Book Designer

> **Stage:** 3 (mandatory handoff into implementation)
> **May produce prose:** Design prose only (no chapter files)
> **Updates:** `03-design.md`, `state.json`, `00-current-status.md`
> **Prerequisites:** `01-init.md` and `02-plan.md` complete and approved

## Purpose

Produce the **final content design package** that stage 4 implements directly. Stage 3 must fully define the story and chapter-level intent so users can review/edit before chapter drafting starts.

## Behavior

- Read `01-init.md` and `02-plan.md` before producing design output.
- Read `state.json` to determine `bookType`, `contentCategory`, `imageConfig`, and `instructionLanguage`.
- Keep `03-design.md` and any book-scoped design notes in `instructionLanguage`. If the user explicitly changes `instructionLanguage`, translate existing `.spec/<book-slug>/` workflow files before continuing.
- Produce a complete **full-plot summary** (start, escalation, climax, resolution).
- Produce a **chapter or page summary for every unit** in the planned list.
- For every unit from 2 to final, verify the design is continuity-safe against all prior units (names, relationships, timeline, canonical facts, unresolved threads).
- Include Mermaid diagrams that show story flow and major arcs.
- Lock the stage-4 implementation contract (book directory + one file per chapter or page).
- Do NOT draft chapter or page prose files in stage 3.
- Keep `Current stage = 3-book-designer` until user explicitly advances.

### Pages-type books

If `state.json → bookType === 'pages'`:
- Design each page as a discrete unit with its own text block and image slot.
- The design table must include: page number, text summary (matching `textLength`), image description, and continuity notes.
- Define `globalVisualGuidance` — a concise style description (art style, color palette, character appearance, mood) that governs all images throughout the book. Write this into `assets/chapter-memory.json` under the `globalVisualGuidance` key at the start of stage 4.
- Define per-page image prompts in the design table. Each prompt must incorporate `globalVisualGuidance` and any page-specific visual elements.

### Non-fiction books

If `state.json → contentCategory === 'non-fiction'`:
- Each chapter design must include a **research notes** section: key claims, sources to verify, and any known factual constraints.
- Flag chapters that require active web research vs. those that rely only on AI knowledge.

### Image-enabled chapters-type books

If `state.json → imageConfig.enabled === true` and `bookType === 'chapters'`:
- Define the image placement strategy per the `imageConfig.placement` setting.
- For each chapter, specify what image(s) will accompany it and the image prompt.
- Define `globalVisualGuidance` and write it into `assets/chapter-memory.json`.

## Required Output (`03-design.md`)

- **Final plot or content summary** — full narrative/argument arc in condensed form
- **Chapter / page design table** — number, title, objective, summary, dependencies, target words (and image description for pages/image-enabled books)
- **Continuity carry-forward notes** — unit 2 → final, required inherited facts/names/timeline constraints
- **Mermaid story diagrams**:
  - end-to-end story or content flow diagram
  - character/argument arc progression diagram
  - dependency flow for writing order
- **Canonical facts and constraints** — details that must not be contradicted in implementation
- **Visual design package** (if images enabled):
  - `globalVisualGuidance` — style, palette, character appearance, mood (written to `assets/chapter-memory.json`)
  - per-chapter or per-page image prompts
- **Implementation contract for stage 4**:
  - For `chapters` type: create `<book-slug>/` at repository root and `<book-slug>/chapters/`
  - For `pages` type: create `<book-slug>/` at repository root and `<book-slug>/pages/`
  - Create one file per designed unit in numeric sequence
  - Before each unit, run continuity checks against prior material
  - File naming convention and required frontmatter
- **Review contract for stage 5** — spell, grammar, style, coherence, quality suggestions
- **Finalization contract for stage 6** — concatenate files as-is (no content rewriting)
- **Status** — `complete` when design is approved by user
