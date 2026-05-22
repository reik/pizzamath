import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { GradingPage } from './GradingPage'

beforeEach(() => {
  server.use(
    http.get('/api/gradings/g1', () => HttpResponse.json({
      id: 'g1', uploadId: 'u1', score: 1, total: 2, createdAt: '2026-05-18T00:00:00.000Z',
      problems: [
        { problemIndex: 0, problemText: '2+2', expectedAnswer: '4', studentAnswer: '4', isCorrect: true },
        { problemIndex: 1, problemText: '3+5', expectedAnswer: '8', studentAnswer: '7', isCorrect: false, errorCategory: 'careless', errorExplanation: 'off by one' },
      ],
    })),
  )
})

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/gradings/:id" element={<GradingPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('GradingPage', () => {
  it('shows score and at least one error explanation', async () => {
    renderAt('/gradings/g1')
    expect(await screen.findByText(/1\s*\/\s*2/)).toBeInTheDocument()
    expect(await screen.findByText(/off by one/i)).toBeInTheDocument()
  })
})
