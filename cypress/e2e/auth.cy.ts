describe('Authentication', () => {
  beforeEach(() => {
    localStorage.clear()
    cy.visit('/login')
  })

  describe('Login', () => {
    it('should login with valid credentials', () => {
      // Arrange
      const email = Cypress.env('TEST_EMAIL') as string
      const password = Cypress.env('TEST_PASSWORD') as string

      // Act
      cy.get('input[type="email"]').type(email)
      cy.get('input[type="password"]').type(password)
      cy.findByRole('button', { name: /sign in/i }).click()

      // Assert
      cy.url().should('eq', 'http://localhost:5173/')
      cy.findByText(/worksheets/i).should('be.visible')
    })

    it('should show error message with invalid email', () => {
      // Arrange & Act
      cy.get('input[type="email"]').type('invalid-email')
      cy.get('input[type="password"]').type('password123')
      cy.findByRole('button', { name: /sign in/i }).click()

      // Assert
      cy.contains(/valid email required/i).should('be.visible')
    })

    it('should show error message with empty password', () => {
      // Arrange & Act
      cy.get('input[type="email"]').type('abc@abc.co')
      cy.findByRole('button', { name: /sign in/i }).click()

      // Assert
      cy.contains(/password required/i).should('be.visible')
    })

    it('should show server error with invalid credentials', () => {
      // Arrange & Act
      cy.get('input[type="email"]').type('wrong@email.com')
      cy.get('input[type="password"]').type('wrongpassword')
      cy.findByRole('button', { name: /sign in/i }).click()

      // Assert
      cy.contains(/invalid/i).should('be.visible')
    })

    it('should show loading state during login', () => {
      // Delay the response so the pending state is visible long enough to assert
      cy.intercept('POST', '/api/auth/login', (req) => {
        req.on('response', (res) => { res.setDelay(500) })
      }).as('loginRequest')

      cy.get('input[type="email"]').type(Cypress.env('TEST_EMAIL'))
      cy.get('input[type="password"]').type(Cypress.env('TEST_PASSWORD'))
      cy.findByRole('button', { name: /sign in/i }).click()

      // Assert - button shows loading state while request is in flight
      cy.findByRole('button', { name: /signing in/i }).should('exist')
      cy.wait('@loginRequest')
    })
  })

  describe('Register', () => {
    it('should register new user with valid credentials', () => {
      // Arrange
      cy.findByRole('link', { name: /sign up/i }).click()
      cy.url().should('include', '/register')

      const email = `testuser-${Date.now()}@example.com`
      const password = 'TestPassword123'

      // Act
      cy.get('input[type="email"]').type(email)
      cy.get('input[type="password"]').type(password)
      cy.findByRole('radio', { name: /monthly/i }).click()
      cy.findByRole('button', { name: /sign up|create account/i }).click()

      // Assert
      cy.url().should('eq', 'http://localhost:5173/')
      cy.findByText(/worksheets/i).should('be.visible')
    })

    it('should show error with password less than 6 characters', () => {
      // Arrange
      cy.findByRole('link', { name: /sign up/i }).click()

      // Act
      cy.get('input[type="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('short')
      cy.findByRole('button', { name: /sign up|create account/i }).click()

      // Assert
      cy.contains(/at least 6 characters/i).should('be.visible')
    })

    it('should show error with invalid email on register', () => {
      // Arrange
      cy.findByRole('link', { name: /sign up/i }).click()

      // Act
      cy.get('input[type="email"]').type('invalid-email')
      cy.get('input[type="password"]').type('ValidPassword123')
      cy.findByRole('button', { name: /sign up|create account/i }).click()

      // Assert
      cy.contains(/valid email required/i).should('be.visible')
    })

    it('should show plan selection', () => {
      // Arrange
      cy.findByRole('link', { name: /sign up/i }).click()

      // Assert
      cy.findByRole('radio', { name: /monthly/i }).should('be.visible')
      cy.findByRole('radio', { name: /annual|yearly/i }).should('be.visible')
    })
  })

  describe('Logout', () => {
    it('should logout and redirect to login page', () => {
      // Arrange
      cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
      cy.visit('/')

      // Act - logout button is a standalone button in the navbar (not inside the account dropdown)
      cy.findByRole('button', { name: /logout/i }).click()

      // Assert
      cy.url().should('include', '/login')
      cy.get('input[type="email"]').should('be.visible')
    })

    it('should clear auth token on logout', () => {
      // Arrange
      cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
      cy.visit('/')

      // Act
      cy.findByRole('button', { name: /logout/i }).click()

      // Assert
      cy.window().then((win) => {
        const auth = win.localStorage.getItem('pizzamath-auth')
        expect(auth).to.be.null
      })
    })

    it('should redirect unauthenticated user to login', () => {
      // Arrange - no login

      // Act
      cy.visit('/')

      // Assert
      cy.url().should('include', '/login')
    })
  })
})
