# Go Profile

## Coding Guidance

- Prefer idiomatic Go structure and explicit error handling.
- Keep packages cohesive and functions focused.
- Avoid hidden side effects and unclear shared state.

## Verification Guidance

- Run formatting, vetting, tests, and module checks appropriate to the repo.
- If `govulncheck` is already available or already configured by the repo, run it; otherwise explicitly disclose that this framework baseline has no guaranteed no-extra-install native Go vulnerability audit command.
- Review dependency safety, input validation, path handling, SSRF, command execution, and auth boundaries when relevant.
