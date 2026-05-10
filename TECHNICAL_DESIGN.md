# Technical Design Document — PizzaMath

> Audience: Whole team (engineers + stakeholders)
> Last updated: 2026-04-17

---

## 1. Product Overview

**One-line pitch:** PizzaMath is a subscription-based K–12 math worksheet platform powered by AI generation and aligned to California Common Core Standards.

**The problem it solves:** Teachers and parents struggle to find grade-appropriate, standards-aligned math worksheets at the right difficulty level. Existing tools are generic; PizzaMath lets users request AI-generated variants (easier, harder, different format) on demand, and upload photos of handwritten problems to get digitized, editable worksheets.

**Who it's for:** K–12 students, parents, and teachers in California.

### Core Features

| Feature | Description |
|---|---|
| Worksheet browsing | Filter by CA Common Core category, subcategory, level, and grade |
| AI worksheet generation | Admins use a multi-turn Claude chat to generate new worksheets with auto-populated metadata |
| Answer sheets | Every worksheet has a paired answer key |
| Progress tracking | Users record date, score, and comment per attempt |
| Subscription gate | All content requires an active $10/month or $100/year subscription |
| Admin panel | Full CRUD for worksheets + user management |
| File export | Download worksheets as PDF or DOC |
| **User photo uploads** | Users photograph handwritten problems; Claude vision digitizes them into editable worksheets with auto-detected category, level, and grade |
| **Generate Similar Problem** | On any uploaded worksheet, one click appends a Claude-generated problem in the same style |
| **Math rendering** | Worksheet content renders LaTeX math (KaTeX) and interactive graphs (Mafs) |

### What This Does NOT Do

- No real-time collaboration or classroom management
- No automated grading or student performance analytics
- No video or interactive content — worksheets only
- No payment processing (mocked in current implementation)
- No email notifications

**Platform scope:** Web application (desktop-first, responsive to tablet/mobile)

---

## 2. Tech Stack

### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI Framework | React | 19.2.5 | Component-based UI |
| Language | TypeScript | 6.0.2 | Type safety (strict mode) |
| Bundler | Vite | 8.0.4 | Dev server + production build |
| Routing | React Router DOM | 7.14.0 | Client-side routing |
| Server State | TanStack React Query | 5.99.0 | API data fetching + caching |
| Client State | Zustand | 5.0.12 | UI state (auth, filters) |
| Forms | React Hook Form | 7.72.1 | Controlled form handling |
| Validation | Zod | 4.3.6 | Schema validation + type inference |
| Styling | Tailwind CSS | 4.2.2 | Utility-first CSS |
| Class Utility | clsx + tailwind-merge | 2.1.1 / 3.5.0 | Conditional class composition via `cn()` |
| AI Integration | Anthropic SDK | 0.88.0 | Claude API (vision + streaming) |
| Math Rendering | KaTeX + remark-math + rehype-katex | — | LaTeX typesetting in worksheet content |
| Graph Rendering | Mafs | — | Interactive coordinate plane graphs |

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Server | Express | 4.x | HTTP REST API |
| Language | TypeScript (compiled via tsx) | — | Type-safe server code |
| Database | better-sqlite3 | — | SQLite — persistent local DB |
| Auth | jsonwebtoken + bcryptjs | — | JWT signing, password hashing |
| Validation | Zod | — | Input validation on all routes |
| File Storage | Local disk (`/uploads/`) | — | User-uploaded worksheet images |
| ID generation | uuid | — | UUIDs for all primary keys |

### Testing & Mocking

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Test Runner | Vitest | 4.1.4 | Fast unit/integration tests |
| DOM Testing | Testing Library React | 16.3.2 | User-centric component tests |
| User Events | Testing Library User Event | 14.6.1 | Realistic user interaction simulation |
| DOM Matchers | Testing Library jest-dom | 6.9.1 | Extended DOM assertions |
| DOM Simulator | jsdom | 29.0.2 | Browser-like environment in Node |
| API Mocking | MSW | 2.13.2 | Network-level mock handlers (dev/test) |
| Mock DB | @mswjs/data | 0.16.2 | In-memory relational data store |
| Coverage | @vitest/coverage-v8 | 4.1.4 | Code coverage reporting |

### Tooling

