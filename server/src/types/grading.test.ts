import { describe, it, expect } from 'vitest'
import { gradedProblemSchema, gradingResponseSchema } from './grading.js'

describe('grading schemas', () => {
  it('accepts a well-formed graded problem', () => {
    const result = gradedProblemSchema.safeParse({
      problemIndex: 0,
      problemText: '7 × 8 = ?',
      expectedAnswer: '56',
      studentAnswer: '54',
      isCorrect: false,
      errorCategory: 'arithmetic_fact',
      errorExplanation: 'Recall error: 7×8 is 56, not 54.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown error category', () => {
    const result = gradedProblemSchema.safeParse({
      problemIndex: 0, problemText: 'x', expectedAnswer: '1', studentAnswer: '2',
      isCorrect: false, errorCategory: 'made_up', errorExplanation: 'x',
    })
    expect(result.success).toBe(false)
  })

  it('allows correct answers to omit error fields', () => {
    const result = gradedProblemSchema.safeParse({
      problemIndex: 1, problemText: '2+2', expectedAnswer: '4', studentAnswer: '4', isCorrect: true,
    })
    expect(result.success).toBe(true)
  })

  it('parses a top-level grading response', () => {
    const result = gradingResponseSchema.safeParse({
      score: 1, total: 2,
      problems: [
        { problemIndex: 0, problemText: 'a', expectedAnswer: '1', studentAnswer: '1', isCorrect: true },
        { problemIndex: 1, problemText: 'b', expectedAnswer: '2', studentAnswer: '3', isCorrect: false, errorCategory: 'careless', errorExplanation: '.' },
      ],
    })
    expect(result.success).toBe(true)
  })
})
