import { describe, it, expect } from 'vitest'
import { gradingSchema } from './gradings'

describe('gradingSchema', () => {
  it('parses a server response', () => {
    const res = gradingSchema.safeParse({
      id: 'g1', uploadId: 'u1', score: 1, total: 2, createdAt: '2026-05-18T00:00:00.000Z',
      problems: [
        { problemIndex: 0, problemText: 'a', expectedAnswer: '1', studentAnswer: '1', isCorrect: true },
        { problemIndex: 1, problemText: 'b', expectedAnswer: '2', studentAnswer: '3', isCorrect: false, errorCategory: 'careless', errorExplanation: '.' },
      ],
    })
    expect(res.success).toBe(true)
  })

  it('rejects unknown error category', () => {
    const res = gradingSchema.safeParse({
      id: 'g1', uploadId: 'u1', score: 0, total: 1, createdAt: '2026-05-18T00:00:00.000Z',
      problems: [{ problemIndex: 0, problemText: 'a', expectedAnswer: '1', studentAnswer: '2', isCorrect: false, errorCategory: 'bogus', errorExplanation: '.' }],
    })
    expect(res.success).toBe(false)
  })
})
