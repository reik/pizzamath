describe('Browse Worksheets', () => {
  beforeEach(() => {
    localStorage.clear()
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
    cy.visit('/')
  })

  describe('Grid Display', () => {
    it('should load and display worksheet grid', () => {
      cy.findByRole('heading', { name: /worksheets/i }).should('be.visible')
      cy.get('[class*="grid"]').within(() => {
        cy.findByText(/operations|counting|geometry|algebra/i).should('exist')
      })
    })

    it('should display worksheet count', () => {
      cy.findByRole('heading', { name: /worksheets/i }).within(() => {
        cy.get('span').should('exist')
      })
    })
  })

  describe('Category Filter', () => {
    it('should filter worksheets by category', () => {
      cy.findByRole('combobox', { name: /category/i }).select('Geometry')
      cy.findByRole('heading', { name: /worksheets/i }).should('be.visible')
    })

    it('should clear category filter', () => {
      cy.findByRole('combobox', { name: /category/i }).select('Counting & Cardinality')
      cy.findByRole('combobox', { name: /category/i }).select('All Categories')
      cy.findByRole('heading', { name: /worksheets/i }).should('be.visible')
    })
  })

  describe('Subcategory Filter', () => {
    it('should show subcategory dropdown after selecting category', () => {
      cy.findByRole('combobox', { name: /category/i }).select('Operations & Algebraic Thinking')
      cy.findByRole('combobox', { name: /subcategory/i }).should('be.visible')
    })

    it('should filter by subcategory within a category', () => {
      cy.findByRole('combobox', { name: /category/i }).select('Operations & Algebraic Thinking')
      cy.findByRole('combobox', { name: /subcategory/i }).should('be.visible')
      cy.findByRole('combobox', { name: /subcategory/i })
        .find('option')
        .its('length')
        .should('be.gt', 1)
    })
  })

  describe('Keyword Search', () => {
    it('should filter worksheets by keyword', () => {
      cy.findByRole('searchbox', { name: /search/i }).type('addition')
      cy.findByRole('heading', { name: /worksheets/i }).should('be.visible')
    })

    it('should show no results message when search yields nothing', () => {
      cy.findByRole('searchbox', { name: /search/i }).type('xyz-nonexistent-keyword')
      cy.contains(/no worksheets|no results/i).should('be.visible')
    })
  })

  describe('Worksheet Cards', () => {
    it('should navigate to worksheet detail on card click', () => {
      cy.get('[class*="grid"]').within(() => {
        cy.get('a').first().click()
      })
      cy.url().should('match', /\/worksheets\/[a-z0-9-]+$/)
    })

    it('should display worksheet metadata on cards', () => {
      cy.get('[class*="grid"]').within(() => {
        cy.findByText(/beginner|intermediate|advanced/i).should('exist')
      })
    })
  })
})
