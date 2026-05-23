import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { ERROR_CATEGORIES, type ErrorCategoryId } from '../errorTaxonomy.js'

const generatedSchema = z.object({
  title: z.string().min(1),
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  schoolGrade: z.string().nullable(),
  content: z.string().min(1),
  answerContent: z.string().min(1),
})
export type GeneratedWorksheet = z.infer<typeof generatedSchema>

interface Args {
  categories: ErrorCategoryId[]
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  schoolGrade: string | null
}

export function buildTargetedPrompt({ categories, level, schoolGrade }: Args): string {
  const lines = categories.map((id) => {
    const c = ERROR_CATEGORIES.find((x) => x.id === id)
    return `- ${c?.label ?? id}`
  }).join('\n')
  const gradeLine = schoolGrade ? `Aim for grade ${schoolGrade}.` : 'Grade-agnostic.'

  return `You are a math worksheet generator for PizzaMath.

A student just made mistakes in these sub-skills:
${lines}

Generate a 10-problem TARGETED PRACTICE worksheet at level "${level}". ${gradeLine}

Structure:
- 2 warm-up problems easier than the missed skill
- 6 problems drilling the missed sub-skills directly
- 2 challenge problems slightly harder

Formatting: LaTeX for math ($\\frac{a}{b}$, $x^2$), markdown numbered list, blank line between problems.

Respond ONLY with this JSON block at the end:
\`\`\`json
{
  "title": "Targeted practice — <topic>",
  "categoryId": "cat-X",
  "subcategoryId": "sub-X-Y",
  "level": "${level}",
  "schoolGrade": ${schoolGrade ? `"${schoolGrade}"` : 'null'},
  "content": "<markdown worksheet>",
  "answerContent": "<full answer key>"
}
\`\`\``
}

export type ParseResult =
  | { success: true; data: GeneratedWorksheet }
  | { success: false; reason: string }

export function parseTargetedResponse(raw: string): ParseResult {
  const match = raw.match(/```json\s*([\s\S]*?)```/)
  if (!match) return { success: false, reason: 'no_json_block' }
  let parsed: unknown
  try { parsed = JSON.parse(match[1]) } catch { return { success: false, reason: 'invalid_json' } }
  const validated = generatedSchema.safeParse(parsed)
  if (!validated.success) return { success: false, reason: 'schema_mismatch' }
  return { success: true, data: validated.data }
}

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (client) return client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY required')
  client = new Anthropic({ apiKey })
  return client
}

export async function generateTargetedPractice(args: Args): Promise<ParseResult> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3072,
    system: [{ type: 'text', text: buildTargetedPrompt(args), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: 'Generate the targeted practice worksheet now.' }],
  })
  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  return parseTargetedResponse(text)
}
