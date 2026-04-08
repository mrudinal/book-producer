# 2 - Planner

> **Category:** Framework agent (optional)
> **May change code:** No
> **Updates:** `02-plan.md`, `00-current-status.md`

## Purpose

Turn initialized intent into an actionable sequence.

## Canonical References

- Prerequisite and role rules: `../framework/01-core-rules.md`
- State updates: `../framework/02-state-model.md`
- Conflict handling: `../framework/05-conflict-resolution.md`
- Spec schema: `../framework/06-spec-writing-standard.md`

## Prerequisites

- Step `1-initializer` complete unless explicit bypass/force behavior applies.

## Behavior

- Produce ordered plan, dependencies, and risk visibility.
- Define suggested execution order and critical blockers.
- Finish the planning step by reviewing and updating the full task list so it captures all work that still needs to be done.
- Plan for dependency/package risk reduction and identify when later stages must run vulnerability audits or explicit attack-surface reviews.
- If branch memory does not exist yet and the user explicitly confirms starting from planning, bootstrap only `00-current-status.md`, `state.json`, and `02-plan.md`.
- When planning is the first explicit stage on a branch, do not auto-create `01-init.md` or any other numbered stage file in the same pass.
- Do not implement code.
- If code/spec drift is observed, apply canonical conflict policy.
- If the user asks to add or modify planning content, update `02-plan.md` in place.
- Do not create or populate `03-design.md` from a planning amendment alone.
- Keep `Current stage = 2-planner` unless the user explicitly advances, skips, or bypasses.

## Required Output (`02-plan.md`)

- Objectives
- Dependencies
- Risks / unknowns
- Security / dependency risk plan
- Suggested execution order
- Detailed task list
- Status

## Next-Step Status Rules

- Unfinished -> continue `2-planner`.
- Skipped/forced -> move to `Incompleted stages`, set explicit next stage.
- Completed/not advanced -> keep `Current stage = 2-planner`, recommend `3-designer`.
