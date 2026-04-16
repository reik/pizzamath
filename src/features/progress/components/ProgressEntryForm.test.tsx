import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressEntryForm } from './ProgressEntryForm'
import { renderWithProviders } from '@/test/renderWithProviders'
import { db } from '@/mocks/db'

const defaultProps = {
  worksheetId: 'ws-1',
  worksheetTitle: 'Counting Objects 1–10',
  userId: 'user-test-progress',
}

afterEach(() => {
  db.progressEntry.deleteMany({ where: { userId: { equals: defaultProps.userId } } })
})

describe('ProgressEntryForm', () => {
  it('should_render_date_score_and_comment_fields', () => {
    // Arrange + Act
    renderWithProviders(<ProgressEntryForm {...defaultProps} />)

    // Assert
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/score/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/comment/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save attempt/i })).toBeInTheDocument()
  })

  it('should_default_date_to_today', () => {
    // Arrange
    const today = new Date().toISOString().split('T')[0]

    // Act
    renderWithProviders(<ProgressEntryForm {...defaultProps} />)

    // Assert
    expect(screen.getByLabelText(/date/i)).toHaveValue(today)
  })

  it('should_show_validation_error_when_score_is_above_100', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<ProgressEntryForm {...defaultProps} />)
    const scoreInput = screen.getByLabelText(/score/i)

    // Act — clear then type an out-of-range value (HTML min/max removed; Zod validates)
    await user.clear(scoreInput)
    await user.type(scoreInput, '150')
    await user.click(screen.getByRole('button', { name: /save attempt/i }))

    // Assert — RHF applies error border class when Zod validation fails
    await waitFor(() => {
      expect(scoreInput).toHaveClass('border-red-500')
    })
  })

  it('should_show_validation_error_when_score_is_below_0', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<ProgressEntryForm {...defaultProps} />)
    const scoreInput = screen.getByLabelText(/score/i)

    // Act — fireEvent.change handles negative numbers reliably for number inputs
    await user.clear(scoreInput)
    fireEvent.change(scoreInput, { target: { valueAsNumber: -5 } })
    await user.click(screen.getByRole('button', { name: /save attempt/i }))

    // Assert
    await waitFor(() => {
      expect(scoreInput).toHaveClass('border-red-500')
    })
  })

  it('should_show_success_message_after_saving', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<ProgressEntryForm {...defaultProps} />)

    // Act
    const scoreInput = screen.getByLabelText(/score/i)
    await user.clear(scoreInput)
    await user.type(scoreInput, '85')
    await user.click(screen.getByRole('button', { name: /save attempt/i }))

    // Assert
    expect(await screen.findByText(/attempt saved/i)).toBeInTheDocument()
  })

  it('should_reset_form_after_successful_submission', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<ProgressEntryForm {...defaultProps} />)

    // Act
    const scoreInput = screen.getByLabelText(/score/i)
    await user.clear(scoreInput)
    await user.type(scoreInput, '90')
    await user.type(screen.getByLabelText(/comment/i), 'Great session!')
    await user.click(screen.getByRole('button', { name: /save attempt/i }))

    // Assert — comment is cleared after reset
    await waitFor(() => {
      expect(screen.getByLabelText(/comment/i)).toHaveValue('')
    })
  })
})
