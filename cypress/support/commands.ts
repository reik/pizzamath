import type { User } from '../../src/types/user'

interface LoginResponse {
  token: string
  user: User
}

// The app router is served under Vite's base path ("/pizzamath/"), so the
// Cypress baseUrl includes it. The backend API, however, lives at the host
// root ("/api/..."), not under the base path. cy.request concatenates the
// baseUrl with the given path, so we must target the origin explicitly to
// avoid hitting "/pizzamath/api/...".
function apiUrl(path: string): string {
  const origin = new URL(Cypress.config('baseUrl') as string).origin
  return `${origin}${path}`
}

// Ensure the shared e2e test user exists. Registration is idempotent here:
// a 409 (already registered) is treated as success.
Cypress.Commands.add('ensureTestUser', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: apiUrl('/api/auth/register'),
    body: { email, password, plan: 'monthly' },
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status, 'register test user (201 created or 409 exists)').to.be.oneOf([201, 409])
  })
})

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request<LoginResponse>({
    method: 'POST',
    url: apiUrl('/api/auth/login'),
    body: { email, password },
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status, 'login test user').to.eq(200)
    const { token } = response.body
    localStorage.setItem('pizzamath-auth', JSON.stringify({
      state: {
        user: response.body.user,
        token,
      },
    }))
  })
})

// Delete all uploads belonging to the test user. The e2e suite runs against a
// persistent backend DB, so upload-creating tests would otherwise accumulate
// rows across runs and make the suite slow and flaky. Keep it self-contained
// (its own login) so it can run before cy.login in a beforeEach.
Cypress.Commands.add('resetUploads', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: apiUrl('/api/auth/login'),
    body: { email, password },
    failOnStatusCode: false,
  }).then((login) => {
    if (login.status !== 200) return
    const { token, user } = login.body as { token: string; user: { id: string } }
    const auth = { Authorization: `Bearer ${token}` }
    cy.request({
      method: 'GET',
      url: apiUrl(`/api/user-uploads?userId=${user.id}`),
      headers: auth,
      failOnStatusCode: false,
    }).then((res) => {
      if (!Array.isArray(res.body)) return
      ;(res.body as Array<{ id: string }>).forEach((u) => {
        cy.request({ method: 'DELETE', url: apiUrl(`/api/user-uploads/${u.id}`), headers: auth, failOnStatusCode: false })
      })
    })
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      ensureTestUser(email: string, password: string): Chainable<void>
      resetUploads(email: string, password: string): Chainable<void>
    }
  }
}
