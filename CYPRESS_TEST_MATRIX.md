# PizzaMath Cypress E2E Test Coverage Matrix

## Test Execution Summary

**Total Test Specs:** 4  
**Total Test Cases:** 40+  
**Total Lines of Test Code:** 824

### Quick Start

```bash
# Install dependencies (if not done)
npm install

# Run the full backend + frontend
npm run dev:all

# In another terminal, run tests
npm run e2e                 # Headless mode
npm run e2e:open          # Interactive mode with Cypress UI
```

---

## Test Coverage by Feature

### 1. Authentication (`auth.cy.ts`)
**Status:** Comprehensive ✓

| Feature | Test Case | Type | Details |
|---------|-----------|------|---------|
| **Login** | Valid credentials | Happy path | Email: `abc@abc.co`, Password: `liniLINI123` |
| | Invalid email format | Validation | Shows field-level error |
| | Empty password | Validation | Shows required error |
| | Wrong credentials | Server error | Shows "invalid" error message |
| | Loading state | UX | Button shows "Signing in…" during request |
| **Registration** | Valid credentials + plan | Happy path | Creates user with monthly/annual subscription |
| | Weak password (<6 chars) | Validation | Shows minimum length error |
| | Invalid email | Validation | Shows email format error |
| | Plan selection | UX | Radio buttons for monthly/annual visible |
| **Logout** | Logout flow | Happy path | Redirects to login, clears localStorage |
| | Token cleanup | State | JWT removed from `pizzamath-auth` storage key |
| | Unauthenticated redirect | Access control | Visiting `/` without auth redirects to `/login` |

**Test File:** `/Users/reikurata/dev/pizzamath/cypress/e2e/auth.cy.ts` (160 lines, 11 tests)

---

### 2. Browse Worksheets (`browse.cy.ts`)
**Status:** Comprehensive ✓

| Feature | Test Case | Type | Details |
|---------|-----------|------|---------|
| **Grid Display** | Load and display | Happy path | Shows worksheet count and cards |
| | Loading skeleton | UX | Animated skeleton shown during fetch |
| | Worksheet count | Display | Shows `(N)` count in heading |
| **Category Filter** | Select category | Interaction | Dropdown updates URL with `category=` |
| | Clear category | Interaction | Removes category filter |
| **Subcategory Filter** | Show conditional | Conditional | Only visible after category selected |
| | Filter by subcategory | Interaction | Updates URL with `subcategory=` |
| **Keyword Search** | Search by keyword | Interaction | Filters worksheets by term |
| | Clear search | Interaction | Removes keyword filter |
| | No results | Empty state | Shows "no worksheets found" message |
| **Uploaded Worksheets** | Display with badge | Display | Shows "My Upload" badge on user uploads |
| | Filter uploads | Filter | Category/subcategory filters apply to uploads |
| **Card Interactions** | Navigate to detail | Navigation | Click opens `/worksheets/:id` |
| | Display metadata | Display | Shows level, grade, category on cards |
| **Navbar Filter** | Reset subcategory | State | Changing category resets subcategory |

**Test File:** `/Users/reikurata/dev/pizzamath/cypress/e2e/browse.cy.ts` (182 lines, 14 tests)

---

### 3. Upload Worksheets (`uploads.cy.ts`)
**Status:** Comprehensive ✓

| Feature | Test Case | Type | Details |
|---------|-----------|------|---------|
| **Navigation** | Open from Account menu | Navigation | Account dropdown → "My Uploads" link |
| | Display empty state | Display | Shows "No uploads yet" message initially |
| | Show upload button | Display | "+ Upload Image" button visible |
| **Upload Zone** | Toggle visibility | Interaction | Button toggles zone on/off |
| | Drag-and-drop UI | Display | Shows drag/drop instructions |
| | File input | Interaction | Can select file via file input dialog |
| | Claude API intercept | Network | Intercepts POST to `https://api.anthropic.com/v1/messages` |
| **Upload Creation** | Create and redirect | Happy path | Upload navigates to `/my-uploads/:id` detail page |
| | Appear in grid | Display | Newly uploaded worksheet visible in grid |
| **Deletion** | Show delete button | UX | Delete button appears on hover |
| | Delete with confirm | Interaction | Requires confirmation dialog |
| | Cancel deletion | Interaction | Dialog cancel keeps upload intact |
| **Browse Grid** | Show in grid | Display | Uploaded worksheets appear in main browse grid |
| | Navigate from grid | Navigation | Click "My Upload" badge/card opens detail page |

**Test File:** `/Users/reikurata/dev/pizzamath/cypress/e2e/uploads.cy.ts` (224 lines, 13 tests)

---

### 4. Uploaded Worksheet Detail (`uploaded-worksheet.cy.ts`)
**Status:** Comprehensive ✓

