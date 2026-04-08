# Changelog

All notable changes to book-producer are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.3] — 2026-03-30

### Added

- Added `instructionLanguage` to `.spec/<book-slug>/state.json` so book-scoped specs, reports, and workflow notes can persist their own language independently from the book's prose language.
- Added `--instruction-language <language>` to `book-producer init` for explicit CLI-side control of the spec/instruction language.

### Changed

- Stage-1 language behavior now defaults the instruction/spec language to the language of the first initialization prompt unless the user explicitly chooses another instruction language in that prompt.
- Installed framework instructions, templates, tool adapters, and package documentation now state that an explicit `instructionLanguage` change requires translating the existing `.spec/<book-slug>/` workflow files before continuing.
- `book-producer status` now reports instruction-language settings alongside the book's language tracker.
- Resuming an existing book idea through `book-producer init` no longer clears saved language settings unless the user passed an explicit language override.

## [0.2.2] — 2026-03-30

### Added

- Added `.spec/<book-slug>/assets/chapter-word-counts.json` as a synced registry for chapter target counts, measured prose counts, and shortfall tracking.
- Added standalone `chapter-extender` agent for safe chapter expansion that preserves continuity while bringing chapters toward their target word counts.
- Added `book-producer orchestrate extend [slug]` for extension packets, including `--under-target` support to target every chapter currently below its goal.

### Changed

- Standardized canonical chapter headers to the full stage-4 format, including `status`, `word_count_target`, `word_count_actual`, `assigned_agent`, `reviewer_notes`, and a matching `# Chapter N: ...` H1.
- Stage 4 guidance now requires legacy short headers to be normalized before continuing work on an existing chapter.
- Stage 5 review now audits under-target chapters, records word-count deficits in `05-review.md`, and routes follow-up expansion work to `chapter-extender` using the same batching rules as chapter drafting.
- Status output now syncs and reports chapter word-count registry information.

### Notes

- The JSON word-count registry is the place where measured prose counts are synchronized. Manual target changes in chapter headers should flow into the registry instead of being overwritten by it.

## [0.2.1] — 2026-03-27

### Fixed

- CLI version output now reads the version from `package.json` instead of a hardcoded string, so `book-producer --version` matches the actually published package version.
- Release prep corrected for republishing after the withdrawn `0.2.0` npm attempt; `0.2.1` is the follow-up patch release for the same feature set plus the version-report fix.
- Root package metadata synchronized for release prep, including `package.json` and `package-lock.json`.

## [0.2.0] — 2026-03-27

### Added

- **Book types**: `bookType` field in `state.json` (`chapters` or `pages`); `--type` flag on `book-producer init`
- **Pages mode**: for illustrated and children's books — init creates `<book-slug>/pages/` instead of `chapters/`; stage 1, 2, 3, 4, and 6 agents handle pages as discrete units with per-page text and image slots
- **Content categories**: `contentCategory` field (`fiction` or `non-fiction`); `--category` flag on `book-producer init`
- **Non-fiction research**: `researchConfig` field in `state.json` (enabled, strategy); auto-enabled for non-fiction; `--research-strategy` flag (`auto`, `active-web`, `ai-knowledge`)
- **Image support**: `imageConfig` field in `state.json` (enabled, strategy, placement, placementDescription, visualContinuity, customInstructions); flags: `--images`, `--image-strategy`, `--image-placement`, `--image-placement-notes`, `--image-continuity`, `--image-custom-instructions`; images always enabled for pages-type books
- **Text length**: `textLength` field for pages-type books (`minimal`, `small`, `medium`, `large`); `--text-length` flag
- **Page count estimation**: stage-1 agent estimates `pageCount` based on book concept, audience, and format; presents estimate to user for confirmation; saved to `state.json`
- **Visual continuity**: `globalVisualGuidance` field in `chapter-memory.json`; image reference tracking via `image_references` and `image_seeds` per chapter/page entry
- **Non-Claude Stage 4 chapter-batch preference**: `chapterBatchSize` in `state.json`; interactive prompt when no preference stored; `--batch-size <all|N>` on `orchestrate chapters`
- **Language tracker**: `mainLanguage` and `otherLanguages` in `state.json`; `--language` and `--other-languages` flags on init
- **Configuration section** in `book-producer status` output: shows bookType, contentCategory, textLength, image config, research config
- **Dynamic content directory** in `book-producer status`: resolves to `chapters/` or `pages/` based on `bookType`; section label adjusts accordingly
- **Full chapter check mode** in `continuity-checker`: explicit user request triggers chapter-by-chapter validation of every created chapter/page against full text; produces `assets/full-consistency-report.md`; distinct from default sliding-window mode
- **Consistency validation route**: `validate consistency` now explicitly routes to `continuity-checker`; `04-command-routing.md` documents the distinction between continuity (threads/timeline) and consistency (names/facts/canon)
- **Stage-2 planner**: now reads `bookType` and `contentCategory` from `state.json`; produces a page list (not chapter list) for pages-type books; includes research phase milestones for non-fiction books

