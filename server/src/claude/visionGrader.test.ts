import { describe, it, expect } from 'vitest'
import { parseGradingResponse, buildGradingPrompt } from './visionGrader.js'

describe('visionGrader', () => {
  it('parses a Claude response with a single fenced JSON block', () => {
    const raw = 'I analyzed the worksheet.\n\n```json\n{"score":1,"total":2,"problems":[{"problemIndex":0,"problemText":"2+2","expectedAnswer":"4","studentAnswer":"4","isCorrect":true},{"problemIndex":1,"problemText":"3+5","expectedAnswer":"8","studentAnswer":"7","isCorrect":false,"errorCategory":"careless","errorExplanation":"off by one"}]}\n```'
    const result = parseGradingResponse(raw)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.score).toBe(1)
      expect(result.data.problems).toHaveLength(2)
    }
  })

  it('returns failure when no JSON block is present', () => {
    expect(parseGradingResponse('no json here').success).toBe(false)
  })

  it('returns failure when the JSON shape is wrong', () => {
    expect(parseGradingResponse('```json\n{"score":1}\n```').success).toBe(false)
  })

  it('embeds the full error taxonomy in the system prompt', () => {
    const prompt = buildGradingPrompt()
    expect(prompt).toContain('arithmetic_fact')
    expect(prompt).toContain('regrouping')
    expect(prompt).toContain('careless')
  })
})
