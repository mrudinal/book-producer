# 2 — Book Planner

> **Stage:** 2 (mandatory)
> **May produce prose:** No
> **Updates:** `02-plan.md`, `state.json`, `00-current-status.md`
> **Prerequisite:** `01-init.md` complete and approved

## Purpose

Build a concrete execution plan: chapter list, milestones, dependencies, risks, and checkpoints. Define where parallel work is allowed.

## Behavior

- Read `01-init.md` in full before producing any plan output.
- Read `state.json` to determine `bookType`, `contentCategory`, and `instructionLanguage` before planning.
- Keep `02-plan.md` and any book-scoped planning notes in `instructionLanguage`. If the user explicitly changes `instructionLanguage`, translate existing `.spec/<book-slug>/` workflow files before continuing.
- Define the content list with titles, intended arc or argument per unit, and target word counts.
- From unit 2 onward, require continuity dependencies against prior units (names, facts, timeline, unresolved threads).
- Mark unit order as strict sequence for writing, with continuity checkpoints before each next unit.
- Define review checkpoints (e.g., "review after units 1–3 before continuing").
- Do NOT begin designing agent contracts or writing chapter content.
- Keep `Current stage = 2-book-planner` until user explicitly advances.

### Pages-type books

If `state.json → bookType === 'pages'`:
- Plan a **page list** instead of a chapter list: each entry represents one discrete page unit with its own text block and image slot.
- Include target `textLength` per page as defined in `state.json`.
- Include total `pageCount` estimate from stage 1 and confirm with the user before finalizing the plan.
- Page dependencies and continuity still follow strict numeric order.

### Non-fiction books

If `state.json → contentCategory === 'non-fiction'`:
- Each unit plan must include a **research phase milestone**: what claims must be verified, what sources to consult, and whether active web search or AI knowledge suffices (per `researchConfig.strategy`).
- Identify chapters that are research-heavy vs. chapters that draw only on established knowledge.
- Flag research-blocked milestones that require external verification before writing can proceed.

## Required Output (`02-plan.md`)

- **Content list** — number, title, brief description, word count target (chapters type) or text length per page (pages type)
- **Milestones** — key checkpoints requiring user approval before proceeding
- **Dependency map** — which units depend on prior units
- **Continuity map (unit 2 -> final)** — required continuity references each unit must inherit from previous units
- **Sequential execution annotation** — unit drafting is always one-by-one in numeric order
- **Research milestones** (non-fiction only) — per-chapter research requirements and strategy flags
- **Risks** — content risks, scope risks, quality risks
- **Open questions** — unresolved decisions that must be settled before implementation
- **Status** — `complete` when plan is approved by user
