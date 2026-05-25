import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GradingResult } from './GradingResult'

describe('GradingResult', () => {
  it('renders correct problem without an error block', () => {
    render(<GradingResult problem={{ problemIndex: 0, problemText: '2+2', expectedAnswer: '4', studentAnswer: '4', isCorrect: true }} />)
    expect(screen.getByText('2+2')).toBeInTheDocument()
    expect(screen.queryByText(/expected:/i)).not.toBeInTheDocument()
  })

  it('renders incorrect problem with expected answer, category label, and explanation', () => {
    render(<GradingResult problem={{ problemIndex: 1, problemText: '3+5', expectedAnswer: '8', studentAnswer: '7', isCorrect: false, errorCategory: 'careless', errorExplanation: 'off by one' }} />)
    expect(screen.getByText(/3\+5/)).toBeInTheDocument()
    expect(screen.getByText(/expected:/i)).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText(/off by one/i)).toBeInTheDocument()
    expect(screen.getByText(/careless/i)).toBeInTheDocument()
  })
})
