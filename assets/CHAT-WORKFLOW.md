# Chat-First Workflow Guide

This document describes how to run **book-producer** within Claude, Copilot, Cursor, Antigravity, or similar chat-based agent tools.

## One-Time Setup

```bash
npm install -g book-producer
# or install from GitHub Packages if you publish a scoped mirror there
```

In your repository:

```bash
book-producer install
```

This creates `.book-framework/` with the framework assets and tool adapter docs.

## Initialization

Open your preferred chat tool and begin:

```text
Start a new book project. The book idea is "A detective solves cosmic mysteries".
```

The active tool does:

1. Scans `.spec/` in your repo folder.
2. Checks if a similar book idea exists.
3. Creates `.spec/cosmic-detective/` with:
   - `state.json`
   - `00-current-status.md`
   - `01-init.md`
   - `assets/`
4. Creates `cosmic-detective/chapters/` at repo root.
5. Registers the book on the current git branch in `.spec/.branch-mapping.json`.

Initialization is the only time more than one framework file is created up front (`00-current-status.md` and `01-init.md`).

After that:

- Each later numbered stage file is created lazily when the user approves entering that stage.
- Outside initialization, create at most two numbered stage files in one pass: the missing predecessor for recovery and the current stage file being started.

During stage 1 initialization:

- capture the instruction/spec language from the first initialization prompt and save it as `instructionLanguage`
- capture the main book language from user intent and save it as `mainLanguage`
- capture additional languages that may appear and save them as `otherLanguages`
- if the user explicitly names a different instruction/spec language in that prompt, use that instead of the prompt language
- store these in `.spec/<book-slug>/state.json`
- allow language tracker updates at any time when the user changes requirements
- if `instructionLanguage` changes explicitly later, translate the existing `.spec/<book-slug>/` workflow files before continuing

## Tool Modes

- Claude may use `book-producer orchestrate research ... --tool claude` for research orchestration support.
- Copilot, Cursor, Antigravity, and similar tools must use the matching `--tool` option and stay sequential.

For non-Claude Stage 4 chapter writing:

- If no saved batch preference exists, ask the user to choose `all`, `1`, or grouped batch sizes (`2+`).
- Include a warning that larger uninterrupted runs may exhaust model/API limits.
- Save the selection to `.spec/<book-slug>/state.json` as `chapterBatchSize`.
- Allow user overrides at any time.
- Execute chapter writes strictly one-by-one in numeric order.
- This chapter sequence rule applies to all tools, including Claude.

## Directory Structure

```text
.book-framework/               <- Installed package assets (do not edit by hand)
  agents/
  framework/
  templates/
  tooling/
  AGENTS.md
  CHAT-WORKFLOW.md
.spec/
  .branch-mapping.json
  cosmic-detective/
    state.json
    00-current-status.md
    01-init.md
    assets/
      chapter-memory.json
cosmic-detective/
  chapters/
  manuscript-cosmic-detective-final.md
```

`.book-framework/` is the installed framework package inside the user's repository. `.spec/<slug>/` stores the book specs and workflow memory. `<slug>/` at repo root stores the actual book output.

## Key Points

- Chat is the primary workflow; CLI commands remain available for install, maintenance, and orchestration packets.
- Files persist on disk, so context survives chat sessions.
- Approval is explicit. The user controls each gate.
- Stage files are created lazily as the workflow advances.
