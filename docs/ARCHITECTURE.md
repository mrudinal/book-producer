# Architecture

## Overview

`book-producer` is a repo-scoped CLI package for installing a persistent AI-assisted book workflow into any repository.

The architecture separates three concerns:

1. **Package code** - the CLI and implementation in this repository
2. **Installed framework assets** - reusable workflow rules written into `.book-framework/`
3. **Book-specific state and content** - `.spec/<book-slug>/` plus `<book-slug>/` at repo root

## Target repository structure

After `book-producer install`:

```text
.book-framework/
  agents/
  framework/
  templates/
  tooling/
  AGENTS.md
  CHAT-WORKFLOW.md
AGENTS.md
CLAUDE.md
.github/copilot-instructions.md
.cursor/rules/book-producer.mdc
.agents/workflows/book-producer.md
```

After `book-producer init "My Book"`:

```text
.spec/
  .branch-mapping.json
  my-book/
    state.json
    00-current-status.md
    01-init.md
    assets/
      chapter-memory.json
      chapter-word-counts.json
my-book/
  chapters/
```

Later stage files are created lazily as stages start.

`state.json` carries both book-language settings (`mainLanguage`, `otherLanguages`) and the workflow/spec language (`instructionLanguage`). Book-scoped `.spec/<book-slug>/` files should stay in `instructionLanguage`; if that value changes explicitly later, the existing spec files should be translated before work continues.

## Orchestration

- Chapter generation is serialized for all tools, including Claude.
- Chapter extension is serialized for all tools, including Claude.
- Claude may still use orchestration support for research packets.
- Continuity checks are required before each next chapter.
- Under-target chapter audits are synchronized into `.spec/<book-slug>/assets/chapter-word-counts.json`.
- `book-producer orchestrate ...` writes the latest plan to `.spec/<book-slug>/assets/orchestration/`.

## Verification model

- `npm run build`
- `npm test`
- `npm run lint`
- `npm audit --omit=dev`
- `npm pack ./.release/npm`
- `npm pack ./.release/github`