| Tool | Version | Purpose |
|---|---|---|
| ESLint | 9.39.4 | Linting (flat config v9) |
| typescript-eslint | 8.58.0 | TypeScript-aware linting |
| eslint-plugin-react-hooks | 7.0.1 | Hooks rules enforcement |
| concurrently | — | Run frontend + backend in parallel (`npm run dev:all`) |

---

## 3. Architecture

### Current Architecture (Real Backend)

PizzaMath runs as a React SPA backed by a real Express + SQLite server. MSW is still available for frontend-only development (toggled via `VITE_USE_MOCK`), but the production path uses the Express backend.

```
Browser
  │
  ├── React App (Vite SPA)
  │     ├── React Router v7 (client-side routing)
  │     ├── TanStack React Query (server state)
  │     ├── Zustand (auth + filter UI state)
  │     └── Anthropic SDK (Claude vision + streaming)
  │
  └── Vite Dev Proxy
        ├── /api  → Express :3001
        └── /uploads → Express :3001 (static file serving)

Express Server (:3001)
  ├── JWT auth middleware (requireAuth / requireAdmin)
  ├── Zod validation on all routes
  ├── Routes: /auth, /categories, /worksheets, /progress, /users, /user-uploads
  ├── better-sqlite3 (SQLite DB at data/pizzamath.db)
  └── Static file serving for /uploads (user-uploaded images)
```

### Request Flow

```
User Action
    │
    ▼
React Component
    │  calls hook
    ▼
React Query / Zustand
    │  calls api/ layer
    ▼
apiFetch() utility
    │  fetch() with Authorization: Bearer <jwt>
    ▼
Vite Proxy → Express :3001
    │  JWT verified by requireAuth middleware
    │  Body parsed + validated by Zod schema
    ▼
SQLite DB (better-sqlite3)
    │  returns row(s)
    ▼
Route handler maps row → DTO → JSON response
    │
    ▼
React Query cache → Component re-render
```

### MSW Toggle

Set `VITE_USE_MOCK=false` (default when using `npm run dev:backend`) to bypass MSW and route requests to the real backend. Set `VITE_USE_MOCK=true` (or omit) to use the mock service worker for frontend-only development.

```bash
npm run dev:mock       # frontend only, MSW active
npm run dev:backend    # frontend only, VITE_USE_MOCK=false, proxy to :3001
npm run server         # backend only (tsx watch)
npm run dev:all        # frontend + backend concurrently
```

### Source Tree

```
pizzamath/
├── public/
├── src/
│   ├── api/           ← typed fetch wrappers + Zod schemas + queryKeys
│   ├── components/    ← shared UI (Navbar, guards, layout)
│   ├── features/      ← auth, worksheets, progress, admin, uploads
│   ├── mocks/         ← MSW handlers + @mswjs/data schema + seed
│   ├── pages/         ← route-level components only
│   ├── stores/        ← Zustand (filter state)
│   ├── test/          ← Vitest global setup
│   ├── types/         ← shared global TypeScript types
│   ├── utils/         ← apiFetch, cn, logger
│   ├── App.tsx
│   ├── main.tsx       ← MSW init (skipped when VITE_USE_MOCK=false)
│   └── router.tsx     ← React Router config
├── server/
│   ├── src/
│   │   ├── db.ts          ← SQLite schema, seed, DTO helpers
│   │   ├── index.ts       ← Express app entry
│   │   ├── middleware/
│   │   │   └── auth.ts    ← JWT sign/verify, requireAuth, requireAdmin
│   │   └── routes/
│   │       ├── auth.ts
│   │       ├── categories.ts
│   │       ├── worksheets.ts
│   │       ├── progress.ts
│   │       ├── users.ts
│   │       └── userUploads.ts
│   ├── scripts/
│   │   └── seed-worksheets.cjs  ← one-time seed for 120 CC worksheets
│   └── package.json
├── data/
│   └── pizzamath.db   ← SQLite database (gitignored)
├── uploads/           ← user-uploaded images (gitignored)
├── CLAUDE.md
├── TECHNICAL_DESIGN.md
├── package.json
└── vite.config.ts
```

### Auth Architecture

