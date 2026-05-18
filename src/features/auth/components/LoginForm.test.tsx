import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('LoginForm', () => {
  it('should_render_magic_link_email_input_by_default', () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /email me a sign-in link/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it('should_show_validation_error_when_magic_link_submitted_empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /email me a sign-in link/i }))

    expect(await screen.findByText(/valid email required/i)).toBeInTheDocument()
  })

  it('should_reveal_password_fields_when_toggled_to_password_mode', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /use password instead/i }))

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('should_show_password_validation_errors_when_submitted_empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /use password instead/i }))
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText(/password required/i)).toBeInTheDocument()
  })

  it('should_link_to_register_page', () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register')
  })
})
