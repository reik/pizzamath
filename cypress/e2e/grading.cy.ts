// Grading flow tests — covers the path from My Uploads → "Grade this" →
// GradingPage. The backend grades images via Claude vision, so we intercept
// POST /api/gradings and GET /api/gradings/:id to avoid real AI calls.

const ANALYZE_IMAGE = /\/api\/claude\/analyze-image$/
const CREATE_GRADING = /\/api\/gradings$/
const GET_GRADING_WITH_MISTAKES = /\/api\/gradings\/test-grading-001$/
const GET_GRADING_ALL_CORRECT = /\/api\/gradings\/test-grading-002$/

const analyzeMetadata = {
  categoryId: 'cat-6',
  subcategoryId: 'sub-6-1',
  level: 'Intermediate',
  schoolGrade: '5',
  title: 'Fractions Test',
  content: 'Solve: 1/2 + 1/4',
  answerContent: '3/4',
}

const mockGradingWithMistakes = {
  id: 'test-grading-001',
  uploadId: 'test-upload-001',
  score: 7,
  total: 10,
  createdAt: new Date().toISOString(),
  problems: [
    {
      problemIndex: 0,
      problemText: '1/2 + 1/4',
      expectedAnswer: '3/4',
      studentAnswer: '2/4',
      isCorrect: false,
      errorCategory: 'fraction_common_denominator',
      errorExplanation: 'Did not find common denominator before adding.',
    },
    {
      problemIndex: 1,
      problemText: '3 × 4',
      expectedAnswer: '12',
      studentAnswer: '12',
      isCorrect: true,
    },
    {
      problemIndex: 2,
      problemText: '10 - 6',
      expectedAnswer: '4',
      studentAnswer: '3',
      isCorrect: false,
      errorCategory: 'arithmetic_fact',
      errorExplanation: 'Subtraction fact error.',
    },
  ],
}

const mockGradingAllCorrect = {
  id: 'test-grading-002',
  uploadId: 'test-upload-001',
  score: 3,
  total: 3,
  createdAt: new Date().toISOString(),
  problems: [
    { problemIndex: 0, problemText: '2 + 2', expectedAnswer: '4', studentAnswer: '4', isCorrect: true },
    { problemIndex: 1, problemText: '3 × 3', expectedAnswer: '9', studentAnswer: '9', isCorrect: true },
    { problemIndex: 2, problemText: '8 / 4', expectedAnswer: '2', studentAnswer: '2', isCorrect: true },
  ],
}

describe('Grading Flow', () => {
  beforeEach(() => {
    localStorage.clear()
    cy.resetUploads(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))

    // Create one upload so the "Grade this" button appears
    cy.intercept('POST', ANALYZE_IMAGE, { statusCode: 200, body: analyzeMetadata }).as('claudeAnalyze')
    cy.visit('/my-uploads')
    cy.findByRole('button', { name: /\+ upload image/i }).click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png', { force: true })
    cy.wait('@claudeAnalyze', { timeout: 10000 })
    cy.visit('/my-uploads')
  })

  describe('Triggering a grading', () => {
    it('should show a "Grade this" button on each upload card', () => {
      cy.findByRole('button', { name: /grade this/i }).should('be.visible')
    })

    it('should show "Grading…" while the request is in flight', () => {
      cy.intercept('POST', CREATE_GRADING, (req) => {
        req.reply({ delay: 800, statusCode: 201, body: mockGradingWithMistakes })
      }).as('createGrading')

      cy.findByRole('button', { name: /grade this/i }).click()
      cy.findByRole('button', { name: /grading…/i }).should('be.disabled')
    })

    it('should navigate to /gradings/:id after successful grading', () => {
      cy.intercept('POST', CREATE_GRADING, { statusCode: 201, body: mockGradingWithMistakes }).as('createGrading')
      cy.intercept('GET', GET_GRADING_WITH_MISTAKES, { statusCode: 200, body: mockGradingWithMistakes }).as('getGrading')

      cy.findByRole('button', { name: /grade this/i }).click()
      cy.wait('@createGrading', { timeout: 10000 })
      cy.url({ timeout: 5000 }).should('include', '/gradings/test-grading-001')
    })
  })

  describe('Grading page with mistakes', () => {
    beforeEach(() => {
      cy.intercept('POST', CREATE_GRADING, { statusCode: 201, body: mockGradingWithMistakes }).as('createGrading')
      cy.intercept('GET', GET_GRADING_WITH_MISTAKES, { statusCode: 200, body: mockGradingWithMistakes }).as('getGrading')
      cy.findByRole('button', { name: /grade this/i }).click()
      cy.wait('@createGrading', { timeout: 10000 })
      cy.url({ timeout: 5000 }).should('include', '/gradings/test-grading-001')
    })

    it('should display the score', () => {
      cy.contains(/score:/i).should('be.visible')
      cy.contains(/7\s*\/\s*10/i).should('be.visible')
    })

    it('should display the error breakdown section with mistake categories', () => {
      cy.contains(/where the mistakes are/i).should('be.visible')
      cy.contains(/missing common denominator/i).should('be.visible')
      cy.contains(/arithmetic fact error/i).should('be.visible')
    })

    it('should list all problems', () => {
      cy.contains(/1\/2 \+ 1\/4/i).should('be.visible')
      cy.contains(/3 × 4/i).should('be.visible')
      cy.contains(/10 - 6/i).should('be.visible')
    })

    it('should show error explanation for incorrect problems', () => {
      cy.contains(/did not find common denominator/i).should('be.visible')
    })

    it('should show "Generate targeted practice" button when there are mistakes', () => {
      cy.findByRole('button', { name: /generate targeted practice/i }).should('be.visible')
    })

    it('should have a back link to My Uploads', () => {
      cy.findByRole('link', { name: /back to uploads/i }).should('be.visible')
      cy.findByRole('link', { name: /back to uploads/i }).click()
      cy.url().should('include', '/my-uploads')
    })
  })

  describe('Grading page — all correct', () => {
    it('should show "No mistakes" and hide the targeted practice button', () => {
      cy.intercept('POST', CREATE_GRADING, { statusCode: 201, body: mockGradingAllCorrect }).as('createGrading')
      cy.intercept('GET', GET_GRADING_ALL_CORRECT, { statusCode: 200, body: mockGradingAllCorrect }).as('getGrading')

      cy.findByRole('button', { name: /grade this/i }).click()
      cy.wait('@createGrading', { timeout: 10000 })
      cy.url({ timeout: 5000 }).should('include', '/gradings/test-grading-002')

      cy.contains(/no mistakes/i).should('be.visible')
      cy.findByRole('button', { name: /generate targeted practice/i }).should('not.exist')
    })
  })
})