- **Tokens:** RS256-style JWT signed with `JWT_SECRET` env var (server throws at startup if missing)
- **Storage:** JWT stored in `localStorage` via Zustand `persist` middleware (`pizzamath-auth`)
- **Transport:** Every API request attaches `Authorization: Bearer <token>` via the shared `apiFetch` wrapper
- **Guards:** Three guard components wrap routes: `AuthGuard` → `SubscriptionGuard` → `AdminGuard`
- **Passwords:** bcrypt (cost factor 10) via `bcryptjs`

### User Upload Flow

```
User drops image file
    │
    ▼
UploadZone reads file as base64 data URL
    │
    ▼
analyzeUploadedImage() → Anthropic vision API
    │  Returns: title, categoryId, subcategoryId, level,
    │           schoolGrade, content (LaTeX markdown), answerContent
    ▼
POST /api/user-uploads (base64 body)
    │  Server: Zod validates, decodes base64, writes image to /uploads/<uuid>.<ext>
    │  Stores row in user_uploads table
    ▼
UploadedWorksheetCard rendered in browse grid + My Uploads page
```

### Generate Similar Problem Flow

```
User clicks "Generate Similar Problem"
    │
    ▼
generateSimilarProblem(content, answerContent) → Claude API
    │  Returns: { problem, answer }
    ▼
Append to worksheet: newContent = content + "\n\n---\n\n" + problem
    │
    ▼
PATCH /api/user-uploads/:id { content, answerContent }
    │  Server updates DB row
    ▼
React Query invalidates detail cache → page re-renders with new problem
```

---

## 4. Database Schema

PizzaMath uses **SQLite** (via `better-sqlite3`) stored at `data/pizzamath.db`. The schema is created on server startup via `db.ts`; `seedOnce()` populates categories, subcategories, a default admin, and 123 worksheets if the database is empty.

### ER Overview

```
User ──────────────── ProgressEntry
 │                         │
 │                         │ worksheetId
 │                    Worksheet ──── Subcategory ──── Category
 │
 └────────────────── UserUpload ──── Subcategory ──── Category
```

---

#### `users`

| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PK |
| email | TEXT | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| role | TEXT ('user'\|'admin') | NOT NULL, DEFAULT 'user' |
| account_status | TEXT ('active'\|'suspended') | NOT NULL, DEFAULT 'active' |
| subscription_status | TEXT ('active'\|'inactive'\|'trial') | NOT NULL, DEFAULT 'inactive' |
| subscription_plan | TEXT ('monthly'\|'annual') \| NULL | NULLABLE |
| subscription_expires_at | TEXT (ISO datetime) \| NULL | NULLABLE |
| created_at | TEXT (ISO datetime) | NOT NULL |

---

#### `categories`

| Column | Type | Constraints |
|---|---|---|
| id | TEXT | PK (e.g., `cat-1`) |
| name | TEXT | NOT NULL |
| grades | TEXT | NOT NULL (e.g., `"K–5"`) |

**14 seeded categories** (CA Common Core):
`Counting & Cardinality`, `Operations & Algebraic Thinking`, `Number & Operations in Base Ten`, `Number & Operations — Fractions`, `Measurement & Data`, `Geometry`, `Ratios & Proportional Relationships`, `The Number System`, `Expressions & Equations`, `Functions`, `Statistics & Probability`, `Number & Quantity`, `Algebra`, `Modeling`

---

#### `subcategories`

| Column | Type | Constraints |
|---|---|---|
| id | TEXT | PK (e.g., `sub-1-1`) |
| name | TEXT | NOT NULL |
| category_id | TEXT | FK → categories.id, NOT NULL |

---

#### `worksheets`

| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PK |
| title | TEXT | NOT NULL |
| category_id | TEXT | FK → categories.id, NOT NULL |
| subcategory_id | TEXT | FK → subcategories.id, NOT NULL |
| level | TEXT ('Beginner'\|'Intermediate'\|'Advanced') | NOT NULL |
| school_grade | TEXT ('K','1'–'12') \| NULL | NULLABLE |
| author | TEXT | NOT NULL |
| content | TEXT (markdown + LaTeX) | NOT NULL |
| answer_content | TEXT (markdown) | NOT NULL |
| created_at | TEXT (ISO datetime) | NOT NULL |

**123 seeded worksheets** across all 14 categories (2 per subcategory from the full CA Common Core catalog).

---

#### `progress_entries`

| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PK |
| user_id | TEXT | FK → users.id, NOT NULL |
| worksheet_id | TEXT | NOT NULL |
| worksheet_title | TEXT | NOT NULL (denormalized) |
| date | TEXT (YYYY-MM-DD) | NOT NULL |
| score | INTEGER (0–100) | NOT NULL |
| comment | TEXT | NOT NULL (empty string if none) |

---

#### `user_uploads`

| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PK |
| user_id | TEXT | FK → users.id, NOT NULL |
| title | TEXT | NOT NULL |
| category_id | TEXT | FK → categories.id, NOT NULL |
| subcategory_id | TEXT | FK → subcategories.id, NOT NULL |
| level | TEXT ('Beginner'\|'Intermediate'\|'Advanced') | NOT NULL |
| school_grade | TEXT \| NULL | NULLABLE |
| content | TEXT (markdown + LaTeX) | NOT NULL (editable, appended on generate) |
| answer_content | TEXT (markdown) | NOT NULL (editable, appended on generate) |
| image_path | TEXT | NOT NULL (filename in `/uploads/`) |
| created_at | TEXT (ISO datetime) | NOT NULL |

> The original image is served at `/uploads/<image_path>` and embedded in the worksheet viewer as a collapsible "Show original image" section.

### Indexes Summary

| Table | Index | Type |
|---|---|---|
| users | email | UNIQUE |
| subcategories | category_id | INDEX |
| worksheets | category_id, subcategory_id | COMPOSITE INDEX |
| worksheets | level | INDEX |
| progress_entries | user_id | INDEX |
| progress_entries | worksheet_id | INDEX |
| user_uploads | user_id | INDEX |

---

## 5. API Specification

**Base URL:** `/api`
**Auth:** `Authorization: Bearer <jwt>`
**Content-Type:** `application/json`
**Validation:** All mutation endpoints validate the request body with Zod; invalid requests return `400 { message, errors }`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | None | `{email, password}` → `{token, user}` |
| POST | `/auth/register` | None | `{email, password (min 8), plan}` → `{token, user}` |
| POST | `/auth/logout` | Yes | → `{ok: true}` |
| GET | `/auth/me` | Yes | Returns current `User` |
| POST | `/auth/change-password` | Yes | `{currentPassword, newPassword (min 8)}` → `{ok: true}` |

### Worksheets

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/worksheets` | Yes | List worksheets. Query: `?categoryId=&subcategoryId=&keyword=` |
| GET | `/worksheets/:id` | Yes | Get single worksheet |
| POST | `/worksheets` | Admin | Create worksheet |
| DELETE | `/worksheets/:id` | Admin | Delete worksheet |
| GET | `/worksheets/:id/export` | Yes | Export. Query: `?format=pdf\|doc` |

### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/categories` | Yes | All categories with nested `subcategories[]` |

### Progress

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/progress` | Yes | `?userId=` → `ProgressEntry[]` |
| POST | `/progress` | Yes | `{worksheetId, date, score, comment}` → new entry |

### Users (Admin)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | List all users |
| POST | `/users` | Admin | Create user |
| PATCH | `/users/:id` | Admin | Update user (suspend, etc.) |
| DELETE | `/users/:id` | Admin | Delete user |

### User Uploads

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/user-uploads` | Yes | `?userId=` → `UserUpload[]` for that user |
| GET | `/user-uploads/:id` | Yes | Single upload |
| POST | `/user-uploads` | Yes | `{userId, title, categoryId, subcategoryId, level, schoolGrade, content, answerContent, originalImageDataUrl (base64)}` → saves image to disk, stores row |
| PATCH | `/user-uploads/:id` | Yes | `{content?, answerContent?}` — used by "Generate Similar Problem" |
| DELETE | `/user-uploads/:id` | Yes | Deletes DB row + image file from disk |

---

## 6. Frontend Component Structure

### Routes

| Route | Page | Auth | Subscription | Admin |
|---|---|---|---|---|
| `/login` | LoginPage | No | No | No |
| `/register` | RegisterPage | No | No | No |
| `/subscribe` | SubscribePage | No | No | No |
| `/` | BrowsePage | Yes | Yes | — |
| `/worksheets/:id` | WorksheetPage | Yes | Yes | — |
| `/my-uploads` | MyUploadsPage | Yes | Yes | — |
| `/my-uploads/:id` | UploadedWorksheetPage | Yes | Yes | — |
| `/account` | AccountPage | Yes | Yes | — |
| `/history` | UsageHistoryPage | Yes | Yes | — |
| `/admin` | AdminPage | Yes | Bypassed | Yes |
| `/admin/generate` | GeneratePage | Yes | Bypassed | Yes |

