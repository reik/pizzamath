import { screen } from '@testing-library/react'
import { WorksheetCard } from './WorksheetCard'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { Worksheet } from '@/types/worksheet'

const worksheet: Worksheet = {
  id: 'ws-test-1',
  title: 'Counting Objects 1–10',
  categoryId: 'cat-1',
  subcategoryId: 'sub-1-2',
  level: 'Beginner',
  schoolGrade: 'K',
  author: 'PizzaMath',
  content: 'Count the objects.',
  answerSheet: { id: 'ans-ws-test-1', worksheetId: 'ws-test-1', content: '1. 3' },
  createdAt: '2026-01-01T00:00:00Z',
}

describe('WorksheetCard', () => {
  it('should_render_worksheet_title', () => {
    // Arrange + Act
    renderWithProviders(<WorksheetCard worksheet={worksheet} />)

    // Assert
    expect(screen.getByText('Counting Objects 1–10')).toBeInTheDocument()
  })

  it('should_render_level_badge', () => {
    // Arrange + Act
    renderWithProviders(<WorksheetCard worksheet={worksheet} />)

    // Assert
    expect(screen.getByText('Beginner')).toBeInTheDocument()
  })

  it('should_render_category_name_when_provided', () => {
    // Arrange + Act
    renderWithProviders(
      <WorksheetCard worksheet={worksheet} categoryName="Counting & Cardinality" />,
    )

    // Assert
    expect(screen.getByText('Counting & Cardinality')).toBeInTheDocument()
  })

  it('should_not_render_category_when_omitted', () => {
    // Arrange + Act
    renderWithProviders(<WorksheetCard worksheet={worksheet} />)

    // Assert
    expect(screen.queryByText('Counting & Cardinality')).not.toBeInTheDocument()
  })

  it('should_render_grade_when_provided', () => {
    // Arrange + Act
    renderWithProviders(<WorksheetCard worksheet={worksheet} />)

    // Assert
    expect(screen.getByText(/grade k/i)).toBeInTheDocument()
  })

  it('should_render_author_name', () => {
    // Arrange + Act
    renderWithProviders(<WorksheetCard worksheet={worksheet} />)

    // Assert
    expect(screen.getByText(/by PizzaMath/i)).toBeInTheDocument()
  })

  it('should_link_to_worksheet_detail_page', () => {
    // Arrange + Act
    renderWithProviders(<WorksheetCard worksheet={worksheet} />)

    // Assert
    expect(screen.getByRole('link')).toHaveAttribute('href', '/worksheets/ws-test-1')
  })

  it('should_not_render_grade_when_null', () => {
    // Arrange
    const noGradeWorksheet: Worksheet = { ...worksheet, schoolGrade: null }

    // Act
    renderWithProviders(<WorksheetCard worksheet={noGradeWorksheet} />)

    // Assert
    expect(screen.queryByText(/grade/i)).not.toBeInTheDocument()
  })
})
