import { z } from 'zod'
import type { Category, Worksheet, WorksheetFilters } from '@/types/worksheet'
import { apiFetch } from '@/utils/apiFetch'
import { getToken } from '@/features/auth/store'

export const worksheetFormSchema = z.object({
  title: z.string().min(1, 'Title required'),
  categoryId: z.string().min(1, 'Category required'),
  subcategoryId: z.string().min(1, 'Subcategory required'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  schoolGrade: z.string().nullable(),
  author: z.string().min(1, 'Author required'),
  content: z.string().min(1, 'Content required'),
  answerContent: z.string().min(1, 'Answer content required'),
})

export type WorksheetFormInput = z.infer<typeof worksheetFormSchema>

export const worksheetsApi = {
  getAll: (filters: WorksheetFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.categoryId) params.set('categoryId', filters.categoryId)
    if (filters.subcategoryId) params.set('subcategoryId', filters.subcategoryId)
    if (filters.keyword) params.set('keyword', filters.keyword)
    return apiFetch<Worksheet[]>(`/api/worksheets?${params}`)
  },
  getById: (id: string) => apiFetch<Worksheet>(`/api/worksheets/${id}`),
  create: (data: WorksheetFormInput) =>
    apiFetch<Worksheet>('/api/worksheets', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/worksheets/${id}`, { method: 'DELETE' }),
  export: (id: string, format: 'pdf' | 'doc') => {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`/api/worksheets/${id}/export?format=${format}`, { headers }).then((r) => r.blob())
  },
}

export const categoriesApi = {
  getAll: () => apiFetch<Category[]>('/api/categories'),
}