### Changed

- `bookType` and `contentCategory` are locked after stage 2 starts; init command errors clearly if user attempts to change either after planning has begun
- stage-1 agent now captures bookType, contentCategory, textLength, imageConfig, researchConfig, and pageCount estimate from the init conversation
- stage-2 agent now differentiates pages-type and non-fiction planning (page list, research milestones)
- stage-3 agent now produces visual design package (globalVisualGuidance, per-unit image prompts) for image-enabled and pages-type books; non-fiction chapters include research notes
- stage-4 agent now reads bookType and imageConfig from state.json; writes to `pages/` or `chapters/` accordingly; handles image prompt blocks, image_references, and image_seeds for image-enabled books; runs per-chapter research for non-fiction; pre-write step 3 path is now dynamic
- stage-6 assembler now reads `bookType` from `state.json` to determine whether to assemble from `chapters/` or `pages/`; assembly flow renumbered (steps 4–5 were missing)
- `03-design.md.template`, `04-implementation.md.template`, and `06-finalization.md.template` are now pages/chapters aware
- `chapter-memory.json` template now includes `globalVisualGuidance: null`
- `continuity-checker` standalone agent updated: two explicit operating modes (default memory-backed, full chapter check); schema now includes `globalVisualGuidance`, `image_references`, `image_seeds`; consistency defined separately from continuity
- non-Claude chapter orchestration packets enforce strict one-by-one progression, including grouped/all modes
- `book-producer orchestrate chapters ...` supports `--batch-size <all|N>` and saves preference to state
- chapter generation is strict one-by-one sequence for all tools including Claude
- stage 4 progression rule: explicit full chapter check delegates to `continuity-checker` before proceeding
- `init.ts` action handler now uses a typed `InitOpts` interface instead of `opts: any`; `researchConfig.strategy` now correctly cast to `ResearchConfig['strategy']`
- `init.ts` docstring updated with all current usage examples including new flags
- all `chapters/`-hardcoded references in README.md, assets/README.md, and TROUBLESHOOTING.md updated to cover both `chapters/` and `pages/` paths
- UPGRADING.md: steps 1 and 2 (update globally, refresh framework) restored to step-by-step procedure
- test suite extended: new cases for pages-type directory creation, imageConfig, researchConfig, contentCategory defaults, and state.json template field coverage

### Notes

- Claude chapter orchestration follows strict sequential packets to preserve continuity; parallel support remains for research and support orchestration
- `bookType` and `contentCategory` can only be set at init time; changing them after stage 2 requires creating a new book idea

## [0.1.0] — 2026-03-26

### Initial Release

This is the first public release of book-producer. The implementation is complete and tested.

#### Added

- **Chat-first workflow**: Core 6-stage book creation framework (init, plan, design, chapters, review, finalize)
- **CLI**: One-time install command + optional status, list, use commands for terminal users
- **Directory model**: Split spec memory (`.spec/<slug>/`) from book content (`<slug>/` at repo root)
- **Branch mapping**: Automatic tracking of books per branch; auto-resolution of book context in multi-book repos
- **State persistence**: `state.json` and markdown stage files ensure work survives across chat sessions
- **Chapter management**: Sliding-window context (last 4–5 chapters in full + JSON summaries of older ones) for managing large books
- **Status command**: `book-producer status [slug]` for terminal visibility into workflow progress
- **Force-policy gates**: Explicit user confirmation required before destructive operations (cleanup)
- **Orchestration modes**: Sequential (default, faster in chat) or Parallel (faster compute but needs explicit sync points)
- **Template system**: Auto-generated stage files from configurable templates
- **Asset library**: Installed framework docs, agent instructions, and templates in `.book-framework/`
- **Test coverage**: 86 tests covering core workflows, error cases, install flows, orchestration modes, and state robustness

#### Known Limitations

- **No concurrent write safety**: If two processes write `state.json` simultaneously, corruption is possible. Mitigation: do not run two `book-producer init` in parallel on the same repo.
- **No API stability guarantee**: Public functions exported from CLI but no formalized API contract yet.

#### Breaking Changes

None — this is the initial release.

---

## Glossary

- **stage**: One of six workflow phases (init, plan, design, chapters, review, finalize)
- **spec memory**: Workflow files stored in `.spec/<slug>/` — not user-editable book content
- **book content**: User-created chapters and manuscript stored in `<slug>/` at repo root
- **slug**: Normalized book identifier (lowercase, hyphenated), derived from book name
- **branch mapping**: Registry tracking which books have been worked on per git branch
- **orchestration mode**: `sequential` (default, chat-friendly) or `parallel` (compute-friendly)
- **force-policy**: System requiring explicit user confirmation before destructive operations
