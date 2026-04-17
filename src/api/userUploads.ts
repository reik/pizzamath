import { z } from 'zod'
import { apiFetch } from '@/utils/apiFetch'
import type { UserUpload } from '@/types/userUpload'

export const createUploadSchema = z.object({
  title: z.string().min(1),
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  schoolGrade: z.string().nullable(),
  content: z.string().min(1),
  answerContent: z.string().min(1),
  originalImageDataUrl: z.string().min(1),
})

export type CreateUploadInput = z.infer<typeof createUploadSchema>

export const userUploadsApi = {
  getAll: (userId: string) =>
    apiFetch<UserUpload[]>(`/api/user-uploads?userId=${userId}`),

  getById: (id: string) =>
    apiFetch<UserUpload>(`/api/user-uploads/${id}`),

  create: (userId: string, data: CreateUploadInput) =>
    apiFetch<UserUpload>('/api/user-uploads', {
      method: 'POST',
      body: JSON.stringify({ userId, ...data }),
    }),

  update: (id: string, data: { content?: string; answerContent?: string }) =>
    apiFetch<UserUpload>(`/api/user-uploads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/user-uploads/${id}`, { method: 'DELETE' }),
}
