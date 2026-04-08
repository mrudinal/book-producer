# API Reference

`book-producer` is primarily a CLI package.

## Supported CLI surface

```bash
book-producer install
book-producer init "My Book"
book-producer init "My Book" --language "English" --other-languages "Spanish,French" --instruction-language "Spanish"
book-producer status [slug]
book-producer list
book-producer use <slug>
book-producer doctor
book-producer refresh
book-producer orchestrate chapters [slug] --tool <tool> --chapters 1,2
book-producer orchestrate chapters [slug] --tool <tool> --chapters 1,2 --batch-size <all|N>
book-producer orchestrate extend [slug] --tool <tool> --chapters 19,21
book-producer orchestrate extend [slug] --tool <tool> --under-target
book-producer orchestrate research [slug] --tool <tool> --topics "topic one,topic two"
```

## Stage 4 batching behavior

- For non-Claude tools, chapter orchestration prompts for a batch preference (`all`, `1`, or grouped `2+`) when none is stored.
- The same prompt warns that large uninterrupted runs may hit model/API limits.
- The preference is persisted in `.spec/<book-slug>/state.json` as `chapterBatchSize` and can be changed later.
- Regardless of batch preference, non-Claude chapter writing proceeds one chapter at a time in numeric order.

The same `chapterBatchSize` preference is reused when under-target chapters are extended through `book-producer orchestrate extend ...`.

## Language tracking behavior

- Stage 1 captures and persists `instructionLanguage`, `mainLanguage`, and `otherLanguages` in `.spec/<book-slug>/state.json`.
- By default, `instructionLanguage` follows the language of the first initialization prompt unless that prompt explicitly names another instruction/spec language.
- Initialization can set language values directly using `--language`, `--other-languages`, and `--instruction-language`.
- Language tracker values may be updated later whenever the user changes language requirements.
- If `instructionLanguage` changes explicitly later, the existing `.spec/<book-slug>/` workflow files should be translated before continuing.

## Internal module groups

- `src/commands/` - CLI command handlers
- `src/lib/book-idea-manager.ts` - book creation and slug matching
- `src/lib/branch-mapper.ts` - branch-to-book registry
- `src/lib/state-manager.ts` - state reads and writes
- `src/lib/template-engine.ts` - framework asset installation
- `src/lib/tool-adapters.ts` - managed tool entrypoint sections
- `src/lib/orchestration.ts` - init-time mode detection
- `src/lib/work-orchestrator.ts` - tool-specific chapter and research work packets

## Runtime layout

- `.book-framework/` - installed framework package inside a target repo
- `.spec/<book-slug>/` - book workflow memory and specs
- `<book-slug>/` - chapter files and manuscript output

## Stability note

The CLI and on-disk layout are the supported interfaces for `0.1.x`.
