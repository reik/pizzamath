import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ResetPasswordPage } from './ResetPasswordPage'
import { authApi } from '@/api/auth'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('ResetPasswordPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_render_new_password_and_confirm_inputs', () => {
    renderWithProviders(<ResetPasswordPage />, {
      routerProps: { initialEntries: ['/reset-password?token=abc123'] },
    })
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument()
  })

  it('should_show_error_when_passwords_do_not_match', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordPage />, {
      routerProps: { initialEntries: ['/reset-password?token=abc123'] },
    })
    await user.type(screen.getByLabelText(/new password/i), import.meta.env.VITE_TEST_PASSWORD)
    await user.type(screen.getByLabelText(/confirm/i), 'different456')
    await user.click(screen.getByRole('button', { name: /set new password/i }))
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('should_show_error_message_when_token_is_invalid', async () => {
    vi.spyOn(authApi, 'resetPassword').mockRejectedValueOnce(new Error('Invalid or expired reset link'))
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordPage />, {
      routerProps: { initialEntries: ['/reset-password?token=bad-token'] },
    })
    await user.type(screen.getByLabelText(/new password/i), import.meta.env.VITE_TEST_PASSWORD)
    await user.type(screen.getByLabelText(/confirm/i), import.meta.env.VITE_TEST_PASSWORD)
    await user.click(screen.getByRole('button', { name: /set new password/i }))
    expect(await screen.findByText(/invalid or expired/i, { timeout: 5000 })).toBeInTheDocument()
  })

  it('should_show_missing_token_message_when_no_token_in_url', () => {
    renderWithProviders(<ResetPasswordPage />, {
      routerProps: { initialEntries: ['/reset-password'] },
    })
    expect(screen.getByText(/missing or invalid reset link/i)).toBeInTheDocument()
  })
})
