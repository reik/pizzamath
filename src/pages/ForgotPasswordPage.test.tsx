import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('ForgotPasswordPage', () => {
  it('should_render_email_input_and_submit_button', () => {
    renderWithProviders(<ForgotPasswordPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('should_show_validation_error_for_invalid_email', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText(/valid email required/i)).toBeInTheDocument()
  })

  it('should_show_success_message_after_submission', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText(/check your email/i, { timeout: 5000 })).toBeInTheDocument()
  })

  it('should_link_back_to_login', () => {
    renderWithProviders(<ForgotPasswordPage />)
    expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute('href', '/login')
  })
})
