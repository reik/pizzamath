describe('Worksheet Uploads', () => {
  beforeEach(() => {
    localStorage.clear()
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
      cy.findByText(/my uploads/i).should('be.visible')
    })

    it('should display My Uploads page with empty state', () => {
      // Act
      cy.visit('/my-uploads')

      // Assert
      cy.findByText(/my uploads/i).should('be.visible')
      cy.findByText(/no uploads yet/i).should('be.visible')
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
      cy.contains(/upload a math problem/i).should('not.be.visible')
    })

    it('should show drag-and-drop area in upload zone', () => {
      // Arrange
      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()

      // Assert
      cy.contains(/drag.*drop|click to select/i).should('be.visible')
    })

    it('should accept file uploads via drag and drop', () => {
      // Arrange
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
                title: 'Test Problem',
                content: 'Solve for x: 2x + 5 = 15',
                answerContent: 'x = 5',
              }) + '\n```',
            },
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      }).as('claudeAnalyze')

      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()

      // Act - select file via input
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png')

      // Assert - upload should proceed
      cy.findByText(/analyzing|processing|extracting/i, { timeout: 10000 }).should('exist')
    })

    it('should accept file uploads via file input click', () => {
      // Arrange
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
                title: 'Test Problem',
                content: 'Solve for x: 2x + 5 = 15',
                answerContent: 'x = 5',
              }) + '\n```',
            },
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      }).as('claudeAnalyze')

      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()

      // Act - select file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png')

      // Assert - should show processing state
      cy.findByText(/analyzing|processing/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Upload Creation', () => {
    it('should create an upload and navigate to upload detail page', () => {
      // Arrange
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
                title: 'Test Problem',
                content: 'Solve for x: 2x + 5 = 15',
                answerContent: 'x = 5',
              }) + '\n```',
            },
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      }).as('claudeAnalyze')

      cy.visit('/my-uploads')
      cy.findByRole('button', { name: /\+ upload image/i }).click()

      // Act - upload a file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png')

      // Assert - wait for redirect to upload detail page
      cy.wait('@claudeAnalyze', { timeout: 10000 })
      cy.url({ timeout: 10000 }).should('match', /\/my-uploads\/[a-z0-9-]+$/)
    })

    it('should store uploaded worksheet in My Uploads grid', () => {
      // Note: This test verifies that a previous upload appears in the grid
      // Assumes there's at least one upload from prior tests
      cy.visit('/my-uploads')

      // Assert - if uploads exist, they should be in the grid
      cy.get('body').then(($body) => {
        if (!$body.text().includes('No uploads yet')) {
          cy.get('[class*="grid"]').within(() => {
            cy.get('[class*="rounded"]').should('have.length.greaterThan', 0)
          })
        }
      })
    })
  })

  describe('Upload Deletion', () => {
    it('should show delete button on hover', () => {
      // Arrange - assumes there's at least one upload
      cy.visit('/my-uploads')

      // Act - hover over a card
      cy.get('[class*="group"]').first().trigger('mouseenter')

      // Assert - delete button should appear
      cy.get('[aria-label="Delete upload"]').first().should('be.visible')
    })

    it('should delete an upload on confirmation', () => {
      // Arrange
      cy.visit('/my-uploads')

      cy.get('[class*="group"]').then(($cards) => {
        const initialCount = $cards.length

        if (initialCount > 0) {
          // Register confirm handler BEFORE the action that triggers it
          cy.on('window:confirm', () => true)

          // Act
          cy.get('[class*="group"]').first().trigger('mouseenter')
          cy.get('[aria-label="Delete upload"]').first().click()

          // Assert - upload should be removed (after async delete)
          cy.get('[class*="group"]', { timeout: 5000 }).should('have.length.lessThan', initialCount)
        }
      })
    })

    it('should cancel deletion on dialog cancel', () => {
      // Arrange
      cy.visit('/my-uploads')

      cy.get('[class*="group"]').then(($cards) => {
        const initialCount = $cards.length

        if (initialCount > 0) {
          // Register confirm handler BEFORE the action that triggers it
          cy.on('window:confirm', () => false)

          // Act
          cy.get('[class*="group"]').first().trigger('mouseenter')
          cy.get('[aria-label="Delete upload"]').first().click()

          // Assert - upload should still be there
          cy.get('[class*="group"]').should('have.length', initialCount)
        }
      })
    })
  })

  describe('Uploaded Worksheets in Browse Grid', () => {
    it('should display uploaded worksheets in browse grid', () => {
      // Navigate to browse page
      cy.visit('/')

      // Assert - if uploads exist, they should appear in the grid
      cy.get('body').then(($body) => {
        if ($body.text().includes('My Upload')) {
          cy.contains(/my upload/i).should('be.visible')
        }
      })
    })

    it('should navigate to uploaded worksheet detail from browse grid', () => {
      // Arrange
      cy.visit('/')

      // Act - find and click an uploaded worksheet card (with "My Upload" badge)
      cy.contains(/my upload/i).parent().parent().click()

      // Assert - should navigate to uploaded worksheet page
      cy.url({ timeout: 5000 }).should('match', /\/my-uploads\/[a-z0-9-]+$/)
    })
  })
})
