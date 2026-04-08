# Rust Profile

## Coding Guidance

- Prefer explicit error handling and readable ownership boundaries.
- Keep modules and traits focused.

## Verification Guidance

- Run formatting, clippy, tests, and build checks appropriate to the repo.
- If `cargo audit` is already available or already configured by the repo, run it; otherwise explicitly disclose that this framework baseline has no guaranteed no-extra-install native Rust vulnerability audit command.
- Review unsafe blocks, deserialization/input boundaries, command execution, path handling, and crate safety when dependencies change.
