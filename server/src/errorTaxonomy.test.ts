import { describe, it, expect } from 'vitest'
import { ERROR_CATEGORIES, isErrorCategoryId } from './errorTaxonomy.js'

describe('errorTaxonomy', () => {
  it('exposes 13 fixed categories with unique ids', () => {
    const ids = ERROR_CATEGORIES.map((c) => c.id)
    expect(ids).toHaveLength(13)
    expect(new Set(ids).size).toBe(13)
  })

  it('isErrorCategoryId guards unknown values', () => {
    expect(isErrorCategoryId('regrouping')).toBe(true)
    expect(isErrorCategoryId('not_a_real_one')).toBe(false)
  })
})
