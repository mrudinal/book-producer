# Cursor Adapter

Cursor integrations must run `book-producer` work sequentially.

## Read order

1. `.book-framework/tooling/shared.md`
2. `.book-framework/framework/09-orchestration-policy.md`
3. `.spec/<book-slug>/state.json`
4. Current stage file and stage agent

## Working rules

- Use `book-producer orchestrate ... --tool cursor` to produce serialized work packets.
- Do not parallelize chapter or research writes.
- Keep approval gates and stage-file creation rules intact.
- For stage-4 chapter work, if `chapterBatchSize` is missing in `.spec/<book-slug>/state.json`, ask the user to pick `all`, `1`, or grouped batch sizes (`2+`) and warn that large batches may exhaust model/API limits.
- Persist and reuse `chapterBatchSize`, but allow user overrides at any time.
- Even with grouped/all batches, write chapter files one-by-one in numeric order.
