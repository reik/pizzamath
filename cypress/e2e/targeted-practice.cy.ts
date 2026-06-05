// Targeted practice tests — covers the "Generate targeted practice" button on
// the GradingPage. Intercepts both the grading fetch and the generate-practice
// mutation to avoid real Claude calls; verifies the button states and the
// subsequent navigation to the generated worksheet.

const ANALYZE_IMAGE = /\/api\/claude\/analyze-image$/
const CREATE_GRADING = /\/api\/gradings$/
const GET_GRADING = /\/api\/gradings\/test-grading-tp-001$/
const GENERATE_PRACTICE = /\/api\/gradings\/test-grading-tp-001\/generate-practice$/

const analyzeMetadata = {
  categoryId: 'cat-6',
  subcategoryId: 'sub-6-1',
  level: 'Intermediate',
  schoolGrade: '5',
  title: 'Fraction Practice',
  content: '1/3 + 2/3',
  answerContent: '1',
}

const mockGradingWithMistakes = {
  id: 'test-grading-tp-001',
  uploadId: 'test-upload-tp-001',
  score: 5,
  total: 10,
  createdAt: new Date().toISOString(),
  problems: [
    {
      problemIndex: 0,
      problemText: '1/3 + 2/3',
      expectedAnswer: '1',
      studentAnswer: '3/6',
      isCorrect: false,
      errorCategory: 'fraction_simplification',
      errorExplanation: 'Did not simplify 3/3 to 1.',
    },
    {
      problemIndex: 1,
      problemText: '5 × 6',
      expectedAnswer: '30',
      studentAnswer: '35',
      isCorrect: false,
      errorCategory: 'arithmetic_fact',
      errorExplanation: 'Multiplication fact error.',
    },
  ],
}

const mockGeneratedWorksheet = {
  id: 'generated-ws-001',
  title: 'Targeted Practice: Fractions',
  categoryId: 'cat-6',
  subcategoryId: 'sub-6-1',
  level: 'Intermediate',
  schoolGrade: '5',
  content: '## Practice\n\nSimplify: 6/8',
  answerContent: '3/4',
  createdAt: new Date().toISOString(),
}

describe('Targeted Practice Generation', () => {
  beforeEach(() => {
    localStorage.clear()
    cy.resetUploads(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))

    // Create an upload so "Grade this" is available
    cy.intercept('POST', ANALYZE_IMAGE, { statusCode: 200, body: analyzeMetadata }).as('claudeAnalyze')
    cy.visit('/my-uploads')
    cy.findByRole('button', { name: /\+ upload image/i }).click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-math-problem.png', { force: true })
    cy.wait('@claudeAnalyze', { timeout: 10000 })
    cy.visit('/my-uploads')

    // Grade the upload → land on grading page
    cy.intercept('POST', CREATE_GRADING, { statusCode: 201, body: mockGradingWithMistakes }).as('createGrading')
    cy.intercept('GET', GET_GRADING, { statusCode: 200, body: mockGradingWithMistakes }).as('getGrading')
    cy.findByRole('button', { name: /grade this/i }).click()
    cy.wait('@createGrading', { timeout: 10000 })
    cy.url({ timeout: 5000 }).should('include', '/gradings/test-grading-tp-001')
  })

  it('should display "Generate targeted practice" button on grading page', () => {
    cy.findByRole('button', { name: /generate targeted practice/i }).should('be.visible')
  })

  it('should show "Generating…" and disable the button while in flight', () => {
    cy.intercept('POST', GENERATE_PRACTICE, (req) => {
      req.reply({ delay: 1000, statusCode: 201, body: mockGeneratedWorksheet })
    }).as('generatePractice')

    cy.findByRole('button', { name: /generate targeted practice/i }).click()
    cy.findByRole('button', { name: /generating…/i }).should('be.disabled')
  })

  it('should navigate to /worksheets/:id after successful generation', () => {
    cy.intercept('POST', GENERATE_PRACTICE, { statusCode: 201, body: mockGeneratedWorksheet }).as('generatePractice')

    cy.findByRole('button', { name: /generate targeted practice/i }).click()
    cy.wait('@generatePractice', { timeout: 10000 })
    cy.url({ timeout: 5000 }).should('include', '/worksheets/generated-ws-001')
  })

  it('should show an error message when generation fails', () => {
    cy.intercept('POST', GENERATE_PRACTICE, {
      statusCode: 422,
      body: { message: 'Generation failed' },
    }).as('generateFail')

    cy.findByRole('button', { name: /generate targeted practice/i }).click()
    cy.wait('@generateFail', { timeout: 10000 })
    cy.contains(/generation failed|error/i, { timeout: 5000 }).should('be.visible')
  })
})
