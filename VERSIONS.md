# Versions

## 0.2.3

`0.2.3` introduces explicit instruction/spec language tracking so each book can keep its workflow memory in the same language as the first initialization prompt by default, while still allowing explicit overrides later.

### What changed in 0.2.3

#### Instruction/spec language tracking

- Added `instructionLanguage` to `.spec/<book-slug>/state.json`.
- Stage 1 now defaults `instructionLanguage` to the language of the first initialization prompt unless the user explicitly names another instruction/spec language in that same prompt.
- The book's prose language remains independently tracked through `mainLanguage` and `otherLanguages`.

#### Explicit overrides and status visibility

- Added `--instruction-language <language>` to `book-producer init`.
- `book-producer status` now surfaces `instructionLanguage` alongside the existing language tracker fields.
- Resume flows only change saved language settings when the user passes explicit language overrides, preventing accidental resets.

#### Framework instruction updates

- Installed agent instructions, templates, tool adapters, and docs now tell the AI to keep book-scoped specs, reports, and workflow notes in `instructionLanguage`.
- When the user explicitly changes `instructionLanguage`, the existing `.spec/<book-slug>/` workflow files should be translated before continuing so the spec stays internally consistent.

## 0.2.2

`0.2.2` standardizes chapter headers, adds a synced word-count registry, and introduces a dedicated extension flow for under-target chapters.

### What changed in 0.2.2

#### Standardized chapter headers

- Canonical chapter files now consistently use the full header shape:
  - `chapter`
  - `title: "Chapter N: ..."`
  - `status`
  - `word_count_target`
  - `word_count_actual`
  - `assigned_agent`
  - `reviewer_notes`
- The visible Markdown heading is standardized to `# Chapter N: ...`.
- Stage-4 guidance now tells the AI to normalize older short-form chapter headers before revising or extending those chapters, while preserving custom metadata such as `pov` or `heat_level`.

#### Word-count registry

- Added `.spec/<book-slug>/assets/chapter-word-counts.json`.
- The registry stores each chapter's target word count, measured prose word count, shortfall, sync timestamp, and status (`missing-target`, `under-target`, `meets-target`).
- If a user manually changes `word_count_target` in a chapter header, the registry should sync to that chapter header value.
- Computed prose counts are synchronized into the JSON registry instead of silently rewriting chapter frontmatter.

#### Chapter extension flow

- Added standalone `chapter-extender` for purposeful chapter expansion that preserves continuity and avoids filler.
- Added `book-producer orchestrate extend [slug] --tool <tool> --chapters ...` and `--under-target`.
- Extension batching reuses `chapterBatchSize`, but all extension writes remain strictly one-by-one in numeric order.

#### Stage-5 review updates

- Stage 5 now audits `chapter-word-counts.json`.
- Review output explicitly lists all under-target chapters and recommends extension follow-up where appropriate.
- Follow-up expansion work routes to `chapter-extender`, not `5-book-reviewer`, so review remains review-only.

## 0.2.1

`0.2.1` is the patch release that replaces the withdrawn `0.2.0` npm publish attempt. It keeps the 0.2.0 feature set and fixes CLI version reporting so `book-producer --version` matches the installed package.

### What changed in 0.2.1

- `src/cli.ts` no longer hardcodes the CLI version string.
- The CLI now reads the version from `package.json` through a dedicated runtime helper, preventing future drift between published package metadata and `book-producer --version`.
- Added a regression test to verify that the runtime version helper matches the repository `package.json`.
- Synchronized root package metadata for release prep, including the root `package-lock.json` version fields.

## 0.2.0

`0.2.0` adds book type selection, image support, non-fiction research mode, content categories, text length control, page count estimation, language tracking, and full-manuscript consistency validation. It closes the pages-vs-chapters path inconsistency across all stage agents, templates, status output, and documentation.

### What changed in 0.2.0

#### Book types and pages mode

