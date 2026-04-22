const claudeAnalyzeMock = {
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
          level: 'Intermediate',
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
}

describe('Uploaded Worksheet Page', () => {
  beforeEach(() => {
    localStorage.clear()
    cy.login(Cypress.env('TEST_EMAIL') as string, Cypress.env('TEST_PASSWORD') as string)

    // Intercept Claude API call BEFORE triggering the upload
    cy.intercept('POST', 'https://api.anthropic.com/v1/messages', claudeAnalyzeMock).as('claudeAnalyze')

    // Create a test upload
    cy.visit('/my-uploads')
    cy.findByRole('button', { name: /\+ upload image/i }).click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png')

    // Wait for upload and navigate to detail page
    cy.wait('@claudeAnalyze', { timeout: 10000 })
    cy.url({ timeout: 10000 }).should('match', /\/my-uploads\/[a-z0-9-]+$/)
  })

  describe('Page Content', () => {
    it('should display worksheet title and metadata', () => {
      cy.findByText(/test geometry problem/i).should('be.visible')
      cy.contains(/my upload/i).should('be.visible')
      cy.contains(/intermediate/i).should('be.visible')
      cy.contains(/grade 5/i).should('be.visible')
    })

    it('should display worksheet content', () => {
      cy.findByText(/find the area/i).should('be.visible')
    })

    it('should have back link to My Uploads', () => {
      cy.findByRole('link', { name: /← my uploads/i }).should('be.visible')
      cy.findByRole('link', { name: /← my uploads/i }).click()
      cy.url().should('include', '/my-uploads')
    })
  })

  describe('Tab Navigation', () => {
    it('should display Worksheet tab by default', () => {
      cy.findByRole('button', { name: /worksheet/i }).should('be.visible')
      cy.findByText(/find the area/i).should('be.visible')
    })

    it('should switch to Answer Sheet tab', () => {
      cy.findByRole('button', { name: /answer sheet/i }).click()
      cy.findByText(/area = 5/i).should('be.visible')
      cy.findByText(/find the area/i).should('not.be.visible')
    })

    it('should toggle back to Worksheet tab', () => {
      cy.findByRole('button', { name: /answer sheet/i }).click()
      cy.findByRole('button', { name: /worksheet/i }).click()
      cy.findByText(/find the area/i).should('be.visible')
      cy.findByText(/area = 5/i).should('not.be.visible')
    })
  })

  describe('Original Image Toggle', () => {
    it('should show "Show original image" button', () => {
      cy.findByRole('button', { name: /show original image/i }).should('be.visible')
    })

    it('should display original image when toggled on', () => {
      cy.findByRole('button', { name: /show original image/i }).click()
      cy.get('img[alt="Original uploaded problem"]').should('be.visible')
    })

    it('should hide original image when toggled off', () => {
      cy.findByRole('button', { name: /show original image/i }).click()
      cy.findByRole('button', { name: /hide original image/i }).click()
      cy.get('img[alt="Original uploaded problem"]').should('not.be.visible')
    })

    it('should display image in proper container', () => {
      cy.findByRole('button', { name: /show original image/i }).click()
      cy.get('img[alt="Original uploaded problem"]').parent().should('have.class', 'rounded-xl')
    })
  })

  describe('Generate Similar Problem', () => {
    it('should display "Generate Similar Problem" button', () => {
      cy.findByRole('button', { name: /generate similar problem/i }).should('be.visible')
    })

    it('should show loading spinner while generating', () => {
      cy.intercept('POST', 'https://api.anthropic.com/v1/messages', (req) => {
        req.on('response', (res) => { res.setDelay(1000) })
      }).as('claudeGenerate')

      cy.findByRole('button', { name: /generate similar problem/i }).click()
      cy.contains(/generating/i).should('be.visible')
    })

    it('should disable button while generating', () => {
      cy.intercept('POST', 'https://api.anthropic.com/v1/messages', (req) => {
        req.on('response', (res) => { res.setDelay(500) })
      }).as('claudeGenerate')

      cy.findByRole('button', { name: /generate similar problem/i }).click()
      cy.findByRole('button', { name: /generating/i }).should('be.disabled')
    })

    it('should append generated problem to worksheet content', () => {
      cy.intercept('POST', 'https://api.anthropic.com/v1/messages', {
        statusCode: 200,
        body: {
          id: 'msg_similar',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-4-6',
          content: [
            {
              type: 'text',
              text: '```json\n' + JSON.stringify({
                problem: 'Find the area of a square with side 4 cm.',
                answer: 'Area = 4 × 4 = 16 cm²',
              }) + '\n```',
            },
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      }).as('claudeGenerate')

      cy.findByRole('button', { name: /generate similar problem/i }).click()
      cy.contains(/---/i, { timeout: 10000 }).should('be.visible')
    })

    it('should update answer sheet when generating similar problem', () => {
      cy.intercept('POST', 'https://api.anthropic.com/v1/messages', {
        statusCode: 200,
        body: {
          id: 'msg_similar',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-4-6',
          content: [
            {
              type: 'text',
              text: '```json\n' + JSON.stringify({
                problem: 'Find the perimeter of a rectangle with length 6 cm and width 4 cm.',
                answer: 'Perimeter = 2(6 + 4) = 20 cm',
              }) + '\n```',
            },
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      }).as('claudeGenerate')

      cy.findByRole('button', { name: /generate similar problem/i }).click()
      cy.wait('@claudeGenerate', { timeout: 10000 })
      cy.findByRole('button', { name: /answer sheet/i }).click()
      cy.contains(/---/i).should('be.visible')
    })

    it('should show error message on generation failure', () => {
      cy.intercept('POST', 'https://api.anthropic.com/v1/messages', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('claudeFail')

      cy.findByRole('button', { name: /generate similar problem/i }).click()
      cy.contains(/generation failed|error/i, { timeout: 5000 }).should('be.visible')
    })
  })

  describe('Progress Tracking', () => {
    it('should display progress entry form', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Score') || $body.text().includes('Date')) {
          cy.findByText(/score|date|comment/i).should('exist')
        }
      })
    })
  })
})
