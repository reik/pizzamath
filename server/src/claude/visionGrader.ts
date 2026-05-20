import Anthropic from '@anthropic-ai/sdk'
import { ERROR_CATEGORIES } from '../errorTaxonomy.js'
import { gradingResponseSchema, type GradingResponse } from '../types/grading.js'

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (client) return client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY required')
  client = new Anthropic({ apiKey })
  return client
}

export function buildGradingPrompt(): string {
  const categoryLines = ERROR_CATEGORIES.map((c) => `- ${c.id}: ${c.label}`).join('\n')
  return `You are a math worksheet grader for PizzaMath. The image contains a completed math worksheet (printed problems with handwritten student answers).

For EACH problem visible in the image:
1. Read the printed problem (use LaTeX in problemText: $\\frac{1}{2}$, $x^2$, etc.)
2. Compute the correct answer (expectedAnswer)
3. Read the student's handwritten answer (studentAnswer) — if illegible or blank, use "" and mark isCorrect=false with errorCategory="careless"
4. Decide isCorrect
5. If incorrect, pick exactly ONE errorCategory from this list:
${categoryLines}
6. Write a one-sentence errorExplanation in plain English a parent can understand.

Respond ONLY with this JSON block at the END of your message:
\`\`\`json
{
  "score": <number of correct problems>,
  "total": <total number of problems>,
  "problems": [
    {
      "problemIndex": 0,
      "problemText": "...",
      "expectedAnswer": "...",
      "studentAnswer": "...",
      "isCorrect": true | false,
      "errorCategory": "<one id from the list, only if incorrect>",
      "errorExplanation": "<one sentence, only if incorrect>"
    }
  ]
}
\`\`\``
}

export type ParseResult =
  | { success: true; data: GradingResponse }
  | { success: false; reason: string }

export function parseGradingResponse(raw: string): ParseResult {
  const match = raw.match(/```json\s*([\s\S]*?)```/)
  if (!match) return { success: false, reason: 'no_json_block' }
  let parsed: unknown
  try { parsed = JSON.parse(match[1]) } catch { return { success: false, reason: 'invalid_json' } }
  const validated = gradingResponseSchema.safeParse(parsed)
  if (!validated.success) return { success: false, reason: 'schema_mismatch' }
  return { success: true, data: validated.data }
}

export async function gradeWithVision(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
): Promise<ParseResult> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3072,
    system: [{ type: 'text', text: buildGradingPrompt(), cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
        { type: 'text', text: 'Grade this worksheet.' },
      ],
    }],
  })
  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  return parseGradingResponse(text)
}