- Added `bookType` field to `state.json`: `chapters` (default, standard narrative or informational books) or `pages` (illustrated books where each page is a discrete text + image unit — children's books, picture books, illustrated guides).
- Added `--type <chapters|pages>` flag to `book-producer init`.
- For `pages` type: init creates `<book-slug>/pages/` instead of `chapters/`. All stage agents, templates, status output, and the assembler now resolve the correct directory from `state.json → bookType`.
- `bookType` and `contentCategory` are locked once stage 2 starts. Attempting to change either after planning has begun produces a clear error.

#### Content categories

- Added `contentCategory` field: `fiction` (default) or `non-fiction`.
- Added `--category <fiction|non-fiction>` flag to `book-producer init`.
- Non-fiction automatically enables `researchConfig`.

#### Image support

- Added `ImageConfig` type and `imageConfig` field to `state.json`:
  - `enabled` — whether images are active for this book
  - `strategy` — `auto`, `generate`, `download`, `custom`, `skip`
  - `placement` — `none`, `end-of-chapter`, `per-page`, `on-event`, `custom`
  - `placementDescription` — free-text placement notes
  - `visualContinuity` — `prompt-injection`, `seed`, `reference-image`, `none`
  - `customInstructions` — additional style or generation constraints
- Images are always enabled for `pages`-type books; optional for `chapters`.
- CLI flags: `--images`, `--image-strategy`, `--image-placement`, `--image-placement-notes`, `--image-continuity`, `--image-custom-instructions`.
- `chapter-memory.json` now has `globalVisualGuidance` (style guide injected into every image prompt) and per-entry `image_references` and `image_seeds`.

#### Non-fiction research

- Added `ResearchConfig` type and `researchConfig` field: `enabled`, `strategy` (`auto`, `active-web`, `ai-knowledge`).
- Auto-enabled for non-fiction books. CLI flag: `--research-strategy`.
- Stage-3 design and stage-4 writing agents now include research notes and verification steps for non-fiction chapters.

#### Text length and page count

- Added `textLength` field for pages-type books: `minimal` (1–3 sentences), `small` (1 paragraph), `medium` (2–3 paragraphs), `large` (4+ paragraphs). CLI flag: `--text-length`.
- Added `pageCount` field. Stage-1 agent now estimates page count based on book concept, audience, and format; presents the estimate for user confirmation; saves the confirmed value to `state.json`.

#### Language tracking

- Added `mainLanguage` and `otherLanguages` fields to `state.json`.
- CLI flags: `--language`, `--other-languages`.
- Language settings can be changed at any time; latest user instruction wins.

#### Stage agent updates

- **Stage 1**: now captures bookType, contentCategory, textLength, imageConfig, researchConfig, and pageCount estimate during the init conversation. All values saved to `state.json`.
- **Stage 3**: now produces a visual design package (globalVisualGuidance, per-unit image prompts) for image-enabled and pages-type books. Non-fiction chapter designs include research notes.
- **Stage 4**: reads bookType and imageConfig from state.json at stage entry; writes to `pages/` or `chapters/`; produces image prompt blocks and updates image_references/image_seeds for image-enabled books; runs per-chapter research for non-fiction.
- **Stage 6**: reads bookType from state.json to determine whether to assemble from `chapters/` or `pages/`.

#### Orchestration and writing behavior

- Non-Claude Stage 4 chapter-batch preference (`chapterBatchSize`) persisted in `state.json`. Interactive prompt when no preference stored. `--batch-size <all|N>` flag on `book-producer orchestrate chapters`.
- Chapter generation is strict one-by-one sequence for all tools including Claude.
- Stage 2, 3, and 5 agents now require continuity/name/fact checks against prior units and approved specs.

#### Status command

- `book-producer status` now shows a Configuration section: bookType, contentCategory, textLength (if pages), image config (if enabled), research config (if enabled).
- Content directory and section label (`Chapters` / `Pages`) now resolve dynamically from `state.json → bookType`.

#### Code quality

- `init.ts` action handler now uses a typed `InitOpts` interface instead of `opts: any`.
- `init.ts` docstring updated with all current usage examples.

#### Stage 2 planner — pages and non-fiction awareness

- Stage-2 planner now reads `bookType` and `contentCategory` from `state.json` before producing output.
- For pages-type books: produces a page list instead of a chapter list; includes `textLength` per page and confirms `pageCount` from stage 1.
- For non-fiction books: adds research phase milestones per chapter — what claims need verification, what sources to consult, whether active web search or AI knowledge applies.
- Required output updated: "chapter list" → "content list"; "research milestones" added as a distinct output field.

#### Continuity checker — full manuscript check mode

- `continuity-checker` now operates in two explicit modes:
  - **Default memory-backed mode**: uses `assets/chapter-memory.json` plus the recent chapter sliding window — fast, used automatically before each chapter write and after approval.
  - **Full Chapter Check Mode**: triggered only by explicit user request (e.g. `validate consistency`, `full chapter check`); reads every created chapter/page in order from 1 through the latest unit; validates both continuity and consistency directly against full text; produces `assets/full-consistency-report.md`.
- Continuity and consistency are now defined separately: continuity = open threads, timeline, carry-over state; consistency = names, facts, world rules, character state, terminology, canon details.
- `04-command-routing.md` now documents the continuity routing rules and the trigger phrase `validate consistency`.
- `chapter-memory.json` schema in `continuity-checker.md` updated to include `globalVisualGuidance`, `image_references`, and `image_seeds`; image field guidance added for image-enabled books.
- Stage-4 progression rule updated: explicit full chapter check request delegates to `continuity-checker` before writing continues.

#### Documentation and path consistency

- All `chapters/`-hardcoded references in `README.md`, `assets/README.md`, and `TROUBLESHOOTING.md` updated to cover both `chapters/` (chapters type) and `pages/` (pages type).
- `UPGRADING.md` step-by-step procedure restored: steps 1 (update globally) and 2 (refresh framework) were missing; now complete.
- Assembly flow in `6-publish-assembler.md` renumbered: steps 4 and 5 had been omitted; flow now runs 0–10 without gaps.
- CLI commands sections in both `README.md` and `assets/README.md` updated with representative examples for new `init` flags: `--type pages`, `--images`, `--image-strategy`, `--image-placement`, `--image-continuity`, `--category non-fiction`, `--research-strategy`, `--text-length`.
- `book-project-manager` duplicate entry removed from `assets/README.md` standalone agent list.

#### Code quality and tests

- `init.ts`: `researchConfig.strategy` now correctly cast to `ResearchConfig['strategy']` — was left as `string` causing a TypeScript compile error.
- Test suite extended from 86 to 111 tests:
  - New cases for pages-type directory creation (`pages/` not `chapters/`)
  - New cases for `imageConfig`, `researchConfig`, `contentCategory` saved to state
  - New cases for default field values (`bookType: 'chapters'`, `contentCategory: 'fiction'`, `imageConfig: null`)
  - `state.json` template sanity check extended to verify `bookType`, `contentCategory`, `imageConfig`, `researchConfig`, `textLength`, `pageCount`
  - New describe block for continuity routing: verifies `04-command-routing.md` and `continuity-checker.md` contain required trigger phrases and mode labels

### Compatibility

- `bookType` and `contentCategory` default to `chapters` and `fiction` when not specified, preserving full backwards compatibility for existing 0.1.0 books.
- `imageConfig`, `researchConfig`, `textLength`, `pageCount`, `globalVisualGuidance`, `image_references`, and `image_seeds` are all null/empty by default — existing books are unaffected.
- Claude chapter generation is sequential and continuity-gated. Research and support orchestration remain parallel-capable.
- Non-Claude tools remain sequential with configurable batch boundaries and strict one-by-one progression.

## 0.1.0

`0.1.0` is the initial published version of `book-producer`.

This version establishes the package as a repo-scoped AI book creation framework distributed as a CLI. It is designed to be installed into an existing git repository so an AI assistant can work with persistent, book-aware context instead of relying only on chat memory.

### What this version does

This version provides:

- a CLI named `book-producer`
- installable framework assets under `.book-framework/`
- an installed user guide at `.book-framework/README.md`
- managed tool entrypoints that redirect supported AI tools to the installed framework
- per-book workflow memory under `.spec/<book-slug>/`
- book content (chapters, manuscript) at `<book-slug>/` in the repository root
- deterministic markdown-based workflow guidance for AI-assisted book creation
- six numbered stage agents covering the full book creation lifecycle
- eleven standalone specialist agents for editing, continuity, research, worldbuilding, and more
- dual package preparation for npm and GitHub Packages via local scripts

The main idea in `0.1.0` is that the framework separates:

- reusable framework rules in `.book-framework/` — resettable to package defaults at any time
- book-specific working memory in `.spec/<book-slug>/` — preserved across framework resets
- actual book content in `<book-slug>/` at the repository root — user-owned, never overwritten

That means a repository can refresh or reset framework assets while keeping book progress, stage notes, and chapter files completely separate.

### CLI commands in 0.1.0

#### `book-producer install`

Installs the framework files into a target git repository.

It writes:

- `.book-framework/README.md`
- `.book-framework/AGENTS.md`
- `.book-framework/CHAT-WORKFLOW.md`
- `.book-framework/framework/` — six core rule and policy documents
- `.book-framework/agents/` — six numbered stage agents and eleven standalone specialists
- `.book-framework/templates/` — ten stamped spec file templates
- `.book-framework/tooling/` — shared guidance plus one file per supported tool

It also creates or refreshes managed tool entrypoints:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.cursor/rules/book-producer.mdc`
- `.agents/workflows/book-producer.md`

Each tool entrypoint contains a managed section bounded by `<!-- book-producer:start -->` and `<!-- book-producer:end -->` markers. The section is created on first install and updated in place on subsequent installs without touching surrounding file content.

Supports `--force` to overwrite all managed framework files with package defaults. Does not delete or overwrite user-created book content.

#### `book-producer init "Book Title"`

Creates a new book idea spec inside the repository.

It creates:

- `.spec/<book-slug>/state.json`
- `.spec/<book-slug>/00-current-status.md`
- `.spec/<book-slug>/01-init.md`
- `.spec/<book-slug>/assets/chapter-memory.json`
- `.spec/.branch-mapping.json` (created or updated)
- `<book-slug>/chapters/` at repo root

The book slug is derived from the title: lowercase, special characters removed, spaces collapsed to hyphens. Detects existing books with the same or similar slug and prompts for confirmation before overwriting.

Supports `--mode parallel|sequential` to override auto-detected orchestration mode. Supports `--force` to reset spec files for an existing book. Supports `--yes` to skip interactive confirmations.

#### `book-producer status [slug]`

Prints the current workflow state for the named book, or auto-resolves the active book from the current git branch via `.spec/.branch-mapping.json`.

Reports: current stage, completed steps, incompleted stages, chapter count, approved chapter count, and the next recommended step.

Supports `--json` for machine-readable output.

#### `book-producer list`

Lists all book ideas found in `.spec/` with their current stage and finalization status.

#### `book-producer use <slug>`

Sets the active book context by writing the slug to `.book-framework/.active-book-idea`. Used when multiple books exist in the same repository and the current branch is not mapped to a unique book.

#### `book-producer doctor`

Validates framework health for the current repository.

Checks:

- `.book-framework/` and required subdirectories exist
- `AGENTS.md`, `CHAT-WORKFLOW.md`, `README.md` present in `.book-framework/`
- Tool entrypoints exist
- At least one book idea exists (informational)

Supports `--branch` to validate a specific branch's spec files explicitly.

#### `book-producer refresh`

Re-applies managed framework templates and recreates missing tool entrypoint sections without overwriting existing user content. Equivalent to a non-destructive `install`.

#### `book-producer orchestrate`

Generates tool-specific work packets for parallel or sequential execution.

Subcommands:

- `book-producer orchestrate chapters [slug] --tool <tool> --chapters 1,2` — chapter-writing packets
- `book-producer orchestrate research [slug] --tool <tool> --topics "topic one,topic two"` — research packets

Supported tools: `claude`, `copilot`, `cursor`, `antigravity`.

Saves the latest packet plan to `.spec/<book-slug>/assets/orchestration/`.

Supports `--json` to print the work plan without saving.

### Framework workflow model in 0.1.0

Six numbered workflow stages drive the book from idea to manuscript:

| Stage | Agent | Stage file | What happens |
|-------|-------|------------|--------------|
| 1 | `1-book-init` | `01-init.md` | Capture book idea, audience, genre, publishing intent, success criteria |
| 2 | `2-book-planner` | `02-plan.md` | Build execution plan: chapter list, word targets, milestones, dependency map |
| 3 | `3-book-designer` | `03-design.md` | Full plot summary, per-chapter design, Mermaid diagrams, implementation contracts |
| 4 | `4-chapter-writer` | `04-implementation.md` | Create chapter files under `<book-slug>/chapters/` |
| 5 | `5-book-reviewer` | `05-review.md` | Editorial, grammar, continuity, and quality review pass |
| 6 | `6-publish-assembler` | `06-finalization.md` | Assemble approved chapters into the final manuscript |

Stages 1, 2, 3, 4, and 6 are mandatory. Stage 5 is optional — the user may advance directly from stage 4 to stage 6. User approval is mandatory after every stage. No auto-advancement is permitted.

`00-current-status.md` is created at initialization and updated throughout the workflow to reflect the current stage, completed steps, blockers, and the next recommended action.

### Orchestration model in 0.1.0

`book-producer` detects orchestration mode at `book-producer init` time:

- **Parallel** — if `ANTHROPIC_API_KEY`, any `CLAUDE_*` environment variable, or a `.claude/` directory is present. Claude can execute independent chapter or research packets concurrently.
- **Sequential** — default for all other tools (Copilot, Cursor, Antigravity). One active writer per file at all times.

Mode is stored in `state.json` and can be overridden at init time with `--mode parallel|sequential`.

Always-sequential constraints regardless of mode: concept → outline → chapter plan dependency chain, all approval gates, and final manuscript assembly.

### Chapter file format in 0.1.0

Each chapter file uses YAML frontmatter:

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
```

The `chapter: N` field is the sort key for assembly. The `title: "Chapter N: ..."` format provides human-readable order confirmation. The assembler validates for gaps, duplicates, and title format inconsistencies before producing the final manuscript.

### Installed framework content in 0.1.0

This version installs a full documentation and runtime layer under `.book-framework/`.

```
.book-framework/
├── README.md                   ← installed user guide (new in 0.1.0)
├── AGENTS.md                   ← agent entry point and reading order
├── CHAT-WORKFLOW.md            ← chat-first workflow guide
├── framework/
│   ├── 01-core-rules.md        ← twelve framework invariants
│   ├── 02-state-model.md       ← state.json schema and status fields
│   ├── 03-stage-lifecycle.md   ← stage progression and lifecycle rules
│   ├── 04-command-routing.md   ← routing table: request type → agent
│   ├── 08-skip-force-policy.md ← --force semantics per command
│   └── 09-orchestration-policy.md ← parallel vs sequential rules
├── agents/
│   ├── 1-book-init.md
│   ├── 2-book-planner.md
│   ├── 3-book-designer.md
│   ├── 4-chapter-writer.md
│   ├── 5-book-reviewer.md
│   ├── 6-publish-assembler.md
│   └── standalone/             ← eleven specialist agents
├── templates/                  ← ten stamped spec file templates
└── tooling/
    ├── shared.md
    ├── claude.md
    ├── copilot.md
    ├── cursor.md
    └── antigravity.md
```

### Numbered framework stage agents in 0.1.0

- `1-book-init`: capture the raw book idea, audience, genre, publishing intent, tone, success criteria, and non-goals
- `2-book-planner`: turn initialized intent into a chapter list with word targets, milestones, dependency map, and parallel/sequential annotations
- `3-book-designer`: produce the final content design package — full plot summary, per-chapter summaries, Mermaid story flow and arc diagrams, canonical facts, and implementation contracts for stages 4 and 5
- `4-chapter-writer`: implement one chapter file per designed chapter; runs continuity pre-check and arc planning before writing each chapter; updates `chapter-memory.json` after each chapter is approved
- `5-book-reviewer`: editorial, grammar, continuity, and quality review pass across all chapters; produces a structured review with issues, corrections, suggestions, and a sign-off checklist
- `6-publish-assembler`: sort and concatenate approved chapter files into the final manuscript without modification; log assembly; wait for user confirmation before running optional cleanup

### Standalone specialist agents in 0.1.0

Standalone agents can be used at the appropriate point in the workflow without advancing the numbered stages.

Available at any time:

- `concept-architect`: shape a raw idea into a logline, core premise, unique angle, suggested titles, and open questions
- `book-outliner`: produce a chapter-by-chapter outline with scene beats, dependency annotations, and parallel-safe flags
- `book-blurb-writer`: write back-cover and Amazon listing copy — hook, setup, stakes, call to action, keyword list

Available after init (stage 1+):

- `line-editor`: sentence-level style refinement — variety, word choice, tone consistency, clarity, and paragraph flow; preserves plot and voice
- `sensitivity-reader`: review for cultural accuracy, representation blind spots, stereotyping, harmful language, and exploitative framing
- `research-fact-integrity`: research topics or verify historical, technical, geographic, and cultural accuracy; outputs reports only

Available after chapters exist (stage 4+):

- `developmental-editor`: structural and coherence revision — argument flow, narrative logic, chapter purpose, character arc, scene effectiveness
- `continuity-checker`: pre-chapter entry constraints from `chapter-memory.json`; post-approval `chapter-memory.json` updates; never edits prose
- `chapter-arc-architect`: beat sheet per chapter — opening, inciting event, complications, crisis, climax, resolution

Available during active workflow:

- `character-world-designer`: create and maintain `assets/character-profiles.md` and `assets/world-notes.md`
- `book-project-manager`: parallel write-ownership coordination, gate-state surfacing, spec conflict escalation, chapter assignment log

### Runtime spec memory in 0.1.0

Runtime book memory is stored outside the framework folder at:

- `.spec/<book-slug>/`
- `.spec/.branch-mapping.json`

Key files in the book folder:

- `state.json` — machine-readable workflow state (stage, steps, orchestration mode, chapter count, finalization flag, timestamps)
- `00-current-status.md` — human-readable current status, blockers, and next recommended step
- `01-init.md` — captured book idea and scope (created at init)
- `02-plan.md` through `06-finalization.md` — created lazily as stages start with user approval
- `assets/chapter-memory.json` — rolling chapter summaries for sliding-window continuity context

The `state.json` schema in `0.1.0` tracks:

- `bookIdeaName` and `sanitizedBookIdeaName`
- `bookIdeaMemoryFolder` and `bookContentDir`
- `currentStage`, `completedSteps`, `incompletedStages`
- `nextRecommendedStep`
- `lastUpdatedBy`, `lastUpdatedAt`
- `initialized`, `finalized`
- `orchestrationMode`
- `chapterCount`, `manuscriptFile`

### Key design decisions in 0.1.0

- **Framework assets are separable from book memory.** `.book-framework/` can be reset to package defaults at any time without touching `.spec/<book-slug>/` or `<book-slug>/chapters/`.
- **Stage progression is explicit, never automatic.** No stage advances without a user approval signal. Adding or modifying content inside a stage is always treated as an in-place amendment.
- **Chapter files are user-owned.** The framework never overwrites files under `<book-slug>/chapters/`. Only `4-chapter-writer` may create them; only the user may approve them.
- **Lazy stage-file creation.** Initialization creates exactly three files. Each subsequent stage file is created only when that stage starts. At most two numbered stage files may be created in one pass.
- **Branch-aware book tracking.** `.spec/.branch-mapping.json` maps git branches to book ideas, enabling automatic context resolution in multi-book repositories.
- **Dual human and machine state.** Every book maintains both a machine-readable `state.json` and a human-readable `00-current-status.md`. Both are updated in sync.
- **Force flags never bypass approval gates.** `--force` controls file reset behavior only. It cannot skip a stage, advance the workflow, or replace user confirmation.
- **Doctor-style validation from day one.** `book-producer doctor` validates the full installation and spec health on demand.
- **Tool parity by design.** All four supported tools (Claude, Copilot, Cursor, Antigravity) follow the same stage model and approval gates. The only difference is whether chapter writes can run in parallel.

### Error handling in 0.1.0

- `state.json` read failures print a descriptive recovery message with the file path
- `state.json` JSON parse failures include the path and recovery steps
- `.branch-mapping.json` read or parse errors return an empty mapping rather than crashing
- All destructive CLI operations require explicit user confirmation
- The assembler validates chapter order, detects gaps and duplicates, and warns on title format inconsistencies before writing the manuscript

### Summary of 0.1.0

Version `0.1.0` is the foundational release of `book-producer`.

It ships:

- a usable CLI with eight commands including orchestration helpers
- a full six-stage workflow from book idea to final manuscript
- branch-aware book tracking across multiple books and branches
- a dual human/machine state model that survives across sessions and tools
- chapter assembly with order validation and gap detection
- eleven standalone specialist agents covering the full editorial and production workflow
- an installed user guide at `.book-framework/README.md` as the primary in-repo reference
- managed tool entrypoints for Claude, Copilot, Cursor, and Antigravity
- dual package preparation for npm (`book-producer`) and GitHub Packages (`@<owner>/book-producer`)
- manual local publishing workflow documented in `PACKAGE-PUBLISHING.md`
- defensive error handling throughout
- a complete test suite

In short, `0.1.0` defines how `book-producer` works as a book-idea-aware, markdown-driven AI writing framework for git repositories.