### Pages

| Page | Responsibility |
|---|---|
| LoginPage | Email/password login form |
| RegisterPage | Registration + subscription plan selection |
| SubscribePage | Prompt inactive subscribers to subscribe |
| BrowsePage | Worksheet listing merging admin worksheets and user uploads; filterable by category/subcategory/keyword |
| WorksheetPage | Full worksheet view, answer sheet toggle, export, progress logging |
| MyUploadsPage | Grid of user's uploaded worksheets; "+ Upload Image" toggles UploadZone; hover-reveal delete |
| UploadedWorksheetPage | Upload viewer: worksheet/answer toggle, original image reveal, Generate Similar Problem button |
| AccountPage | Change password, view subscription status |
| UsageHistoryPage | User's progress history table |
| AdminPage | Admin dashboard: worksheet CRUD + user management |
| GeneratePage | Multi-turn Claude chat → worksheet generation |

### Shared Components (`src/components/`)

| Component | Purpose |
|---|---|
| AppLayout | Page shell with Navbar |
| Navbar | Top bar: logo, category dropdowns, search, account menu |
| CategoryDropdown | Controlled CA Common Core category selector |
| SubcategoryDropdown | Conditional subcategory selector (depends on selected category) |
| SearchBar | Keyword + optional category filter |
| AccountMenu | Dropdown: account link, My Uploads link, history link, logout |
| AuthGuard | Redirects unauthenticated users to `/login` |
| SubscriptionGuard | Redirects inactive subscribers to `/subscribe` (admins bypass) |
| AdminGuard | Redirects non-admins to `/` |

### Feature Modules (`src/features/`)

