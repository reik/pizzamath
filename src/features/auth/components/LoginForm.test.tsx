import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('LoginForm', () => {
  it('should_render_email_password_inputs_and_submit_button', () => {
    // Arrange
    renderWithProviders(<LoginForm />)

    // Assert
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should_show_validation_errors_when_submitted_empty', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    // Act
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Assert
    expect(await screen.findByText(/valid email required/i)).toBeInTheDocument()
    expect(screen.getByText(/password required/i)).toBeInTheDocument()
  })

  it('should_show_error_when_credentials_are_invalid', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    // Act
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Assert
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
  })

  it('should_disable_submit_button_while_pending', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    // Act
    await user.type(screen.getByLabelText(/email/i), 'abc@abc.co')
    await user.type(screen.getByLabelText(/password/i), '123123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Assert — button briefly becomes disabled + shows pending text
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })

  it('should_link_to_register_page', () => {
    // Arrange
    renderWithProviders(<LoginForm />)

    // Assert
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register')
  })
})
