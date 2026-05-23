import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InsightsChart } from './InsightsChart'

describe('InsightsChart', () => {
  it('renders categories with proportional bars and counts', () => {
    render(
      <InsightsChart
        data={[
          { category: 'regrouping', count: 8 },
          { category: 'careless', count: 2 },
        ]}
      />,
    )
    expect(screen.getByText(/carry\/borrow/i)).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<InsightsChart data={[]} />)
    expect(screen.getByText(/no recurring/i)).toBeInTheDocument()
  })
})
