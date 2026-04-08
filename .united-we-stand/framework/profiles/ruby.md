# Ruby Profile

## Coding Guidance

- Prefer readable, intention-revealing names and small objects/methods.
- Keep magic and metaprogramming proportionate to maintainability.

## Verification Guidance

- Run tests, linters, and dependency safety checks appropriate to the repo.
- Prefer repo-configured Ruby dependency safety tooling when present; otherwise explicitly disclose that this framework baseline has no guaranteed no-extra-install native Ruby audit command.
- Review injection, unsafe metaprogramming/deserialization, command execution, and secret exposure when relevant.
