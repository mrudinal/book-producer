# FAQ

## What gets installed in a user's repository?

`.book-framework/` is installed in the target repository. That is the installed framework package.

Managed tool entrypoints are also created or refreshed so the supported tools point back to `.book-framework/`.

## Where are the book specs stored?

In:

```text
.spec/<book-slug>/
```

That folder stores workflow memory and stage specs.

## Where are the actual chapters and manuscript stored?

At:

```text
<book-slug>/
```

in the repository root.

## Are stage files created all at once?

No.

- Initialization creates `00-current-status.md`, `01-init.md`, and `state.json`.
- Later numbered stage files are created lazily as the user approves each stage.
- Outside initialization, no more than two numbered stage files should be created in one pass.

## Which tools are supported?

The framework is designed to work with Claude, Copilot, Cursor, and Antigravity.

- Chapter generation stays sequential for all tools (including Claude).
- Claude can still use orchestration helpers for research tasks.

## Is multilingual writing supported?

Yes.

- Stage 1 tracks an instruction/spec language (`instructionLanguage`), a primary book language (`mainLanguage`), and additional languages (`otherLanguages`).
- These values are stored in `.spec/<book-slug>/state.json`.
- By default, `instructionLanguage` follows the language of the first initialization prompt unless the user explicitly chooses another instruction/spec language in that prompt.
- Users can change language settings at any time.
- If `instructionLanguage` changes explicitly, the existing `.spec/<book-slug>/` workflow files should be translated before continuing.
- The book can remain mostly in one language while including selected parts in other languages.

## In stage 4, can non-Claude tools write all chapters in one go?

Yes, but with explicit batch selection.

- If no non-Claude batch preference is stored yet, stage 4 asks the user to choose `all`, `1`, or grouped sizes (`2+`).
- The same prompt warns that larger uninterrupted runs may exhaust model/API limits.
- The choice is saved in `.spec/<book-slug>/state.json` as `chapterBatchSize` and can be changed later.
- Even when batch size is `all` or grouped, writing still proceeds one chapter at a time in numeric order.

## Does the package require Git?

Git gives the best experience because branch mapping uses the current branch name. Fresh repos are supported, including unborn branches before the first content commit.

## Do upgrades overwrite my book content?

No. `book-producer install --force` refreshes `.book-framework/` and the managed tool-entry sections only. It does not overwrite `.spec/<book-slug>/` or `<book-slug>/chapters/`.