**auth/**
- `LoginForm`, `RegisterForm`, `ChangePasswordForm` — form components
- `useAuth` — login/register/logout mutations + current user query
- `useSubscriptionGate` — subscription status check
- `store.ts` — Zustand auth store (user + token, persisted)

**worksheets/**
- `WorksheetCard` — preview card in browse grid
- `WorksheetViewer` — full content + answer sheet toggle
- `ExportButton` — PDF/DOC download trigger
- `useWorksheets` — filtered worksheet list query

**progress/**
- `ProgressEntryForm` — record date/score/comment for an attempt
- `ProgressHistory` — table of past attempts
- `useProgress` — progress entries query + create mutation

**admin/**
- `AdminDashboard` — hub with tabs for worksheets and users
- `GenerationChat` — multi-turn streaming chat with Claude; "Generate" button parses metadata and populates form
- `WorksheetForm` — manual worksheet creation/edit form
- `UserManagement` — user list with suspend/delete actions
- `AddUserForm` — admin-created user form
- `useGenerationSession` — ephemeral Claude conversation state
- `useAdminWorksheets` — worksheet CRUD mutations
- `useUserManagement` — user CRUD mutations

**uploads/**
- `UploadZone` — drag-and-drop image upload; calls Claude vision → POST to API
- `UploadedWorksheetCard` — orange-bordered card with person icon and "My Upload" badge
- `MathRenderer` — renders markdown with KaTeX (LaTeX math) and Mafs (graph blocks)
- `GraphPlot` — Mafs coordinate plane renderer from Claude-generated graph JSON spec
- `useUserUploads` — list query
- `useUserUpload` — detail query
- `useCreateUpload` — upload mutation
- `useUpdateUpload` — append similar problem via PATCH
- `useDeleteUpload` — delete mutation

### Where to Put a New Component

> - **Reused across features?** → `src/components/`
> - **Used only in one feature?** → `src/features/<feature>/components/`
> - **Route-level entry point?** → `src/pages/`
> - **Folder structure:** one component per folder with co-located hook, types, and test

### State Management Summary

| State | Tool | Store / Location |
|---|---|---|
| Authenticated user + JWT | Zustand (persisted) | `features/auth/store.ts` |
| Active category/subcategory/keyword filters | Zustand (ephemeral) | `stores/filterStore.ts` |
| API server data (worksheets, categories, progress, users, uploads) | React Query | via hooks in `features/*/hooks/` |
| Generation chat history | Local `useState` | `useGenerationSession.ts` |
| Upload analysis state (analyzing/saving/error) | Local `useState` | `UploadZone.tsx` |
| Form state | React Hook Form | inside form components |

---

## 7. Testing Strategy

### Three-Layer Model

| Layer | Tool | Location | What It Tests |
|---|---|---|---|
| Unit | Vitest | `src/utils/*.test.ts`, `src/features/*/hooks/*.test.ts` | Pure functions, custom hooks |
| Integration | Vitest + RTL + MSW | `src/features/*/components/*.test.tsx`, `src/pages/*.test.tsx` | Components with real network mock |
| E2E | (planned) Playwright | `e2e/` | Full user flows in browser |

### Philosophy

**Unit tests** cover pure utilities (`cn`, `logger`, `apiFetch` error paths) and hook logic in isolation.

**Integration tests** are the primary layer. They render components inside a full `QueryClientProvider` + MSW server, exercise real user interactions via `@testing-library/user-event`, and assert on visible DOM output. This matches how users actually experience the app.

**No snapshot tests.** Snapshots couple tests to markup details rather than behavior; they fail on irrelevant changes and give false confidence.

**Mock at the network boundary** using MSW — never mock modules directly. This ensures the full `api/` layer (Zod parsing, error handling, request headers) is exercised in every test.

### TDD Workflow

1. Write a failing test describing the behavior
2. Run `npm run test` — confirm it fails
3. Implement the minimum code to make it pass
4. Refactor, keeping tests green

### Test Commands

```bash
npm run test                                           # run all tests (watch mode)
npm run test -- --run                                  # run once (CI mode)
npm run test -- --reporter=verbose src/path/to/file.test.tsx  # single file
npm run test -- --coverage                             # with coverage report
npm run typecheck                                      # tsc --noEmit
npm run lint                                           # ESLint
```

### Coverage Targets

| Area | Target |
|---|---|
| Utilities (`src/utils/`) | 100% |
| API layer (`src/api/`) | 90% |
| Feature hooks (`src/features/*/hooks/`) | 85% |
| Feature components | 80% |
| Pages | 70% |

---

## 8. Accessibility Strategy

**Target:** WCAG 2.1 Level AA

Math education tools serve students with a range of learning needs. Accessibility is not optional.

### Principles

| Principle | Implementation |
|---|---|
| Perceivable | Sufficient color contrast (≥4.5:1 text, ≥3:1 UI), no color-only meaning, alt text on images |
| Operable | Full keyboard navigation, visible focus indicators, no keyboard traps |
| Understandable | Clear error messages at field level, consistent navigation, descriptive labels |
| Robust | Semantic HTML, ARIA roles only where native HTML falls short |

### Implementation Checklist

**Semantic HTML**
- [ ] Use `<nav>`, `<main>`, `<header>`, `<section>` landmarks
- [ ] Heading hierarchy: one `<h1>` per page, logical `h2`/`h3` nesting
- [ ] Lists for grouped items (`<ul>`, `<ol>`)

**Forms**
- [ ] Every input has a visible `<label>` linked via `for`/`id` or `aria-labelledby`
- [ ] Field-level error messages use `aria-describedby`
- [ ] Required fields marked with `aria-required="true"`
- [ ] Success/error states announced via `aria-live="polite"`

**Interactive Components**
- [ ] Dropdowns use native `<select>` or proper ARIA combobox pattern
- [ ] Modals/dialogs trap focus and restore on close
- [ ] Buttons vs links used semantically (buttons = action, links = navigation)
- [ ] Focus visible on all interactive elements (Tailwind `focus-visible:ring`)

**Color & Contrast**
- [ ] Text contrast ≥4.5:1 against background
- [ ] Interactive element contrast ≥3:1
- [ ] Error/success states not indicated by color alone

### Testing Approach

| Type | Tool | When |
|---|---|---|
| Automated | `@testing-library/jest-dom` + RTL's `getByRole` / `getByLabelText` queries | Every test (queries fail if ARIA roles are wrong) |
| Automated | axe-core (via `@axe-core/react`) | Dev mode — logs violations to console |
| Manual | Keyboard-only navigation walkthrough | Before each major release |
| Manual | Screen reader (VoiceOver on macOS) | Before each major release |

---

## 9. Performance & Scalability

### Frontend Performance

| Area | Approach |
|---|---|
| Bundle splitting | Vite automatic code-splitting by route (React Router lazy loading) |
| Caching | React Query `staleTime: 5min` — category list and worksheet list cached aggressively |
| Image optimization | User-uploaded images served as static files from Express `/uploads/` |
| Tailwind CSS | Vite plugin purges unused classes at build time |
| Claude streaming | Token-by-token streaming for generation chat — no blocking wait for full response |
| Math rendering | KaTeX renders LaTeX server-side-style in browser; Mafs graphs are lightweight React components |

### Backend Performance

| Area | Approach |
|---|---|
| Worksheet queries | Prepared statements via `better-sqlite3`; index on `(category_id, subcategory_id)` + `level` |
| Progress queries | Index on `user_id` — each user only sees their own data |
| User upload queries | Index on `user_id`; image files served via Express static middleware |
| Auth | Stateless JWT — no server-side session storage needed |
| Claude API caching | Ephemeral prompt caching on system message (~5min TTL, ~90% token savings on repeated calls) |

### Scalability Constraints

| Constraint | Current State | Migration Path |
|---|---|---|
| SQLite | Single-file DB suitable for development and low traffic | Migrate to PostgreSQL + Prisma for multi-instance production |
| Local image storage | Images stored on disk at `uploads/` | Move to S3/GCS with signed URLs |
| Claude API calls from browser | `dangerouslyAllowBrowser: true` exposes API key client-side | Move to backend proxy endpoint |
| Subscription billing | Mocked | Integrate Stripe Checkout + webhooks |
| File export (PDF/DOC) | Mock blob response | Server-side Puppeteer or react-pdf |
| Rate limiting | Not yet implemented | Add `express-rate-limit` on auth endpoints |

### Caching Strategy

| Data | Cache | TTL |
|---|---|---|
| Category list | React Query | 5 min (rarely changes) |
| Worksheet list | React Query | 5 min |
| Single worksheet | React Query | 5 min |
| User uploads list | React Query | Until mutation invalidates |
| Single user upload | React Query | Until mutation invalidates |
| Current user (`/auth/me`) | React Query | Until logout |
| Progress entries | React Query | 2 min (updated frequently) |
| Claude system prompt | Anthropic ephemeral cache | ~5 min per session |

---

## 10. Responsiveness Strategy

### Breakpoints (Tailwind defaults)

| Prefix | Min Width | Target Devices |
|---|---|---|
| (none) | 0px | Mobile (portrait) |
| `sm:` | 640px | Mobile (landscape), small tablet |
| `md:` | 768px | Tablet (portrait) |
| `lg:` | 1024px | Tablet (landscape), laptop |
| `xl:` | 1280px | Desktop |

### Layout Strategy

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Navbar | Stacked: logo + hamburger menu | Logo + category dropdowns + condensed search | Full: logo + dropdowns + search + account |
| Browse grid | 1 column | 2 columns | 3–4 columns |
| Worksheet viewer | Full width, single column | Full width | Centered, max-width container with sidebar for actions |
| My Uploads grid | 1 column | 2 columns | 3–4 columns |
| Upload zone | Full width inline | Full width inline | Full width inline |
| Admin panel | Tabs stack vertically | Side-by-side tabs + content | Two-column layout |
| Generation chat | Full width, scrollable | Full width | Centered chat + form panel side by side |
| Forms (login/register) | Full width | Centered card, max-width 480px | Same as tablet |

### Implementation Rules

- Mobile-first: write base styles for mobile, use `md:` / `lg:` to override for larger screens
- No fixed pixel widths — use `max-w-*`, `w-full`, and `flex`/`grid` for fluid layouts
- Touch targets: minimum `44×44px` for all interactive elements (`min-h-11 min-w-11`)
- Horizontal scrolling: never allowed on any page at any breakpoint
- Tables: on mobile, use horizontal scroll inside a `overflow-x-auto` container

### Typography Scaling

| Element | Mobile | Desktop |
|---|---|---|
| Page title (`h1`) | `text-2xl` | `text-4xl` |
| Section heading (`h2`) | `text-xl` | `text-2xl` |
| Body | `text-sm` | `text-base` |
| Labels / meta | `text-xs` | `text-sm` |
