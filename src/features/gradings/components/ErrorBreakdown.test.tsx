import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBreakdown } from './ErrorBreakdown'

describe('ErrorBreakdown', () => {
  it('shows positive empty-state when all answers correct', () => {
    render(<ErrorBreakdown problems={[{ problemIndex: 0, problemText: 'x', expectedAnswer: '1', studentAnswer: '1', isCorrect: true }]} />)
    expect(screen.getByText(/no mistakes/i)).toBeInTheDocument()
  })

  it('groups errors by category with counts', () => {
    render(
      <ErrorBreakdown problems={[
        { problemIndex: 0, problemText: 'a', expectedAnswer: '1', studentAnswer: '2', isCorrect: false, errorCategory: 'regrouping', errorExplanation: '.' },
        { problemIndex: 1, problemText: 'b', expectedAnswer: '3', studentAnswer: '5', isCorrect: false, errorCategory: 'regrouping', errorExplanation: '.' },
        { problemIndex: 2, problemText: 'c', expectedAnswer: '7', studentAnswer: '6', isCorrect: false, errorCategory: 'careless', errorExplanation: '.' },
      ]} />,
    )
    expect(screen.getByText(/carry\/borrow/i)).toBeInTheDocument()
    expect(screen.getByText(/2 of 3/i)).toBeInTheDocument()
  })
})
