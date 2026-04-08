# Command Routing

## Routing Defaults

| Request type | Routed to |
|---|---|
| Status / progress question | `0-status-checker` behavior (read and report state) |
| Concept shaping | `concept-architect` |
| Outline / chapter planning | `book-outliner` |
| Stage 1 work | `1-book-init` |
| Stage 2 work | `2-book-planner` |
| Stage 3 work | `3-book-designer` |
| Chapter writing | `4-chapter-writer` |
| Review request | `5-book-reviewer` |
| Finalization / assembly | `6-publish-assembler` |
| Editing request | `developmental-editor` or `line-editor` |
| Chapter extension / word-count remediation | `chapter-extender` |
| Character / world work | `character-world-designer` |
| Research / fact-check | `research-fact-integrity` |
| Chapter arc planning | `chapter-arc-architect` |
| Continuity check | `continuity-checker` |
| Blurb / listing copy | `book-blurb-writer` |
| Sensitivity review | `sensitivity-reader` |
| Illustration / image generation | `illustration-generator` |

## Continuity Routing

- Requests such as `validate consistency`, `check continuity`, or `check for contradictions` route to `continuity-checker`.
- Default continuity-check behavior uses `assets/chapter-memory.json` plus the recent sliding-window chapter text for efficient checks.
- If the user explicitly asks for a full chapter check, full manuscript check, or equivalent wording, `continuity-checker` must validate chapter-by-chapter from chapter 1 through the latest created chapter/page instead of relying only on chapter-memory summaries.
- `continuity-checker` validates both continuity and consistency:
  - continuity = open threads, chronology, carry-over state, unresolved dependencies
  - consistency = names, facts, world rules, character state, terminology, and other canon details

## Ambiguity Handling

If a request could mean advancing through two or more stages, do not infer permission. Explain that only one stage runs at a time, suggest the next recommended stage, and ask the user to confirm.

## In-Place vs Advancement

Requests to amend, clarify, or fix content in the current stage = **in-place amendment** (update stage file, do not advance).  
Requests explicitly stating "start", "begin", "advance", "next step", or similar = **advancement** (requires previous stage to be complete).

## Stage 4 Entry Rule (non-Claude)

When routing into `4-chapter-writer` on non-Claude tools, if `.spec/<book-slug>/state.json` has no `chapterBatchSize` value yet and the user has not specified one in the request, ask the user to choose:

- `all`
- `1`
- grouped (`2+`)

In that same prompt, warn that larger uninterrupted runs may exhaust model/API limits. Persist the selected value and continue chapter writing one-by-one in numeric order.

For all tools (including Claude), chapter progression remains strictly sequential with continuity checks before each next chapter.

## Chapter Extension Routing

- Requests such as `extend chapter 19`, `bring this chapter to the target word count`, or `expand these under-target chapters` route to `chapter-extender`.
- Extension packets use the same stored `chapterBatchSize` preference as stage 4 for non-Claude tools, but must still process chapter files one-by-one in numeric order.
- If stage 5 review identifies under-target chapters, list them in `05-review.md` and wait for the user to explicitly request extension work.

## Illustration Routing

- Requests such as `generate an illustration for page N`, `generate image`, `produce an image`, `create illustration`, or `generate the cover art` route to `illustration-generator`.
- `illustration-generator` reads `imageConfig` from `state.json` to determine the active strategy (`auto`, `generate`, `download`, `custom`, or `skip`) and the visual continuity mode (`prompt-injection`, `seed`, `reference-image`, or `none`).
- It is only meaningful for books where `imageConfig.enabled` is `true`; for text-only books, direct the user to enable images in their `state.json` or re-initialize with `--images`.
- `illustration-generator` does not advance the numbered workflow stages and does not edit prose.

## Standalone Specialists

Standalone agents may be invoked at any time without affecting `Current stage`. They do not update numbered stage files unless explicitly asked.
