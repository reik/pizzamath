# PizzaMath E2E Tests with Cypress

This document describes the comprehensive E2E test suite for PizzaMath, written with Cypress.

## Overview

The Cypress E2E tests cover critical user workflows across authentication, worksheet browsing, worksheet uploads, and similar problem generation. Tests use real API calls (not mocked) by intercepting the Claude API at the network boundary with `cy.intercept()`.

## Test Files

- **`cypress/e2e/auth.cy.ts`** — Authentication flows (login, register, logout, error states)
- **`cypress/e2e/browse.cy.ts`** — Worksheet discovery (grid display, category/subcategory filters, search)
- **`cypress/e2e/uploads.cy.ts`** — User worksheet uploads (upload zone, CRUD operations)
- **`cypress/e2e/uploaded-worksheet.cy.ts`** — Uploaded worksheet detail page (tabs, image toggle, similar problem generation)

## Setup

### Prerequisites

- Node.js 18+
- Both frontend and backend running:
  ```bash
  npm run dev:all
  ```

### Configuration

The Cypress configuration is in `cypress.config.ts`:

- **Base URL:** `http://localhost:5173` (Vite dev server)
- **Backend API:** Proxied via Vite to `http://localhost:3001`
- **Viewport:** 1280x720
- **Timeouts:** 8s (requests and commands)

### Custom Commands

A `cy.login(email, password)` custom command is available in `cypress/support/commands.ts`. It:
1. Makes a real POST request to `/api/auth/login`
2. Stores the JWT token in localStorage under `pizzamath-auth` key
3. Sets up the Zustand auth store state

## Running Tests

### Interactive Mode
```bash
npm run e2e:open
```
Opens the Cypress Test Runner. Select a spec file to run tests with live preview.

### Headless Mode
```bash
npm run e2e
```
Runs all tests in headless mode and outputs results to the terminal.

### Single Test File
```bash
npx cypress run --e2e --spec "cypress/e2e/auth.cy.ts"
```

### With Video Recording
```bash
npx cypress run --e2e --record --key <your-key>
```

## Test Organization

### Auth (`auth.cy.ts`)
Tests cover:
- Valid login with admin credentials
- Login validation errors (invalid email, missing password)
- Server error handling (invalid credentials)
- Loading states during submission
- User registration with plan selection
- Registration validation (weak password, invalid email)
- Logout flow and token cleanup
- Redirect of unauthenticated users to login

**Default test user:**
- Email: `abc@abc.co`
- Password: `liniLINI123`
- Role: `admin`

### Browse (`browse.cy.ts`)
Tests cover:
- Worksheet grid loads and displays count
- Category filter (select, clear, URL updates)
- Subcategory filter conditional on category
- Keyword search with error handling
- Uploaded worksheets appear with "My Upload" badge
- Worksheet card interactions and navigation
- Filter state persistence in URL

### Uploads (`uploads.cy.ts`)
Tests cover:
- Navigation to My Uploads from Account menu
- "+ Upload Image" button toggle
- UploadZone drag-and-drop UI
- File selection via input
- Upload flow with Claude API interception
- Successful upload redirects to detail page
- Uploaded worksheets appear in grid
- Delete operation with confirmation dialog
- Cancel deletion

**Note:** File uploads are intercepted at the Claude vision API endpoint. The test fixture is a minimal 1x1 PNG at `cypress/fixtures/sample-math-problem.png`.

### Uploaded Worksheet (`uploaded-worksheet.cy.ts`)
Tests cover:
- Worksheet title, metadata (level, grade), and "My Upload" badge
- Worksheet and Answer Sheet tabs
- Original image toggle with proper styling
- "Generate Similar Problem" button
  - Loading state and disabled state during generation
  - Appends generated problem to content (separator `---`)
  - Updates answer sheet
  - Displays error message on failure (Claude API error intercept)
- Progress tracking form (if visible)
- Back link to My Uploads

