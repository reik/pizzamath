import { describe, it, expect } from 'vitest'
import { db } from './db.js'

describe('db schema', () => {
  it('has worksheet_gradings table with required columns', () => {
    const cols = db.prepare(`PRAGMA table_info(worksheet_gradings)`).all() as { name: string }[]
    const names = cols.map((c) => c.name)
    expect(names).toEqual(
      expect.arrayContaining(['id', 'user_id', 'upload_id', 'score', 'total', 'created_at']),
    )
  })

  it('has grading_problems table with required columns', () => {
    const cols = db.prepare(`PRAGMA table_info(grading_problems)`).all() as { name: string }[]
    const names = cols.map((c) => c.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'id', 'grading_id', 'problem_index', 'problem_text',
        'expected_answer', 'student_answer', 'is_correct',
        'error_category', 'error_explanation',
      ]),
    )
  })
})
