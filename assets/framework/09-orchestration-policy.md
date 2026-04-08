# Orchestration Policy

## Mode Detection

Orchestration mode is detected once at `book-producer init` time and stored in `state.json` as `orchestrationMode`.
The `book-producer orchestrate` command follows the requested tool adapter when it generates work packets, while still reporting the stored state mode for traceability.

| Signal | Mode |
|---|---|
| `ANTHROPIC_API_KEY` env var set | `parallel` |
| Any `CLAUDE_*` env var present | `parallel` |
| `.claude/` directory exists in repo root | `parallel` |
| None of the above | `sequential` |

Override: `book-producer init --mode [parallel|sequential]`

## Tool Adapters

Installed tool entrypoints point back to the framework:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.cursor/rules/book-producer.mdc`
- `.agents/workflows/book-producer.md`

These files must direct the active tool to `.book-framework/AGENTS.md` plus the matching file under `.book-framework/tooling/`.

## Parallel Mode (Claude)

Allowed for:

- Research pack generation for non-overlapping topics
- Intra-chapter helper work that does not draft multiple chapter files at once

Drive these packets with:

- `book-producer orchestrate chapters <slug> --tool claude --chapters 1,2`
- `book-producer orchestrate research <slug> --tool claude --topics "topic one,topic two"`

Always sequential even in parallel mode:

- concept -> outline -> chapter plan (hard dependency chain)
- chapter drafting order (chapter N must complete before chapter N+1)
- Any step that requires prior approval output as input
- Finalization assembly (single writer, single output file)

**Write-ownership rule:** No two agent calls may write to chapter files simultaneously.

## Sequential Mode (Copilot, Cursor, Antigravity, Codex, others)

All tasks run one at a time. Parallel gates are disabled. The workflow proceeds linearly through stages and chapters.

Stage 4 chapter writing behavior in sequential mode:

- On first stage-4 orchestration run (or when no preference is stored), ask the user to choose chapter batching:
	- `all` chapters in one uninterrupted run
	- one-by-one (`1`)
	- grouped batches (`2+`)
- In the same prompt, warn that larger uninterrupted runs can exhaust model/API limits.
- Persist the choice in `.spec/<book-slug>/state.json` as `chapterBatchSize`.
- Allow the user to change the stored value at any time.
- Regardless of batch size, write chapters strictly one-by-one in numeric order and complete chapter N before chapter N+1.
- Before writing chapter N, run continuity checks against prior chapters using full recent chapters + summaries of earlier chapters.

Chapter extension behavior uses the same batching preference:

- `chapter-extender` and any extension follow-up from stage 5 must reuse `chapterBatchSize` when chapters are extended in batches.
- Regardless of batch size, chapter extension still runs strictly one-by-one in numeric order.
- Before extending chapter N, re-check continuity against prior chapters, review notes, and the current `chapter-word-counts.json` registry.

Drive these packets with the matching tool name:

- `book-producer orchestrate chapters <slug> --tool cursor --chapters 1,2`
- `book-producer orchestrate chapters <slug> --tool cursor --chapters 1,2 --batch-size 2`
- `book-producer orchestrate research <slug> --tool copilot --topics "topic one,topic two"`

## Fallback

Even in parallel mode, execution falls back to sequential when:

- A task depends on the output of another in-progress task.
- An approval gate is pending.
- The user has not explicitly confirmed readiness to continue.
