# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PizzaMath is a subscription-based math worksheet platform for grades K–12. Users can browse, generate, and track completion of math worksheets aligned to California Common Core Standards. Key differentiator: AI-generated worksheets where users can request similar, easier, or harder variants at a custom level/format/unit/file type (PDF, doc, etc.).

## Tech Stack

React 19 + TypeScript (strict), Vite, Tailwind CSS, React Query, Zustand, React Hook Form + Zod, Vitest + React Testing Library. See `~/.claude/CLAUDE.md` for coding conventions.

## Commands

Once scaffolded, standard commands will be:

```bash
npm run dev          # start Vite dev server
npm run build        # production build
npm run test         # run all tests with Vitest
npm run test -- --reporter=verbose src/path/to/file.test.tsx  # single test file
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Domain Model

### Worksheet attributes
- `category` (required) — top-level CA Common Core domain (e.g., "Number & Operations")
- `subcategory` (required) — standard cluster within category
- `level` (required) — difficulty descriptor (e.g., "Beginner", "Intermediate", "Advanced")
- `schoolGrade` (optional) — K–12 grade level
- `author` (required)
- Each worksheet has a paired answer sheet

### Categories (California Common Core)
Seed the DB with these top-level categories and their subcategories:
- **Counting & Cardinality** (K)
- **Operations & Algebraic Thinking** (K–5)
- **Number & Operations in Base Ten** (K–5)
- **Number & Operations — Fractions** (3–5)
- **Measurement & Data** (K–5)
- **Geometry** (K–12)
- **Ratios & Proportional Relationships** (6–7)
- **The Number System** (6–8)
- **Expressions & Equations** (6–8)
- **Functions** (8–12)
- **Statistics & Probability** (6–12)
- **Number & Quantity** (9–12)
- **Algebra** (9–12)
- **Modeling** (9–12)

## Authentication & Roles

- Email/password registration + login (private site — all routes require auth)
- Subscription: $10/month or $100/year
- Roles: `user` | `admin`
- Seed admin on first deploy: ask the default admin email address and password to preset
- Admin capabilities: add/delete worksheets, access admin tools panel

## Key Features

### Worksheet generation (admin)
A textarea in the admin view enables a multi-turn conversation with a Claude agent. Once the user is satisfied, clicking **Generate** auto-populates Category, Subcategory, Level, and School Grade. The Claude API integration lives in `src/api/claude.ts`.

### Progress tracking (user)
Users record date, score, and comment per worksheet attempt. Stored per-user in the backend.

### Navigation (top bar)
- Left: PizzaMath logo + site name
- Center: Category dropdown → Subcategory dropdown (conditional on category selection)
- Right: Search (keyword + optional category filter), Account dropdown (account management, usage history), Logout

## Planned Architecture

```
src/
├── api/              ← typed fetch wrappers, Zod schemas, queryKeys.ts
│   └── claude.ts     ← Claude API integration for worksheet generation
├── features/
│   ├── auth/         ← login, register, subscription gate
│   ├── worksheets/   ← browse, view, generate, answer sheet
│   ├── progress/     ← tracking per-user attempt history
│   └── admin/        ← admin panel, worksheet CRUD, generation textarea
├── components/       ← shared UI (Navbar, CategoryDropdown, etc.)
├── stores/           ← Zustand (UI state only; server state via React Query)
├── pages/            ← route-level components
└── utils/
```

## Notes

- Worksheet generation conversation state is ephemeral (not persisted) — only the final generated worksheet is saved.
- File export (PDF, doc) is a user-facing feature; plan for a server-side generation step or a library like `react-pdf`.
