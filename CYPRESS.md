# Cypress E2E Testing Guide

## Setup

- **Framework:** Cypress 15 + `@testing-library/cypress`
- **Base URL:** `http://localhost:5173` — run `npm run dev` first
- **Run:** `npm run e2e` (headless) · `npm run e2e:open` (interactive)
- **Spec files:** `cypress/e2e/auth.cy.ts` · `browse.cy.ts` · `uploads.cy.ts` · `uploaded-worksheet.cy.ts`

---

## Auth & Login

### Test account

Always use `Cypress.env()` — never hardcode credentials:

```ts
// ✅
cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))

// ❌ — wrong password and hardcoded
cy.login('abc@abc.co', 'liniLINI123')
```

Credentials are defined in `.env` and mapped in `cypress.config.ts`:

```
CYPRESS_TEST_EMAIL=cypress@pizzamath.test
CYPRESS_TEST_PASSWORD=cypress123
```

### `cy.login()` custom command

Sets `localStorage` directly — faster than filling the login form. Use in `beforeEach` for pages that require auth:

```ts
beforeEach(() => {
  localStorage.clear()
  cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  cy.visit('/')
})
```

> `cy.login` uses `cy.request` from Node context — it bypasses MSW. The custom command manually sets `pizzamath-auth` in `localStorage`, which is what `useAuthStore` reads.

### Form-based login tests

For tests that exercise the login form itself, fill the form directly:

```ts
cy.get('input[type="email"]').type(Cypress.env('TEST_EMAIL'))
cy.get('input[type="password"]').type(Cypress.env('TEST_PASSWORD'))
cy.findByRole('button', { name: /sign in/i }).click()
```

---

## Element Queries

### Role reference

| Element | Correct role |
|---|---|
| `<button>` | `button` |
| `<a href>` | `link` |
| `<select>` | `combobox` |
| `<input type="search">` | `searchbox` |
| `<input type="text">` | `textbox` |
| `<input type="radio">` | `radio` |

### Native `<select>` dropdowns

Use `.select()` — never `.click()` + `findByRole('option')`:

```ts
// ✅ — Category and Subcategory are native <select> elements
cy.findByRole('combobox', { name: /category/i }).select('Geometry')
cy.findByRole('combobox', { name: /subcategory/i }).select('Trigonometry')

// ❌ — findByRole('option') only works for custom JS dropdowns
cy.findByRole('option', { name: /geometry/i }).click()
```

### Account menu

The Account dropdown contains `<Link>` elements (rendered as `<a>` tags), not `role="menuitem"`. The Logout button is a standalone `<button>` outside the dropdown:

```ts
// ✅ — open dropdown then click the link
cy.findByRole('button', { name: /account/i }).click()
cy.findByRole('link', { name: /my uploads/i }).click()

// ✅ — logout is always visible in the navbar, no dropdown needed
cy.findByRole('button', { name: /logout/i }).click()

// ❌ — there are no menuitems in this app
cy.findByRole('menuitem', { name: /my uploads/i }).click()
cy.findByRole('menuitem', { name: /logout/i }).click()
```

---

## URL Structure

| Page | URL pattern |
|---|---|
| Browse all | `/` |
| Browse filtered | `/?cat={categoryId}&sub={subcategoryId}&q={keyword}` |
| Worksheet detail | `/worksheets/{categorySlug}/{subcategorySlug}/{worksheetId}` |
| My Uploads list | `/my-uploads` |
| Upload detail | `/my-uploads/{id}` |

Filter state lives in URL search params — not in the path:

```ts
// ✅ — filters use query params
cy.url().should('include', '?cat=')

// ❌ — filters are not path segments
cy.url().should('include', '/geometry')
```

Worksheet URLs:
```ts
// e.g. /worksheets/algebra/create-equations/ws-s13-4a
cy.url().should('match', /\/worksheets\/[\w-]+\/[\w-]+\/[\w-]+$/)

// Uploaded worksheets stay at /my-uploads/:id
cy.url().should('match', /\/my-uploads\/[a-z0-9-]+$/)
```

---

## Form Validation

All forms use `noValidate` — browser validation is suppressed, Zod handles errors. Test the Zod message, not the browser bubble:

```ts
cy.get('input[type="email"]').type('invalid-email')
cy.findByRole('button', { name: /sign in/i }).click()
cy.contains(/valid email required/i).should('be.visible') // Zod message
```

---

## Loading / Pending States

MSW responds instantly — use `cy.intercept` with `res.setDelay()` to catch pending UI:

```ts
cy.intercept('POST', '/api/auth/login', (req) => {
  req.on('response', (res) => { res.setDelay(500) })
}).as('loginRequest')

cy.findByRole('button', { name: /sign in/i }).click()
cy.findByRole('button', { name: /signing in/i }).should('exist')
cy.wait('@loginRequest')
```

---

## Mocking the Claude API

`analyzeUploadedImage` and `generateSimilarProblem` call `https://api.anthropic.com/v1/messages` via the Anthropic SDK. The response `text` field **must wrap the JSON in a `\`\`\`json` code fence** — that's what the parser looks for:

```ts
cy.intercept('POST', 'https://api.anthropic.com/v1/messages', {
  statusCode: 200,
  body: {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-6',
    content: [
      {
        type: 'text',
        text: '```json\n' + JSON.stringify({
          categoryId: 'cat-6',
          subcategoryId: 'sub-6-1',
          level: 'Beginner',
          schoolGrade: '5',
          title: 'Test Geometry Problem',
          content: 'Find the area of a rectangle with length 5 cm and width 3 cm.',
          answerContent: 'Area = 5 × 3 = 15 cm²',
        }) + '\n```',
      },
    ],
    stop_reason: 'end_turn',
    usage: { input_tokens: 100, output_tokens: 50 },
  },
}).as('claudeAnalyze')
```

> The `categoryId`/`subcategoryId` values must match seeded IDs (`cat-1` to `cat-14`, `sub-{n}-{m}`) or the Zod schema parse will fail silently and the upload won't be created.

For `generateSimilarProblem`, the expected JSON shape is `{ problem: string, answer: string }` wrapped in the same code fence pattern.

---

## File Upload

Use `cy.get('input[type="file"]').selectFile()` with a fixture:

```ts
cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png')
```

The fixture file must exist at `cypress/fixtures/sample-math-problem.png`. Always intercept the Claude API before triggering the upload — otherwise the real API is called.

---

## Confirm Dialogs

The delete upload button uses `window.confirm`. Handle it with `cy.on`:

```ts
// Confirm deletion
cy.on('window:confirm', () => true)

// Cancel deletion
cy.on('window:confirm', () => false)
```

> Register `cy.on('window:confirm', ...)` **before** the action that triggers it.

---

## Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| URL stays at `/login` after submit | Wrong credentials or Zod validation failed | Use `Cypress.env()` credentials |
| `findByRole('menuitem')` times out | No `role="menuitem"` in app — links are `<a>`, logout is `<button>` | Use `findByRole('link')` or `findByRole('button')` |
| `findByRole('option')` times out | Native `<select>` doesn't expose `role="option"` to Testing Library | Use `.select('Option Name')` |
| Claude intercept ignored | Mock body missing `\`\`\`json\`\`\`` fence | Wrap JSON in code fence — see Mocking section above |
| Upload created but wrong category | `categoryId` in mock doesn't match seeded IDs | Use `cat-1` to `cat-14` format |
| "Change your password" Chrome banner | Chrome breach detection | Disabled in `cypress.config.ts` via `credentials_enable_service: false` |
