# PROJECT_STRUCTURE.md

This is a greenfield project. The structure below is the planned layout based on the product spec in CLAUDE.md.

```
pizzamath/
├── public/
│   └── logo.svg                  ← PizzaMath logo
│
├── src/
│   ├── main.tsx                  ← app entry point
│   ├── App.tsx                   ← router root + auth gate
│   │
│   ├── api/                      ← typed fetch wrappers + Zod schemas
│   │   ├── queryKeys.ts          ← all React Query keys as constants
│   │   ├── worksheets.ts         ← worksheet CRUD endpoints
│   │   ├── progress.ts           ← user attempt tracking endpoints
│   │   ├── auth.ts               ← login, register, subscription
│   │   └── claude.ts             ← Claude API integration (worksheet generation)
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/       ← LoginForm, RegisterForm
│   │   │   ├── hooks/            ← useAuth, useSubscriptionGate
│   │   │   ├── store.ts          ← Zustand auth store (current user, role)
│   │   │   └── index.ts
│   │   │
│   │   ├── worksheets/
│   │   │   ├── components/       ← WorksheetCard, WorksheetViewer, AnswerSheet
│   │   │   ├── hooks/            ← useWorksheets, useWorksheet, useWorksheetFilter
│   │   │   └── index.ts
│   │   │
│   │   ├── progress/
│   │   │   ├── components/       ← ProgressEntry, ProgressHistory
│   │   │   ├── hooks/            ← useProgress, useProgressMutation
│   │   │   └── index.ts
│   │   │
│   │   └── admin/
│   │       ├── components/       ← WorksheetForm, GenerationChat, AdminDashboard
│   │       ├── hooks/            ← useGenerationSession, useAdminWorksheets
│   │       └── index.ts
│   │
│   ├── components/               ← shared UI components
│   │   ├── Navbar/
│   │   │   ├── Navbar.tsx        ← top bar with logo, dropdowns, search, account
│   │   │   ├── CategoryDropdown.tsx
│   │   │   ├── SubcategoryDropdown.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── AccountMenu.tsx
│   │   └── SubscriptionGuard.tsx ← redirect unpaid users to billing
│   │
│   ├── pages/                    ← route-level components only
│   │   ├── BrowsePage.tsx        ← worksheet listing with filters
│   │   ├── WorksheetPage.tsx     ← single worksheet + answer sheet
│   │   ├── AccountPage.tsx       ← account management
│   │   ├── UsageHistoryPage.tsx  ← progress tracking history
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── admin/
│   │       ├── AdminPage.tsx
│   │       └── GeneratePage.tsx  ← multi-turn Claude chat → Generate button
│   │
│   ├── stores/                   ← Zustand (UI state only)
│   │   └── filterStore.ts        ← selected category/subcategory filter state
│   │
│   ├── types/                    ← shared global types
│   │   ├── worksheet.ts          ← Worksheet, AnswerSheet, Category, Level types
│   │   ├── user.ts               ← User, Role, Subscription types
│   │   └── progress.ts           ← ProgressEntry type
│   │
│   └── utils/
│       ├── cn.ts                 ← clsx + tailwind-merge helper
│       └── logger.ts             ← app-wide logger (replaces console.log)
│
├── CLAUDE.md
├── PROJECT_STRUCTURE.md
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

## Key relationships

- **Auth gate**: `App.tsx` wraps all routes in an auth check; `SubscriptionGuard` wraps routes that require an active subscription.
- **Admin routes**: Protected by role check (`admin` only); rendered under `/admin/*`.
- **Generation flow**: `GeneratePage` holds multi-turn chat state locally (ephemeral). On **Generate**, it calls `src/api/claude.ts`, auto-populates worksheet metadata, and saves via `src/api/worksheets.ts`.
- **Category/Subcategory dropdowns**: Driven by `filterStore.ts` (Zustand). `SubcategoryDropdown` is only rendered when a category is selected.
- **Server state**: All worksheet, progress, and auth data flows through React Query; nothing is duplicated into Zustand.
```
