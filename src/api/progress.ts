import { z } from 'zod'
import type { ProgressEntry } from '@/types/progress'
import { apiFetch } from '@/utils/apiFetch'

export const progressSchema = z.object({
  date: z.string().min(1, 'Date required'),
  score: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100'),
  comment: z.string(),
})

export type ProgressInput = z.infer<typeof progressSchema>

export const progressApi = {
  getAll: (userId: string) => apiFetch<ProgressEntry[]>(`/api/progress?userId=${userId}`),
  create: (entry: Omit<ProgressEntry, 'id'>) =>
    apiFetch<ProgressEntry>('/api/progress', { method: 'POST', body: JSON.stringify(entry) }),
}
