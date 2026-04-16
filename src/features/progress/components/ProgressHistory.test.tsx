import { screen } from '@testing-library/react'
import { ProgressHistory } from './ProgressHistory'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { ProgressEntry } from '@/types/progress'

const entries: ProgressEntry[] = [
  {
    id: 'prog-1',
    userId: 'user-1',
    worksheetId: 'ws-1',
    worksheetTitle: 'Counting Objects 1–10',
    date: '2026-04-10',
    score: 80,
    comment: 'Good effort',
  },
  {
    id: 'prog-2',
    userId: 'user-1',
    worksheetId: 'ws-2',
    worksheetTitle: 'Addition within 20',
    date: '2026-04-12',
    score: 95,
    comment: '',
  },
]

describe('ProgressHistory', () => {
  it('should_render_empty_state_when_no_entries', () => {
    // Arrange + Act
    renderWithProviders(<ProgressHistory entries={[]} />)

    // Assert
    expect(screen.getByText(/no attempts logged yet/i)).toBeInTheDocument()
  })

  it('should_render_all_progress_entries', () => {
    // Arrange + Act
    renderWithProviders(<ProgressHistory entries={entries} />)

    // Assert
    expect(screen.getByText('Counting Objects 1–10')).toBeInTheDocument()
    expect(screen.getByText('Addition within 20')).toBeInTheDocument()
  })

  it('should_render_score_as_percentage', () => {
    // Arrange + Act
    renderWithProviders(<ProgressHistory entries={entries} />)

    // Assert
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
  })

  it('should_render_date_for_each_entry', () => {
    // Arrange + Act
    renderWithProviders(<ProgressHistory entries={entries} />)

    // Assert
    expect(screen.getByText('2026-04-10')).toBeInTheDocument()
    expect(screen.getByText('2026-04-12')).toBeInTheDocument()
  })

  it('should_show_dash_when_comment_is_empty', () => {
    // Arrange + Act
    renderWithProviders(<ProgressHistory entries={entries} />)

    // Assert — second entry has empty comment → should display "—"
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('should_render_worksheet_title_as_link_to_detail_page', () => {
    // Arrange + Act
    renderWithProviders(<ProgressHistory entries={entries} />)

    // Assert
    const link = screen.getByRole('link', { name: 'Counting Objects 1–10' })
    expect(link).toHaveAttribute('href', '/worksheets/ws-1')
  })
})
