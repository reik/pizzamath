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

const imageAnalysisSystemPrompt = `You are a math education expert for PizzaMath, aligned to California Common Core Standards (K–12).

Analyze the uploaded image of a math problem or worksheet and recreate it as faithfully as possible.

FORMATTING RULES — follow these exactly:

1. MATH NOTATION: Use LaTeX for ALL mathematical expressions.
   - Inline math: $expression$ — e.g. $\\frac{3}{4}$, $x^2 + 2x - 1$, $\\sqrt{16}$
   - Display math (standalone equations): $$expression$$ on its own line
   - Fractions MUST use \\frac{numerator}{denominator} — never use "/" for fractions in problem text
   - Mixed numbers: $2\\frac{1}{3}$ → use $2\\frac{1}{3}$
   - Exponents: $x^{2}$, subscripts: $x_{1}$

2. GRAPHS & COORDINATE PLANES: When the image contains a graph, coordinate plane, or asks the student to plot/graph something, include a fenced code block with language "graph" using this JSON schema:
\`\`\`graph
{
  "functions": ["x^2 - 4", "2*x + 1"],
  "xDomain": [-6, 6],
  "yDomain": [-8, 8],
  "points": [{"x": 2, "y": 0, "label": "A"}],
  "asymptotes": []
}
\`\`\`
   - "functions": array of JS-evaluable math expressions using variable x (use Math.* for trig/log if needed)
   - "xDomain" / "yDomain": visible axis range as [min, max]
   - "points": labeled points to highlight (optional)
   - Omit keys that are not applicable

3. TABLES: Use markdown table syntax.

4. STRUCTURE: Use markdown headings, numbered lists for problems, and blank lines between problems.

Respond ONLY with this JSON block:
\`\`\`json
{
  "categoryId": "<id from CA CC categories>",
  "subcategoryId": "<subcategory id>",
  "level": "Beginner" | "Intermediate" | "Advanced",
  "schoolGrade": "<K-12 or null>",
  "title": "<descriptive worksheet title>",
  "content": "<full worksheet markdown with LaTeX math and graph blocks>",
  "answerContent": "<complete answer key also using LaTeX notation>"
}
\`\`\`

CA Common Core category IDs: cat-1 (Counting & Cardinality, K), cat-2 (Operations & Algebraic Thinking, K-5), cat-3 (Number & Operations in Base Ten, K-5), cat-4 (Number & Operations — Fractions, 3-5), cat-5 (Measurement & Data, K-5), cat-6 (Geometry, K-12), cat-7 (Ratios & Proportional Relationships, 6-7), cat-8 (The Number System, 6-8), cat-9 (Expressions & Equations, 6-8), cat-10 (Functions, 8-12), cat-11 (Statistics & Probability, 6-12), cat-12 (Number & Quantity, 9-12), cat-13 (Algebra, 9-12), cat-14 (Modeling, 9-12).

Subcategory IDs follow the pattern sub-{catNum}-{subNum} (e.g. sub-2-1 for first subcategory of cat-2). Pick the closest match.`

function toFriendlyApiError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('credit balance is too low') || msg.includes('insufficient_quota'))
    return new Error('Anthropic API credits are exhausted. Please top up at console.anthropic.com → Plans & Billing.')
  if (msg.includes('401') || msg.includes('authentication'))
    return new Error('Invalid Anthropic API key. Check VITE_ANTHROPIC_API_KEY in your .env file.')
  if (msg.includes('429') || msg.includes('rate_limit'))
    return new Error('Anthropic API rate limit hit. Please wait a moment and try again.')
  return err instanceof Error ? err : new Error(msg)
}

export async function analyzeUploadedImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
): Promise<GeneratedMetadata> {
  let response
  try {
    response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [{ type: 'text', text: imageAnalysisSystemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          {
            type: 'text',
            text: 'Analyze this math problem image and generate a complete worksheet from it.',
          },
        ],
      },
    ],
  })
  } catch (err) {
    throw toFriendlyApiError(err)
  }

  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  const match = text.match(/```json\s*([\s\S]*?)```/)
  if (!match) throw new Error('Claude did not return valid JSON metadata')

  const parsed = JSON.parse(match[1])
  const result = metadataSchema.safeParse(parsed)
  if (!result.success) throw new Error('Claude returned invalid metadata schema')
  return result.data
}

const similarProblemSystemPrompt = `You are a math worksheet assistant for PizzaMath, aligned to California Common Core Standards (K–12).

The user will provide an existing worksheet. Generate ONE new similar problem that:
- Matches the same topic, difficulty level, and style
- Uses different numbers, values, or scenario
- Follows the exact same formatting as the existing problems

FORMATTING RULES:
- Use LaTeX for all math: inline $expression$, display $$expression$$
- Fractions: \\frac{numerator}{denominator}
- For graphs, use a fenced \`\`\`graph JSON block\`\`\` (same schema as existing worksheet)
- Number the new problem continuing from where the worksheet left off

Respond ONLY with two clearly separated sections:

PROBLEM:
<the new problem in markdown + LaTeX>

ANSWER:
<the answer in markdown + LaTeX>`

export async function generateSimilarProblem(
  worksheetContent: string,
  answerContent: string,
): Promise<{ problem: string; answer: string }> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [{ type: 'text', text: similarProblemSystemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: `Here is the existing worksheet:\n\n${worksheetContent}\n\nExisting answers:\n\n${answerContent}\n\nGenerate one similar problem.`,
      },
    ],
  })

  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  const problemMatch = text.match(/PROBLEM:\s*([\s\S]*?)(?=ANSWER:|$)/)
  const answerMatch = text.match(/ANSWER:\s*([\s\S]*)$/)

  if (!problemMatch || !answerMatch) throw new Error('Could not parse generated problem')

  return {
    problem: problemMatch[1].trim(),
    answer: answerMatch[1].trim(),
  }
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
