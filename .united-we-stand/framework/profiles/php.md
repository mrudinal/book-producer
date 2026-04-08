# PHP Profile

## Coding Guidance

- Prefer modern, clear PHP with explicit names and cohesive classes/modules.
- Avoid hidden globals and unclear side effects.

## Verification Guidance

- Run lint, tests, static analysis, and dependency checks appropriate to Composer and the repo.
- When `composer.lock` is present, run `composer audit`.
- Review input validation, injection boundaries, file-path handling, authz, and secret exposure when relevant.
