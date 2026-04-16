import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorksheetForm } from './WorksheetForm'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { WorksheetFormInput } from '@/api/worksheets'

const noopSubmit = vi.fn()

beforeEach(() => noopSubmit.mockReset())

describe('WorksheetForm', () => {
  it('should_render_all_required_form_fields', async () => {
    // Arrange + Act
    renderWithProviders(<WorksheetForm onSubmit={noopSubmit} />)

    // Assert — use exact label text to avoid ambiguity (e.g. "Category" vs "Subcategory")
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Subcategory')).toBeInTheDocument()
    expect(screen.getByLabelText('Level')).toBeInTheDocument()
    expect(screen.getByLabelText('Grade (optional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Author')).toBeInTheDocument()
    expect(screen.getByLabelText('Worksheet Content')).toBeInTheDocument()
    expect(screen.getByLabelText('Answer Sheet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save worksheet/i })).toBeInTheDocument()
  })

  it('should_show_validation_errors_when_submitted_empty', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<WorksheetForm onSubmit={noopSubmit} />)

    // Act — wait for categories to load first so select is not disabled, then submit
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Counting & Cardinality' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /save worksheet/i }))

    // Assert — use exact text to avoid "Subcategory required" also matching /category required/i
    expect(await screen.findByText('Title required')).toBeInTheDocument()
    expect(screen.getByText('Category required')).toBeInTheDocument()
  })

  it('should_load_category_options_from_api', async () => {
    // Arrange + Act
    renderWithProviders(<WorksheetForm onSubmit={noopSubmit} />)

    // Assert — categories are fetched and rendered
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Counting & Cardinality' })).toBeInTheDocument()
    })
  })

  it('should_populate_subcategory_options_when_category_is_selected', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<WorksheetForm onSubmit={noopSubmit} />)

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Counting & Cardinality' })).toBeInTheDocument()
    })

    // Act
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-1')

    // Assert — subcategories for cat-1 appear
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /count to tell the number of objects/i }),
      ).toBeInTheDocument()
    })
  })

  it('should_call_onSubmit_with_form_data_when_valid', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<WorksheetForm onSubmit={noopSubmit} />)

    // Wait for categories
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Counting & Cardinality' })).toBeInTheDocument()
    })

    // Act — fill out the form
    await user.type(screen.getByLabelText('Title'), 'Test Worksheet')
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-1')
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /count to tell the number of objects/i }),
      ).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText('Subcategory'), 'sub-1-2')
    await user.selectOptions(screen.getByLabelText('Level'), 'Beginner')
    await user.type(screen.getByLabelText('Worksheet Content'), 'Count these objects.')
    await user.type(screen.getByLabelText('Answer Sheet'), '1. 3')
    await user.click(screen.getByRole('button', { name: /save worksheet/i }))

    // Assert
    await waitFor(() => {
      expect(noopSubmit).toHaveBeenCalledOnce()
    })
    const submitted = noopSubmit.mock.calls[0][0] as WorksheetFormInput
    expect(submitted.title).toBe('Test Worksheet')
    expect(submitted.categoryId).toBe('cat-1')
    expect(submitted.level).toBe('Beginner')
  })

  it('should_disable_submit_button_when_isPending_is_true', () => {
    // Arrange + Act
    renderWithProviders(<WorksheetForm onSubmit={noopSubmit} isPending />)

    // Assert
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('should_prepopulate_fields_when_defaultValues_are_provided', async () => {
    // Arrange
    const defaultValues: Partial<WorksheetFormInput> = {
      title: 'Prepopulated Title',
      author: 'Test Author',
    }

    // Act
    renderWithProviders(<WorksheetForm onSubmit={noopSubmit} defaultValues={defaultValues} />)

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('Prepopulated Title')
      expect(screen.getByLabelText(/author/i)).toHaveValue('Test Author')
    })
  })
})
