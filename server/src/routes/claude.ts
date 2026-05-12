import { Router, type Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth.js'

export const claudeRouter = Router()

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required')

const client = new Anthropic({ apiKey })

const MAX_HISTORY_MESSAGES = 6

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

// POST /api/claude/chat — streaming worksheet generation (admin only)
claudeRouter.post('/chat', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { messages, isGenerating } = req.body as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    isGenerating?: boolean
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ message: 'messages array required' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const trimmed = messages.slice(-MAX_HISTORY_MESSAGES)
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: isGenerating ? 2048 : 300,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: trimmed,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ token: event.delta.text })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
    res.end()
  }
})

// POST /api/claude/analyze-image — analyze uploaded worksheet image (authenticated)
claudeRouter.post('/analyze-image', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { base64Image, mediaType } = req.body as {
    base64Image: string
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  }

  if (!base64Image || !mediaType) {
    res.status(400).json({ message: 'base64Image and mediaType required' })
    return
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [{ type: 'text', text: imageAnalysisSystemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
            { type: 'text', text: 'Analyze this math problem image and generate a complete worksheet from it.' },
          ],
        },
      ],
    })

    const text = response.content.find((b) => b.type === 'text')?.text ?? ''
    const match = text.match(/```json\s*([\s\S]*?)```/)
    if (!match) {
      res.status(422).json({ message: 'Claude did not return valid JSON metadata' })
      return
    }

    res.json(JSON.parse(match[1]))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ message: msg })
  }
})

// POST /api/claude/similar-problem — generate a similar problem (authenticated)
claudeRouter.post('/similar-problem', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { worksheetContent, answerContent } = req.body as {
    worksheetContent: string
    answerContent: string
  }

  if (!worksheetContent || !answerContent) {
    res.status(400).json({ message: 'worksheetContent and answerContent required' })
    return
  }

  try {
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

    if (!problemMatch || !answerMatch) {
      res.status(422).json({ message: 'Could not parse generated problem' })
      return
    }

    res.json({ problem: problemMatch[1].trim(), answer: answerMatch[1].trim() })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ message: msg })
  }
})
