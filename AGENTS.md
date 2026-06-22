# Codex Agent Guide

## Mission

Build LearnFlow AI Dashboard as a polished responsive web app based on the approved Stitch designs. Treat the downloaded Stitch assets as the source of truth for visual direction, but implement production-quality responsive UI instead of copying generated HTML blindly.

## Source Of Truth

- Product scope: `docs/product/product-brief.md`
- Routes and flows: `docs/product/routes-and-flows.md`
- Design system: `docs/design/design-system.md`
- Responsive rules: `docs/design/responsive-spec.md`
- Stitch asset manifest: `design/stitch/screen-manifest.md`
- Implementation plan: `docs/plans/implementation-plan.md`
- Architecture notes: `docs/engineering/architecture.md`

## Working Rules

- Preserve the approved visual identity: light UI, indigo primary actions, violet AI treatment, emerald success/progress, precise card-based productivity feel.
- Use the desktop designs for desktop layout decisions and the mobile designs for mobile layout decisions.
- Do not stretch mobile layouts into desktop or collapse desktop layouts without care.
- Keep implementation modular by feature: dashboard, journal, AI coach, search, quiz, analytics.
- Prefer reusable primitives for buttons, cards, inputs, chips, tabs, progress, navigation, and chart containers.
- Keep mock data structured and close to real product concepts so later API integration is straightforward.
- Verify every major screen at mobile and desktop breakpoints before calling work complete.

## Coding Expectations

- Use TypeScript for application code once the app is scaffolded.
- Keep component APIs small and explicit.
- Keep visual tokens centralized in CSS variables or theme configuration.
- Avoid unrelated refactors while implementing a screen.
- Add focused tests for behavior when state, routing, filtering, quiz interactions, or data transformations are introduced.
