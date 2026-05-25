# A11y Compliance Log — PizzaMath

Log of all WCAG 2.1 AA audits and fixes. Appended after each session.

---

## 2026-05-15 — Initial Audit & Full Fix Pass

**Branch:** `feature-a11y`  
**Criterion:** WCAG 2.1 AA  
**Files scanned:** 27  
**Issues found:** Critical: 3 | Major: 8 | Minor: 5  
**Issues fixed:** 16 (all)

### Critical fixes

| File | Fix |
|------|-----|
| `src/features/admin/components/AddUserForm.tsx` | Added `htmlFor`/`id` to all 4 label+input pairs; added `aria-describedby` linking inputs to error messages |
| `src/features/auth/components/ChangePasswordForm.tsx` | Added `htmlFor`/`id` to all 3 label+input pairs; added `aria-describedby` |
| `src/features/uploads/components/UploadZone.tsx` | Added `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space) to upload drop zone; added `aria-hidden="true"` to decorative SVG |

### Major fixes

| File | Fix |
|------|-----|
| `src/components/Navbar/AccountMenu.tsx` | Added `aria-expanded`, `aria-haspopup="menu"` to toggle button; added `role="menu"` to dropdown; added Escape key handler |
| `src/features/admin/components/GenerationChat.tsx` | Added `aria-live="polite"`, `role="log"`, `aria-label="Chat messages"` to message container |
| `src/features/auth/components/LoginForm.tsx` | Added `aria-describedby` on email/password inputs; added `id` on error paragraphs |
| `src/features/auth/components/RegisterForm.tsx` | Added `aria-describedby` on email/password inputs; added `id` on error paragraphs |
| `src/features/admin/components/UserManagement.tsx` | Added `<caption class="sr-only">`, `scope="col"` on all `<th>`; added focus rings to Suspend/Activate/Delete buttons |
| `src/features/progress/components/ProgressHistory.tsx` | Added `<caption class="sr-only">`, `scope="col"` on all `<th>` |
| `src/features/admin/components/AdminDashboard.tsx` | Added `<caption class="sr-only">`, `scope="col"` on all `<th>` |
| `src/components/AppLayout.tsx` | Added skip-navigation link (`Skip to main content`) |
| `src/pages/BrowsePage.tsx` | Changed `<h2>` to `<h1>`; added `id="main-content"` to `<main>`; added `document.title` via `useEffect` |
| `src/pages/WorksheetPage.tsx` | Added `id="main-content"` to `<main>`; added dynamic `document.title` (worksheet name) |
| `src/pages/AccountPage.tsx` | Added `id="main-content"` to `<main>`; added `document.title` |
| `src/pages/UsageHistoryPage.tsx` | Added `id="main-content"` to `<main>`; added `document.title` |
| `src/pages/LoginPage.tsx` | Added `document.title = 'Sign In — PizzaMath'` |
| `src/pages/RegisterPage.tsx` | Added `document.title = 'Create Account — PizzaMath'` |
| `src/pages/SubscribePage.tsx` | Added `document.title = 'Subscribe — PizzaMath'` |

### Minor fixes

| File | Fix |
|------|-----|
| `src/features/admin/components/WorksheetForm.tsx` | Added `focus:outline-none focus:ring-2 focus:ring-orange-500` to all inputs, selects, and textareas |
| `src/features/worksheets/components/WorksheetCard.tsx` | Added `focus:outline-none focus:ring-2 focus:ring-orange-500` to card `<Link>` |
| `src/components/Navbar/SearchBar.tsx` | Removed redundant `role="searchbox"` from `input[type=search]` |

### TypeScript check
`npx tsc --noEmit` — ✅ no errors

---