| Feature | Test Case | Type | Details |
|---------|-----------|------|---------|
| **Page Content** | Display title & badge | Display | Shows title, "My Upload" badge, level, grade |
| | Display problem content | Display | Shows worksheet problem text |
| | Back link | Navigation | Link to `/my-uploads` visible and functional |
| **Tab Navigation** | Worksheet tab default | Display | Worksheet content shown by default |
| | Switch to Answer Sheet | Interaction | Shows answer content, hides problem |
| | Toggle back | Interaction | Shows problem, hides answers |
| **Original Image** | Show button | Display | "Show original image" button visible |
| | Display image | Display | Image visible when toggled on |
| | Hide image | Interaction | Image hidden when toggled off |
| | Image styling | Display | Image in rounded container with border |
| **Generate Similar** | Button visible | Display | "Generate Similar Problem" button visible |
| | Loading spinner | UX | Shows spinning indicator while generating |
| | Button disabled | UX | Button disabled during generation |
| | Append to content | Happy path | New problem appended with `---` separator |
| | Update answer sheet | State | Both problem and answer sheets updated |
| | Error handling | Error state | Shows error message on API failure |
| **Progress Tracking** | Form visible | Display | Progress entry form present (if implemented) |

**Test File:** `/Users/reikurata/dev/pizzamath/cypress/e2e/uploaded-worksheet.cy.ts` (258 lines, 17 tests)

---

## Test Data & Fixtures

### Default Test User
| Field | Value |
|-------|-------|
| Email | `abc@abc.co` |
| Password | `liniLINI123` |
| Role | `admin` |
| Subscription | Active |

### Test Fixture Files
| File | Purpose | Size |
|------|---------|------|
| `cypress/fixtures/sample-math-problem.png` | Minimal 1x1 PNG for upload tests | <1 KB |

---

## API Endpoint Coverage

### Intercepted (Mocked with `cy.intercept()`)
- `POST https://api.anthropic.com/v1/messages` — Claude API for image analysis & similar problem generation

### Called Directly (Real Requests)
- `POST /api/auth/login` — Via `cy.login()` custom command
- `GET /api/categories` — Category list for filters
- `GET /api/worksheets` — Worksheet grid
- `GET /api/user-uploads` — User's uploaded worksheets
- `POST /api/user-uploads` — Create upload (Claude API response mocked)
- `PATCH /api/user-uploads/:id` — Update upload content
- `DELETE /api/user-uploads/:id` — Delete upload
- `POST /api/auth/logout` — Logout

---

## Test Execution Flow

### Per-Test Setup (`beforeEach`)
```typescript
localStorage.clear()                          // Fresh state
cy.login('abc@abc.co', 'liniLINI123')        // Authenticate
cy.visit('/my-uploads')                       // Navigate to page
```

### Per-Test Cleanup (Automatic)
- localStorage cleared before next test
- Failed assertions captured (screenshot + video in CI)
- Network intercepts reset

---

## Environment Requirements

### Running Locally
```bash
# Terminal 1: Start both servers
npm run dev:all

# Terminal 2: Run tests
npm run e2e:open              # or npm run e2e
```

### CI/CD
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Environment: `VITE_USE_MOCK=false` (use real backend, not MSW mocks)

---

## Known Limitations

1. **File Upload Tests**
   - Only tests the flow; actual image analysis via Claude not tested
   - File fixture is a minimal 1x1 PNG

2. **Admin Routes**
   - `/admin` and `/admin/generate` not covered
   - Would require admin-only test user or separate admin test suite

3. **Multi-User Scenarios**
   - All tests run as single user
   - Concurrent access patterns not tested

4. **Mobile Responsiveness**
   - Fixed viewport: 1280x720
   - Mobile layouts (< 768px) not verified

5. **Performance**
   - No performance metrics or Lighthouse checks
   - No load testing or stress testing

6. **Payment/Subscription**
   - Subscription selection tested in registration but payment flow not implemented
   - Assumes all test users have active subscriptions

---

## Debugging & Troubleshooting

### Test Fails Locally But Passes in CI?
- Ensure backend is running: `npm run server` or `npm run dev:all`
- Verify `VITE_USE_MOCK=false` (dev:backend uses this)
- Check that port 3001 is accessible

### Test Passes But Flakes Intermittently?
- Increase timeouts in `cypress.config.ts` (currently 8s)
- Add `cy.wait()` for specific API intercepts if timing is tight
- Check for async state updates in the application

### How to Add a New Test?
1. Open spec file in `cypress/e2e/`
2. Add `it('should_describe_behavior', () => { ... })`
3. Use AAA pattern (Arrange-Act-Assert)
4. Prefer role-based selectors (`findByRole`)
5. Run with `npm run e2e:open` to debug
6. Commit when passing

---

## Next Steps

To extend test coverage:

1. **Admin Tests** — Create `cypress/e2e/admin.cy.ts` for worksheet CRUD and generation
2. **Seeded Worksheets** — Test browsing the 120 CA Common Core worksheets
3. **Performance** — Add Lighthouse checks or custom metrics
4. **Mobile** — Add tests with `cy.viewport('iphone-x')`
5. **Error Recovery** — Test network failures, server errors, timeouts
6. **Accessibility** — Integrate `@axe-core/cypress` for a11y checks

---

## Resources

- **Cypress Docs:** https://docs.cypress.io
- **Testing Library Selectors:** https://testing-library.com/docs/queries/about
- **PizzaMath Architecture:** See `TECHNICAL_DESIGN.md`
- **Test Execution:** `npm run e2e` or `npm run e2e:open`
