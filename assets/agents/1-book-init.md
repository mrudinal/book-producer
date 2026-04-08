# 1 — Book Init

> **Stage:** 1 (mandatory)
> **May produce prose:** No
> **Updates:** `01-init.md`, `state.json`, `00-current-status.md`

## Purpose

Capture the full book concept, audience, genre, publishing intent, workflow configuration, and success criteria. Produce a clear, approved foundation before any planning or writing begins.

## Behavior

- Ask the user about: core idea/premise, target audience, genre and category, book length intent, desired quality level, publishing intent (Amazon KDP, personal, other).
- Capture language intent from the initialization request and user clarifications:
  - `instructionLanguage` — the language used for `.spec/<book-slug>/` files and all book-scoped workflow instructions
  - `mainLanguage` — the primary language of the book
  - `otherLanguages` — any additional languages that may appear in parts of the book
- Default `instructionLanguage` to the language of the user's first initialization prompt unless the user explicitly chooses another language in that same prompt.
- Save language intent in `state.json`. Language settings may be changed at any time; latest explicit user instruction wins.
- If the user explicitly changes `instructionLanguage` later, translate the existing `.spec/<book-slug>/` workflow files so the entire spec stays in one consistent instruction language.

### Book type and format

- Ask or infer `bookType`:
  - `chapters` — standard book with narrative or informational chapters (novels, essays, non-fiction, etc.)
  - `pages` — illustrated or image-paired book where each page is a discrete unit (children's books, picture books, illustrated guides)
- Ask or infer `contentCategory`:
  - `fiction` — invented narrative
  - `non-fiction` — factual, research-backed, or instructional content
- **`bookType` and `contentCategory` are locked once stage 2 (planning) begins. Warn the user clearly if they try to change either after stage 2 has started. To change them, a new book idea must be initialized.**
- For `pages` type: ask or infer `textLength` per page — `minimal` (1–3 sentences), `small` (1 short paragraph), `medium` (2–3 paragraphs), `large` (4+ paragraphs).
- For `pages` type: estimate `pageCount` based on the book concept, audience, and format:
  - Picture book / board book: typically 24–48 pages
  - Illustrated children's chapter book: typically 48–96 pages
  - Illustrated guide or coffee-table book: estimate from scope
  - Present the estimate to the user, explain the basis, and ask for confirmation or adjustment.
  - Save the confirmed or adjusted value to `state.json` as `pageCount`.
- Save `bookType`, `contentCategory`, and `textLength` to `state.json`.

### Image configuration

- Ask or infer whether images are needed:
  - Images are **always enabled** for `pages`-type books.
  - For `chapters`-type books, images are optional (illustrations, diagrams, covers).
- If images are enabled, capture `imageConfig`:
  - `strategy`: how images will be produced — `auto` (agent decides per image), `generate` (AI image generation), `download` (web search and download), `custom` (user-defined instructions), `skip` (no image production, placeholders only)
  - `placement`: where images appear — `per-page` (one per page, default for `pages` type), `end-of-chapter`, `on-event` (at story events), `custom`
  - `placementDescription`: free-text notes on placement rules if `custom`
  - `visualContinuity`: how visual consistency is maintained across images — `prompt-injection` (style description injected into every image prompt), `seed` (fixed seed for generator), `reference-image` (first image used as reference), `none`
  - `customInstructions`: any additional style or generation constraints
- Save `imageConfig` to `state.json`.

### Non-fiction research configuration

- If `contentCategory` is `non-fiction`, research support is automatically enabled.
- Ask or infer `researchConfig.strategy`:
  - `auto` — agent decides when to research based on content needs
  - `active-web` — web search for every factual claim before writing
  - `ai-knowledge` — rely on AI training knowledge, no active search
- Save `researchConfig` to `state.json`.

### General rules

- Document constraints and non-goals explicitly.
- Do NOT begin outlining, planning, or writing in this stage.
- Do NOT create stage-2 through stage-6 files.
- Keep `Current stage = 1-book-init` until user explicitly advances.

## Required Output (`01-init.md`)

- **Concept / premise** — 2–4 sentence description of the book's core idea
- **Audience** — who will read this; age range, interests, reading level
- **Genre and category** — primary genre, sub-genre, Amazon category target
- **Book length intent** — approximate word count, chapter count, or page count goal
- **Publishing intent** — Amazon KDP, personal use, other
- **Tone and voice** — intended register, POV, style notes
- **Language tracker** — instruction/spec language, main language, and additional languages present
- **Workflow configuration** — bookType, contentCategory, textLength (if pages), pageCount estimate (if pages), imageConfig summary, researchConfig summary
- **Success criteria** — what a finished, approved manuscript looks like
- **Non-goals / out of scope** — what this book is explicitly not
- **Open questions** — anything unresolved before planning can begin
- **Status** — `complete` when all fields are populated and user has approved
