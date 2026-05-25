import { describe, it, expect } from 'vitest'
import { buildTargetedPrompt, parseTargetedResponse } from './targetedGen.js'

describe('targetedGen', () => {
  it('embeds the requested error categories in the prompt', () => {
    const p = buildTargetedPrompt({ categories: ['regrouping', 'place_value'], level: 'Beginner', schoolGrade: '2' })
    expect(p).toContain('Carry/borrow error')
    expect(p).toContain('Place-value misalignment')
    expect(p).toContain('Beginner')
    expect(p).toContain('grade 2')
  })

  it('parses the generated worksheet payload', () => {
    const raw = '```json\n{"title":"Targeted Practice","categoryId":"cat-3","subcategoryId":"sub-3-1","level":"Beginner","schoolGrade":"2","content":"1. ...","answerContent":"1. ..."}\n```'
    const r = parseTargetedResponse(raw)
    expect(r.success).toBe(true)
  })

  it('fails to parse when JSON is missing', () => {
    expect(parseTargetedResponse('no json').success).toBe(false)
  })
})
