// Insights page tests — covers the /insights route: navigation via Account menu,
// empty state, and data display (mistake chart, recent gradings list, practice
// outcomes). Backend data is mocked via cy.intercept so tests don't depend on
// having real gradings in the DB.

const INSIGHTS_API = /\/api\/gradings\/insights\/me$/

const emptyInsights = {
  totalGradings: 0,
  byCategory: [],
  recent: [],
  practiceOutcomes: [],
}

const richInsights = {
  totalGradings: 5,
  byCategory: [
    { category: 'arithmetic_fact', count: 4 },
    { category: 'fraction_common_denominator', count: 2 },
  ],
  recent: [
    { id: 'grading-recent-1', score: 8, total: 10, createdAt: new Date('2026-05-01').toISOString() },
    { id: 'grading-recent-2', score: 6, total: 10, createdAt: new Date('2026-04-20').toISOString() },
  ],
  practiceOutcomes: [
    {
      category: 'arithmetic_fact',
      firstDrilledAt: new Date('2026-04-25').toISOString(),
      preDrillErrors: 4,
      preDrillGradings: 3,
      postDrillErrors: 1,
      postDrillGradings: 2,
      status: 'fixed',
    },
  ],
}

describe('Insights Page', () => {
  beforeEach(() => {
    localStorage.clear()
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  describe('Navigation', () => {
    it('should be accessible from the Account menu', () => {
      cy.intercept('GET', INSIGHTS_API, { statusCode: 200, body: emptyInsights }).as('insights')
      cy.visit('/')

      cy.findByRole('button', { name: /account/i }).click()
      cy.findByRole('link', { name: /insights/i }).should('be.visible').click()

      cy.url({ timeout: 10000 }).should('include', '/insights')
      cy.wait('@insights')
      cy.findByRole('heading', { name: /skill-gap insights/i }).should('be.visible')
    })

    it('should be directly accessible at /insights', () => {
      cy.intercept('GET', INSIGHTS_API, { statusCode: 200, body: emptyInsights }).as('insights')
      cy.visit('/insights')

      cy.wait('@insights')
      cy.findByRole('heading', { name: /skill-gap insights/i }).should('be.visible')
    })
  })

  describe('Empty state', () => {
    it('should show 0 worksheets graded when there is no data', () => {
      cy.intercept('GET', INSIGHTS_API, { statusCode: 200, body: emptyInsights }).as('insights')
      cy.visit('/insights')

      cy.wait('@insights')
      cy.contains(/0 worksheets graded/i).should('be.visible')
    })
  })

  describe('Data display', () => {
    beforeEach(() => {
      cy.intercept('GET', INSIGHTS_API, { statusCode: 200, body: richInsights }).as('insights')
      cy.visit('/insights')
      cy.wait('@insights')
    })

    it('should display total worksheets graded', () => {
      cy.contains(/5 worksheets graded/i).should('be.visible')
    })

    it('should render the "Most common mistakes" section', () => {
      cy.contains(/most common mistakes/i).should('be.visible')
    })

    it('should list recent gradings with score and date', () => {
      cy.contains(/recent gradings/i).should('be.visible')
      cy.contains(/8\s*\/\s*10/i).should('be.visible')
      cy.contains(/6\s*\/\s*10/i).should('be.visible')
    })

    it('should link recent gradings to the grading detail page', () => {
      cy.get('a[href*="/gradings/grading-recent-1"]').should('be.visible')
    })

    it('should show the "Practice progress" section when outcomes exist', () => {
      cy.contains(/practice progress/i).should('be.visible')
    })
  })

  describe('Practice outcomes', () => {
    it('should show "fixed" status for a category that improved after drilling', () => {
      cy.intercept('GET', INSIGHTS_API, { statusCode: 200, body: richInsights }).as('insights')
      cy.visit('/insights')
      cy.wait('@insights')

      cy.contains(/practice progress/i).should('be.visible')
      cy.contains(/✓ fixed/i).should('be.visible')
    })

    it('should not show Practice progress section when there are no outcomes', () => {
      cy.intercept('GET', INSIGHTS_API, { statusCode: 200, body: { ...richInsights, practiceOutcomes: [] } }).as('insights')
      cy.visit('/insights')
      cy.wait('@insights')

      cy.contains(/practice progress/i).should('not.exist')
    })
  })
})
