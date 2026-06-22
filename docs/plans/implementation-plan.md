# Implementation Plan

## Current MVP Stack

- Frontend: React + TypeScript + Vite.
- Routing: React Router.
- Styling: CSS variables and plain CSS organized around reusable classes.
- Icons: lucide-react.
- Charts: Recharts.
- Unit tests: Vitest.
- E2E smoke tests: Playwright.

## Phase 0: Workspace Preparation

Status: complete.

- Downloaded Stitch assets.
- Created product, design, engineering, and agent docs.
- Prepared source and test folder structure.

## Phase 1: App Scaffold

Status: implemented.

- Added Vite/React TypeScript app files.
- Added route map for the 7 primary MVP routes.
- Added build, dev, unit test, and E2E scripts.
- Added centralized CSS variables from `docs/design/design-system.md`.

## Phase 2: Design System Components

Status: implemented for MVP.

- Responsive app shell with desktop sidebar and mobile bottom navigation.
- Reusable UI primitives: button, icon button, card, input, textarea, chip, progress, metric card, AI panel, chart card, and page header.
- Shared visual language preserves the light UI, indigo primary actions, violet AI treatment, emerald progress states, compact cards, and subtle borders.

## Phase 3: Feature Screens

Status: implemented for MVP.

- Dashboard.
- New Journal Entry.
- Entry Details.
- AI Coach.
- Search Notes.
- Knowledge Quiz.
- Learning Analytics.

## Phase 4: Data And State

Status: implemented for MVP.

- Added structured mock data for journal entries, topics, AI insights, quiz questions, and analytics.
- Added journal draft save state.
- Added mock AI coach send/response state.
- Added search query/topic filtering and selected-result preview.
- Added quiz answer feedback, accuracy, and next-question state.

## Phase 5: Verification

Required before handoff:

- `npm run build` passes.
- `npm run test` passes.
- `npm run test:e2e` passes or any local browser dependency issue is documented.
- Responsive visual check at 390px, 768px, 1280px, and 1440px.
- Compare major screen structure against Stitch screenshots in `design/stitch/screens`.

## Phase 6: Production Readiness

Future work:

- Replace mock AI responses with API integration.
- Add persistence for entries, quiz sessions, and coach insights.
- Add authentication if multi-user storage is introduced.
- Add a full accessibility pass.
- Add performance and bundle-size pass after real data integration.
