// The app sends image analysis to the backend Claude endpoint
// (src/api/claude.ts -> `${VITE_API_BASE_URL}/api/claude/analyze-image`), which
// returns metadata already parsed into the GeneratedMetadata shape. Intercept
// by path so it matches regardless of which host VITE_API_BASE_URL points to.
const ANALYZE_IMAGE = /\/api\/claude\/analyze-image$/
const analyzeMetadata = {
  categoryId: 'cat-6',
  subcategoryId: 'sub-6-1',
  level: 'Beginner',
  schoolGrade: '5',
  title: 'Test Problem',
  content: 'Solve for x: 2x + 5 = 15',
  answerContent: 'x = 5',
}

describe('Worksheet Uploads', () => {
  beforeEach(() => {
    localStorage.clear()
    cy.resetUploads(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  describe('My Uploads Navigation', () => {
    it('should navigate to My Uploads from Account menu', () => {
      // Arrange
      cy.visit('/')

      // Act
      cy.findByRole('button', { name: /account/i }).click()
      cy.findByRole('link', { name: /my uploads/i }).click()

      // Assert
      cy.url().should('include', '/my-uploads')
      cy.findByRole('heading', { name: /my uploads/i }).should('be.visible')
    })

    it('should display My Uploads page', () => {
      // Act
      cy.visit('/my-uploads')

      // Assert
      cy.findByRole('heading', { name: /my uploads/i }).should('be.visible')
    })

    it('should show "+ Upload Image" button on My Uploads page', () => {
      // Act
      cy.visit('/my-uploads')

      // Assert
      cy.findByRole('button', { name: /\+ upload image/i }).should('be.visible')
    })
  })

  describe('Upload Zone', () => {
    it('should toggle upload zone visibility on button click', () => {
      // Arrange
      cy.visit('/my-uploads')

      // Act - click to show uploader
      cy.findByRole('button', { name: /\+ upload image/i }).click()

      // Assert - upload zone should be visible
      cy.contains(/upload a math problem/i).should('be.visible')

      // Act - click to hide
      cy.findByRole('button', { name: /cancel/i }).click()

      // Assert - upload zone should be hidden
      cy.contains(/upload a math problem/i).should('not.exist')
    })

    it('should show drag-and-drop area in upload zone', () => {
      // Arrange
      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()

      // Assert
      cy.contains(/drop an image|click to browse/i).should('be.visible')
    })

    it('should accept file uploads via file input', () => {
      // Arrange
      cy.intercept('POST', ANALYZE_IMAGE, { statusCode: 200, body: analyzeMetadata }).as('claudeAnalyze')

      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()

      // Act - select file via the (visually hidden) file input
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png', { force: true })

      // Assert - upload should proceed into the analyzing/saving state
      cy.findByText(/analyzing|saving/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Upload Creation', () => {
    it('should create an upload and navigate to upload detail page', () => {
      // Arrange
      cy.intercept('POST', ANALYZE_IMAGE, { statusCode: 200, body: analyzeMetadata }).as('claudeAnalyze')

      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()

      // Act - upload a file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png', { force: true })

      // Assert - wait for analysis then redirect to upload detail page
      cy.wait('@claudeAnalyze', { timeout: 10000 })
      cy.url({ timeout: 10000 }).should('match', /\/my-uploads\/[a-z0-9-]+$/)
    })

    it('should store uploaded worksheet in My Uploads grid', () => {
      // Arrange - create an upload first so the grid is guaranteed non-empty
      cy.intercept('POST', ANALYZE_IMAGE, { statusCode: 200, body: analyzeMetadata }).as('claudeAnalyze')
      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png', { force: true })
      cy.wait('@claudeAnalyze', { timeout: 10000 })

      // Act
      cy.visit('/my-uploads')

      // Assert - the uploaded worksheet appears in the grid
      cy.get('[class*="grid"]').within(() => {
        cy.findAllByText(/test problem/i).should('have.length.greaterThan', 0)
      })
    })
  })

  describe('Upload Deletion', () => {
    beforeEach(() => {
      // Ensure at least one upload exists for deletion tests
      cy.intercept('POST', ANALYZE_IMAGE, { statusCode: 200, body: analyzeMetadata }).as('claudeAnalyze')
      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png', { force: true })
      cy.wait('@claudeAnalyze', { timeout: 10000 })
      cy.visit('/my-uploads')
    })

    it('should show delete button on hover', () => {
      // Act - hover over a card
      cy.get('[class*="group"]').first().trigger('mouseenter')

      // Assert - delete button should exist
      cy.get('[aria-label="Delete upload"]').first().should('exist')
    })

    it('should delete an upload on confirmation', () => {
      cy.get('[class*="group"]').then(($cards) => {
        const initialCount = $cards.length

        // Register confirm handler BEFORE the action that triggers it
        cy.on('window:confirm', () => true)

        // Act
        cy.get('[class*="group"]').first().trigger('mouseenter')
        cy.get('[aria-label="Delete upload"]').first().click({ force: true })

        // Assert - upload should be removed (after async delete)
        cy.get('[class*="group"]', { timeout: 5000 }).should('have.length.lessThan', initialCount)
      })
    })

    it('should cancel deletion on dialog cancel', () => {
      cy.get('[class*="group"]').then(($cards) => {
        const initialCount = $cards.length

        // Register confirm handler BEFORE the action that triggers it
        cy.on('window:confirm', () => false)

        // Act
        cy.get('[class*="group"]').first().trigger('mouseenter')
        cy.get('[aria-label="Delete upload"]').first().click({ force: true })

        // Assert - upload should still be there
        cy.get('[class*="group"]').should('have.length', initialCount)
      })
    })
  })

  describe('Uploaded Worksheets in Browse Grid', () => {
    beforeEach(() => {
      // Ensure an upload exists so it appears in the browse grid
      cy.intercept('POST', ANALYZE_IMAGE, { statusCode: 200, body: analyzeMetadata }).as('claudeAnalyze')
      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png', { force: true })
      cy.wait('@claudeAnalyze', { timeout: 10000 })
    })

    it('should display uploaded worksheets in browse grid', () => {
      cy.visit('/')
      cy.findAllByText(/my upload/i).should('have.length.greaterThan', 0)
    })

    it('should navigate to uploaded worksheet detail from browse grid', () => {
      cy.visit('/')

      // Act - click an uploaded worksheet card (links to /my-uploads/<id>)
      cy.get('a[href*="/my-uploads/"]').first().click()

      // Assert - should navigate to the uploaded worksheet page
      cy.url({ timeout: 5000 }).should('match', /\/my-uploads\/[a-z0-9-]+$/)
    })
  })
})