## Claude API Interception

All tests that call the Claude API intercept at the network boundary:

```typescript
cy.intercept('POST', 'https://api.anthropic.com/v1/messages', {
  statusCode: 200,
  body: {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: JSON.stringify({
        // Mock response data
      }),
    }],
  },
}).as('claudeAnalyze')
```

This ensures tests:
- Do not make real API calls to Anthropic
- Control response timing (for loading state tests)
- Can simulate errors (status 500, malformed responses)
- Run fast and reliably

## Key Testing Patterns

### 1. **AAA Pattern**
All tests follow Arrange-Act-Assert:
```typescript
it('should_describe_expected_behavior', () => {
  // Arrange - setup state
  cy.login('abc@abc.co', 'liniLINI123')
  cy.visit('/')

  // Act - perform user action
  cy.findByRole('button', { name: /logout/i }).click()

  // Assert - verify outcome
  cy.url().should('include', '/login')
})
```

### 2. **Role-Based Selectors**
Prefer semantic queries over class-based selectors (which break with Tailwind utility changes):
```typescript
// Good - works even if classes change
cy.findByRole('button', { name: /submit/i })
cy.findByRole('combobox', { name: /category/i })
cy.findByLabelText(/email/i)

// Avoid
cy.get('.bg-orange-500.px-4.py-2')
```

### 3. **Async Operations**
Use `waitFor` or `wait` for network operations:
```typescript
cy.intercept('POST', '/api/auth/login').as('login')
cy.findByRole('button', { name: /sign in/i }).click()
cy.wait('@login')
cy.url().should('eq', 'http://localhost:5173/')
```

### 4. **Independent Tests**
Each test is independent:
- Clears localStorage in `beforeEach`
- Logs in only if needed for that test
- Does not rely on prior test state
- Can be run in any order

### 5. **Error State Testing**
Tests verify both happy path and error scenarios:
```typescript
// Happy path
cy.login('abc@abc.co', 'liniLINI123')
cy.url().should('include', '/')

// Error path
cy.login('wrong@email.com', 'wrongpassword')
cy.contains(/invalid/i).should('be.visible')
```

## Debugging

### Use Cypress Inspector
```bash
npm run e2e:open
```
- Pause tests with `.pause()` or step through manually
- Inspect DOM elements in the console
- See request/response details in the Network tab

### Enable Debug Logging
```bash
DEBUG=cypress:* npm run e2e
```

### Check Logs and Videos
- Test videos: `cypress/videos/`
- Test logs: `cypress/logs/`
- Screenshots on failure: `cypress/screenshots/`

## CI/CD Integration

To run tests in CI, ensure:
1. Backend is running on `http://localhost:3001`
2. Frontend dev server is running on `http://localhost:5173`
3. Environment variable `VITE_USE_MOCK=false` is set

Example GitHub Actions workflow:
```yaml
- name: Start servers
  run: npm run dev:all &

- name: Wait for servers
  run: npx wait-on http://localhost:5173 http://localhost:3001

- name: Run E2E tests
  run: npm run e2e
```

## Limitations and Future Work

- **File Upload Tests:** Currently intercept Claude API; actual image processing is not tested
- **Admin Routes:** Tests do not cover `/admin` or `/admin/generate` pages (requires admin-specific test user setup)
- **Multi-User Scenarios:** Tests are single-user; concurrent scenarios not covered
- **Mobile Responsiveness:** Tests use fixed 1280x720 viewport; mobile layout not verified
- **Performance:** No performance benchmarks or Lighthouse checks

## Maintenance

When updating UI:
1. Run `npm run e2e:open` to visually verify changes
2. Update selectors if DOM structure changes (prefer role-based queries)
3. Add tests for new features before merging
4. Keep test files modular — one describe block per page/feature

## Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [PizzaMath API Docs](../TECHNICAL_DESIGN.md)
