import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from './RegisterForm'
import { renderWithProviders } from '@/test/renderWithProviders'
import { db } from '@/mocks/db'

describe('RegisterForm', () => {
  afterEach(() => {
    // Clean up any users created during tests (keep seed admin intact)
    db.user.deleteMany({ where: { email: { contains: '@test.pizzamath' } } })
  })

  it('should_render_email_password_plan_and_submit_button', () => {
    // Arrange
    renderWithProviders(<RegisterForm />)

    // Assert
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /monthly/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /annual/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('should_show_validation_error_when_password_is_too_short', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    // Act
    await user.type(screen.getByLabelText(/email/i), 'new@test.pizzamath')
    await user.type(screen.getByLabelText(/password/i), '123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument()
  })

  it('should_show_error_when_email_is_already_registered', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    // Act — use the seeded admin email
    await user.type(screen.getByLabelText(/email/i), 'abc@abc.co')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument()
  })

  it('should_default_plan_selection_to_monthly', () => {
    // Arrange
    renderWithProviders(<RegisterForm />)

    // Assert
    expect(screen.getByRole('radio', { name: /monthly/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /annual/i })).not.toBeChecked()
  })

  it('should_register_successfully_with_valid_inputs', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    // Act
    await user.type(screen.getByLabelText(/email/i), 'fresh@test.pizzamath')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert — no error message appears
    await waitFor(() => {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    })
  })

  it('should_link_to_login_page', () => {
    // Arrange
    renderWithProviders(<RegisterForm />)

    // Assert
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })
})
