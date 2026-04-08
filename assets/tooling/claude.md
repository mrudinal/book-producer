# Claude Adapter

Claude may use orchestration helpers, but chapter file generation is strictly sequential.

## Read order

1. `.book-framework/tooling/shared.md`
2. `.book-framework/framework/09-orchestration-policy.md`
3. `.spec/<book-slug>/state.json`
4. Current stage file and stage agent

## Working rules

- Use `book-producer orchestrate chapters <slug> --tool claude --chapters ...` for sequential chapter packets in numeric order.
- Use `book-producer orchestrate research <slug> --tool claude --topics ...` for research packets.
- Before each chapter, run continuity checks against prior chapters and chapter-memory summaries.
- Never generate two chapter files simultaneously.
- Respect explicit approval gates before starting the next stage.
