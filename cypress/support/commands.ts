import type { User } from '../../src/types/user'

interface LoginResponse {
  token: string
  user: User
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request<LoginResponse>({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      const { token } = response.body
      localStorage.setItem('pizzamath-auth', JSON.stringify({
        state: {
          user: response.body.user,
          token,
        },
      }))
    }
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
    }
  }
}
