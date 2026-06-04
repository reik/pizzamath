import './commands'
import '@testing-library/cypress/add-commands'

// The e2e suite runs against the real backend (npm run dev:all). Make sure the
// shared test user exists before any spec runs so both UI logins and the
// programmatic cy.login() command can authenticate.
before(() => {
  cy.ensureTestUser(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
})
