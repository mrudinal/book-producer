# Review Model

## Review Modes

### Mode A: Workflow Status Review (`0-status-checker` deep review)

Use when user asks for status, gaps, or overall check.

Validate:

- current stage consistency and status integrity
- plan/design feasibility before implementation
- missing requirement links between earlier and later stages
- stale or contradictory spec sections

A **gap** is any requirement, feature, or constraint requested in earlier stages that is absent, unsupported, or contradicted in later stages.

### Mode B: Code Review (`5-code-reviewer`)

Use for implementation review requests.

Default scope includes all of:

- Quality and Maintainability
- Adversarial Security and Boundaries
- Optimization (default third check)

User may explicitly narrow scope.

## Review Dimensions

1. **Conformance**
   - implementation matches branch specs or drift is explicitly documented
2. **Quality**
   - readability, complexity, modularity, error handling, duplication
   - required comment coverage from coding steering
   - oversized or multi-responsibility functions
   - routine SonarQube-style maintainability findings that should have been prevented during implementation
   - lint, parser-based analysis, and static-analysis findings relevant to the changed scope
   - React/frontend static-review checklist findings when that stack is in scope
3. **Security**
   - dependency vulnerability audit findings from safe repo-native/package-manager-native commands when available
   - input validation/injection boundaries
   - XSS, SQL/NoSQL injection, command injection, path traversal, SSRF, CSRF, open redirects, unsafe deserialization, and secret exposure when relevant
   - authn/authz ownership checks (BOLA/IDOR)
   - data exposure minimization
   - dependency/supply-chain considerations
4. **Optimization**
   - initial page work, lazy-loading, and startup cost
   - duplicated initialization, unnecessary listeners, and repeated bootstrap work
   - media, image, font, and third-party delivery cost
   - main-thread work, forced reflow, DOM size, and offscreen rendering cost
   - mobile behavior, layout stability, caching, render-blocking requests, LCP breakdown/resource discovery, network dependency chains, and production-only bundle risks
   - unused JS/CSS and late-discovered critical resources
   - Lighthouse-scored accessibility issues that materially affect launch-readiness, especially unnamed interactive controls and insufficient contrast
5. **Testing**
   - tests exist and cover high-risk paths proportionately
6. **Documentation**
   - implementation and finalization notes are complete and truthful

## Output Requirements

Review output should state:

- what was reviewed
- what was not reviewed
- findings
- vulnerability audit findings or an explicit unavailable/not-run note
- optimization findings or an explicit not-applicable note
- for website/frontend scope, an explicit note on whether the remaining findings are compatible with a realistic strong mobile Lighthouse/PageSpeed outcome
- severity/priority
- recommended fixes
- lint/parser/static-analysis observations and whether those checks were run
- residual risks

## Reviewer Behavior Constraints

- report discrepancies by default
- run safe repo-native vulnerability audit commands when available for the selected stack/package manager, or explicitly disclose that no no-install command was available
- report detected dependency vulnerabilities as high priority findings in review output
- treat mandatory coding-steering violations as review findings that block a clean review
- use available lint/parser/static-analysis results as first-class review evidence instead of optional background context
- do not rewrite lower stages unless user explicitly requests it
- if drift is found, apply conflict policy (`05-conflict-resolution.md`)
