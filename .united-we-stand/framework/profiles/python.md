# Python Profile

## Coding Guidance

- Follow clear, idiomatic Python.
- Favor small functions, explicit names, and readable control flow.
- Prefer standard library and well-maintained dependencies.

## Documentation Guidance

- Use docstrings where they materially improve maintainability.

## Verification Guidance

- Run formatter, linter, tests, and packaging/build checks appropriate to the repo.
- Prefer repo-configured dependency vulnerability tooling when present; otherwise explicitly disclose that Python has no guaranteed no-extra-install native audit command in this framework baseline.
- Review input handling, deserialization, SSRF/file-path boundaries, command execution, and secret exposure when relevant.
