# C# Profile

## Coding Guidance

- Favor readable methods, clear naming, and predictable error handling.
- Keep classes and namespaces cohesive.

## Verification Guidance

- Run build, test, analyzer, and package safety checks appropriate to the repo.
- When supported by the active SDK/project style, run `dotnet list package --vulnerable`.
- Review deserialization, injection, path handling, SSRF, authz, and secret exposure when relevant.
