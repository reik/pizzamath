import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '@/mocks/server'
import { useCreateGrading } from './useCreateGrading'

beforeEach(() => {
  server.use(
    http.post('/api/gradings', async ({ request }) => {
      const body = (await request.json()) as { uploadId: string }
      return HttpResponse.json({
        id: 'g-new', uploadId: body.uploadId, score: 1, total: 1, createdAt: '2026-05-18T00:00:00.000Z',
        problems: [{ problemIndex: 0, problemText: 'x', expectedAnswer: '1', studentAnswer: '1', isCorrect: true }],
      }, { status: 201 })
    }),
  )
})

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useCreateGrading', () => {
  it('returns the created grading on success', async () => {
    const { result } = renderHook(() => useCreateGrading(), { wrapper })
    result.current.mutate('u1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe('g-new')
  })
})
