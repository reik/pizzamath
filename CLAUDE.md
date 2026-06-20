# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

PizzaMath is a subscription-based math worksheet platform for grades K–12. Users can browse, generate, and track completion of math worksheets aligned to California Common Core Standards. Key differentiator: AI-generated worksheets where users can request similar, easier, or harder variants.

- **Domain model & roles:** see [`docs/DOMAIN.md`](docs/DOMAIN.md)
- **Architecture & feature detail:** see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **CI, testing & deploy:** see [`docs/CI.md`](docs/CI.md)
- **End-user guide:** see [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)

## Tech stack

React 19 + TypeScript (strict), Vite, Tailwind CSS, React Query, Zustand, React Hook Form + Zod, Vitest + React Testing Library. See `~/.claude/CLAUDE.md` for coding conventions.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # production build
npm run test         # Vitest unit tests
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run e2e          # Cypress E2E (requires dev server running)
```

## Documentation upkeep

`docs/USER_GUIDE.md` is the end-user / admin product doc. **It must stay in sync with the app.**

Any commit or PR that meaningfully changes user-facing behavior MUST update `docs/USER_GUIDE.md` in the same change. "User-facing" means:

- New or removed route under `src/pages/**`
- New or removed feature flow under `src/features/**` (anything a user can click, see, or trigger)
- New or removed admin capability under `src/pages/admin/**`
- Change to the sign-up / subscription / pricing flow
- Change to upload, grading, targeted-practice, or insights behavior
- Any change to navigation, top bar, or account menu

If the change is purely internal (refactor, types, tests, dependency bump, server-only schema with no user-visible effect), no doc update is needed.

When updating the doc, prefer editing the matching section rather than appending. Keep the existing tone: short steps, plain language, no marketing copy. Update the troubleshooting table if the change introduces a new failure mode.
