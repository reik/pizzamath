# PizzaMath — Architecture

## Source tree

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

## Key features

### Worksheet generation (admin)

A textarea in the admin view (`/admin/generate`) drives a multi-turn conversation
with a Claude agent. Once satisfied, clicking **Generate** auto-populates Category,
Subcategory, Level, and School Grade. The Claude API integration lives in
`src/api/claude.ts`.

Conversation state is ephemeral — only the final saved worksheet persists.
Refreshing mid-conversation loses the draft.

### Progress tracking (user)

Users record date, score, and comment per worksheet attempt. Stored per-user in
the backend and surfaced in Usage History and Insights.

### Navigation (top bar)

- **Left** — PizzaMath logo + site name
- **Center** — Category dropdown → Subcategory dropdown (conditional on category)
- **Right** — Search (keyword + optional category filter), Account dropdown, Logout

## Notes

- File export (PDF, doc) is a user-facing feature; plan for a server-side generation
  step or a library like `react-pdf`.
