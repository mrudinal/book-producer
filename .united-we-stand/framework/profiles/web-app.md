# Web App Profile

## Product Boundaries

- Consider routing, screen states, loading/error states, form validation, auth boundaries, and accessibility.
- Consider user-controlled input paths, client-visible secrets, unsafe redirects, third-party script impact, and reduced-motion handling when relevant.
- For React/Next/Vite-style web apps, apply `../12-react-frontend-review-checklist.md` during implementation and review.

## Verification

- Verify affected pages, components, or flows render correctly in local/dev environment when applicable.
- Confirm client-visible error handling and loading states where impacted.
- Confirm impacted routes boot without runtime crashes.
- After fixes, verify that key user-facing flows still work and that no intended functionality was removed while resolving the issue.
