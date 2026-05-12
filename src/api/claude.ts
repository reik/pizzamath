import { z } from 'zod'
import { getToken } from '@/features/auth/store'
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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function authHeaders(): Record<string, string> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function toFriendlyApiError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('credit balance is too low') || msg.includes('insufficient_quota'))
    return new Error('Anthropic API credits are exhausted. Please top up at console.anthropic.com → Plans & Billing.')
  if (msg.includes('401') || msg.includes('authentication'))
    return new Error('Invalid Anthropic API key. Check ANTHROPIC_API_KEY in server/.env.')
  if (msg.includes('429') || msg.includes('rate_limit'))
    return new Error('Anthropic API rate limit hit. Please wait a moment and try again.')
  return err instanceof Error ? err : new Error(msg)
}

export async function chatWithGenerator(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  isGenerating = false,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/claude/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ messages, isGenerating }),
  })

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message: string }).message)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6)
      if (payload === '[DONE]') continue
      const parsed = JSON.parse(payload) as { token?: string; error?: string }
      if (parsed.error) throw new Error(parsed.error)
      if (parsed.token) {
        fullResponse += parsed.token
        onToken(parsed.token)
      }
    }
  }

  return fullResponse
}

export async function analyzeUploadedImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
): Promise<GeneratedMetadata> {
  let res
  try {
    res = await fetch(`${API_BASE}/api/claude/analyze-image`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ base64Image, mediaType }),
    })
  } catch (err) {
    throw toFriendlyApiError(err)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw toFriendlyApiError(new Error((err as { message: string }).message))
  }

  const parsed = await res.json()
  const result = metadataSchema.safeParse(parsed)
  if (!result.success) throw new Error('Server returned invalid metadata schema')
  return result.data
}

export async function generateSimilarProblem(
  worksheetContent: string,
  answerContent: string,
): Promise<{ problem: string; answer: string }> {
  const res = await fetch(`${API_BASE}/api/claude/similar-problem`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ worksheetContent, answerContent }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message: string }).message)
  }

  return res.json()
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
