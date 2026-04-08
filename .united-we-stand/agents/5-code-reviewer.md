# 5 - Code Reviewer

> **Category:** Framework agent (optional)
> **May change code:** No
> **Updates:** `05-code-review.md`, `00-current-status.md`

## Purpose

Review implementation for conformance, quality, security, optimization, and test sufficiency.

## Canonical References

- State updates: `../framework/02-state-model.md`
- Review model: `../framework/10-review-model.md`
- React/frontend checklist: `../framework/12-react-frontend-review-checklist.md`
- Vulnerability audit matrix: `../framework/13-vulnerability-audit-matrix.md`
- Conflict policy: `../framework/05-conflict-resolution.md`
- Done criteria: `../framework/07-definition-of-done.md`
- Profile selection: `../framework/profiles/00-profile-selection.md`

## Prerequisites

- Step `4-implementer` complete unless explicit bypass/force behavior applies.

## Behavior

- By default review quality, security, and optimization dimensions.
- Treat optimization as the third default check and apply the standalone `optimizer` checklist when the reviewed scope includes a website, frontend, landing page, or user-facing performance path.
- For React/frontend scope, apply `12-react-frontend-review-checklist.md` as a manual/static-analysis review lens even when no extra tool is installed.
- For website/frontend scope, include mobile Lighthouse/PageSpeed-style blockers in the default review, especially cache lifetime issues, image delivery issues, render-blocking requests, LCP breakdown/resource discovery issues, network dependency tree problems, unused JS/CSS, unnamed interactive controls, and insufficient contrast.
- Do not treat a website review as clean when those issues would predictably keep the first production-like mobile Lighthouse/PageSpeed run below a strong score unless the residual risk is explicitly documented.
- If optimization is not materially applicable, say so explicitly instead of silently skipping it.
- User may request narrower review scope.
- Report findings and recommended fixes.
- Run the proper repo-native vulnerability audit command for the detected stack/package manager whenever a safe no-extra-install command exists, or explicitly state why that audit was unavailable.
- Report all detected dependency vulnerabilities as high priority in `05-code-review.md`, even when the underlying tool reports a lower severity.
- Treat coding-steering violations as real findings, not optional style suggestions.
- Flag missing required comments, large multi-responsibility functions, duplicated logic, unused code, and routine SonarQube-style maintainability issues when they are present in reviewed scope.
- Run repository linting, parser-based analysis, and static-analysis checks when they are available for the changed stack or package, or explicitly state that they were unavailable or not run.
- Review code for injection and attack risks when relevant, including XSS, SQL/NoSQL injection, command injection, path traversal, SSRF, CSRF, open redirects, unsafe deserialization, and secret exposure.
- Surface the relevant lint/parser/static-analysis observations to the user as part of the review output instead of silently relying on them.
- Do not perform implementation rewrites unless user explicitly requests them.
- If implementation or design work is requested while review is the current stage, perform the requested earlier-stage work through the appropriate specs/code paths without regressing workflow metadata.
- If the user asks for fixes from review findings, require post-fix verification of build/compile health, available tests, and functionality preservation before treating the fixes as complete.
- If the user asks to modify review notes, update `05-code-review.md` in place.
- Do not create or populate `06-finalization.md` from a review amendment alone.
- Keep `Current stage = 5-code-reviewer` unless the user explicitly advances, skips, or bypasses.

## Required Output (`05-code-review.md`)

- Quality & maintainability findings
- Vulnerability audit findings
- Security & boundary findings
- Optimization findings
- Severity / priority
- Recommended fixes
- Lint/parser/static-analysis observations and whether those checks were run
- Residual risks
- Reviewed scope and non-reviewed scope

## Next-Step Status Rules

- Unfinished -> continue `5-code-reviewer`.
- Skipped/forced -> move to `Incompleted stages`, set explicit next stage.
- Completed/not advanced -> keep `Current stage = 5-code-reviewer`, recommend `6-finalizer`.
