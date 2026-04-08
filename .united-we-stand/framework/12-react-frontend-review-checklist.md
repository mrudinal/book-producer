# React / Frontend Review Checklist

Use this document as a framework-native checklist for React, Next.js, Vite, Remix, Gatsby, Expo web, and similar frontend reviews when no extra dependency is installed.

This is a review lens, not a bundled parser or external tool requirement.

## Scope

Apply when the reviewed code materially includes:

- React components or hooks
- frontend routing/layout code
- client rendering and hydration
- bundle-size or delivery concerns
- Next.js/App Router or similar framework code

## State And Effects

Check for:

- derived state computed in `useEffect` instead of during render
- `fetch()` in effects where a server/data-layer approach is more appropriate
- too many `setState` calls in one effect
- effects being used like event handlers
- `useState` initialized from props and then expected to stay in sync
- related local state that should likely be modeled with `useReducer`
- stale-closure `setState(value + 1)` patterns
- object/array literals in hook dependency arrays

## Rendering And Performance

Check for:

- unnecessary `useMemo`/memoization for trivially cheap expressions
- inline object/array/function props that defeat memoized child components
- hydration flicker from mount-only `useEffect` state resets
- sequential async work that should use `Promise.all()`
- repeated expensive work during render
- unnecessary rerenders from unstable references

## Animation And Motion

Check for:

- `transition: all`
- layout-property animation instead of transform/opacity
- permanent `will-change`
- large animated blur effects
- `scale(0)` entrance animations
- lack of reduced-motion handling when motion libraries are used
- hover-only behavior on touch devices

## Bundle Size And Delivery

Check for:

- barrel imports that weaken tree-shaking
- full-library imports such as `lodash` instead of path imports
- heavy date/moment-style libraries without justification
- heavy client libraries that should be lazy/dynamically loaded
- synchronous third-party scripts
- full `framer-motion` usage where a lighter pattern would work
- dead code, unused files, unused exports, unused types, and duplicate exports

## Next.js And Route Delivery

Check for:

- `<img>` instead of `next/image`
- missing `sizes` for responsive `next/image`
- native `<script>` instead of `next/script`
- inline `Script` without a stable `id`
- Google Fonts `<link>` usage instead of `next/font`
- stylesheet `<link>` usage that bypasses bundling
- polyfill CDN scripts that duplicate framework behavior
- missing page metadata
- client-side redirects in effects when framework-native redirect handling should be used
- `useSearchParams` without the required suspense boundary
- GET handlers with side effects or mutating route semantics

## Security Crossover

Check for:

- hardcoded client-side secrets
- unsafe redirects
- GET handlers that mutate state
- direct use of `eval`, `new Function`, or string-based timers
- user-controlled content flowing into unsafe rendering or execution sinks

## Review Output Guidance

When these checks produce findings:

- surface them under quality, security, or optimization as appropriate
- treat them as first-class review evidence, not optional polish
- keep manual findings explicit about affected files/components and likely user impact
