import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { WorksheetFormInput } from './worksheets'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const metadataSchema = z.object({
  categoryId: z.string(),
  subcategoryId: z.string(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  schoolGrade: z.string().nullable(),
  title: z.string(),
  content: z.string(),
  answerContent: z.string(),
})

export type GeneratedMetadata = z.infer<typeof metadataSchema>

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const MAX_HISTORY_MESSAGES = 6  // keep last 3 exchanges to cap input tokens

const systemPrompt = `You are a math worksheet generator for PizzaMath, aligned to California Common Core Standards (K–12).

When the user describes a worksheet they want, help them refine it through conversation. Ask clarifying questions about:
- Grade level or difficulty
- Specific topic or subtopic
- Number of questions
- Format preferences

Once the user is satisfied and clicks Generate, respond with a JSON block at the END of your message in this exact format:
\`\`\`json
{
  "categoryId": "<id from CA CC categories>",
  "subcategoryId": "<subcategory id>",
  "level": "Beginner" | "Intermediate" | "Advanced",
  "schoolGrade": "<K-12 or null>",
  "title": "<worksheet title>",
  "content": "<full worksheet content with questions>",
  "answerContent": "<answer key>"
}
\`\`\`

CA Common Core category IDs: cat-1 (Counting & Cardinality, K), cat-2 (Operations & Algebraic Thinking, K-5), cat-3 (Number & Operations in Base Ten, K-5), cat-4 (Number & Operations - Fractions, 3-5), cat-5 (Measurement & Data, K-5), cat-6 (Geometry, K-12), cat-7 (Ratios & Proportional Relationships, 6-7), cat-8 (The Number System, 6-8), cat-9 (Expressions & Equations, 6-8), cat-10 (Functions, 8-12), cat-11 (Statistics & Probability, 6-12), cat-12 (Number & Quantity, 9-12), cat-13 (Algebra, 9-12), cat-14 (Modeling, 9-12).`

export async function chatWithGenerator(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  isGenerating = false,
): Promise<string> {
  const trimmedMessages = messages.slice(-MAX_HISTORY_MESSAGES)

  let fullResponse = ''

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    // Chat turns need few tokens; Generate turn needs room for full worksheet
    max_tokens: isGenerating ? 2048 : 300,
    // Cached system prompt — ~90% cheaper on subsequent turns within 5 min
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: trimmedMessages.map((m) => ({ role: m.role, content: m.content })),
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullResponse += event.delta.text
      onToken(event.delta.text)
    }
  }

  return fullResponse
}

export function parseGeneratedMetadata(response: string): Partial<WorksheetFormInput> | null {
  const match = response.match(/```json\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    const result = metadataSchema.safeParse(parsed)
    if (!result.success) return null
    return result.data
  } catch {
    return null
  }
}
