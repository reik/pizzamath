import { z } from 'zod'
import { ERROR_CATEGORIES } from '@/types/errorTaxonomy'
import { apiFetch } from '@/utils/apiFetch'

const errorCategoryIds = ERROR_CATEGORIES.map((c) => c.id) as [string, ...string[]]

export const gradedProblemSchema = z.object({
  problemIndex: z.number().int().nonnegative(),
  problemText: z.string(),
  expectedAnswer: z.string(),
  studentAnswer: z.string(),
  isCorrect: z.boolean(),
  errorCategory: z.enum(errorCategoryIds).optional(),
  errorExplanation: z.string().optional(),
})

export const gradingSchema = z.object({
  id: z.string(),
  uploadId: z.string(),
  score: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  createdAt: z.string(),
  problems: z.array(gradedProblemSchema),
})

export const generatedWorksheetSchema = z.object({
  id: z.string(),
  title: z.string(),
  categoryId: z.string(),
  subcategoryId: z.string(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  schoolGrade: z.string().nullable(),
  content: z.string(),
  answerContent: z.string(),
  createdAt: z.string(),
})

export const insightsSchema = z.object({
  totalGradings: z.number().int().nonnegative(),
  byCategory: z.array(z.object({ category: z.string(), count: z.number().int().nonnegative() })),
  recent: z.array(z.object({ id: z.string(), score: z.number(), total: z.number(), createdAt: z.string() })),
})

export type Grading = z.infer<typeof gradingSchema>
export type GradedProblem = z.infer<typeof gradedProblemSchema>
export type GeneratedWorksheet = z.infer<typeof generatedWorksheetSchema>
export type Insights = z.infer<typeof insightsSchema>

export const gradingsApi = {
  create: async (uploadId: string): Promise<Grading> => {
    const data = await apiFetch('/api/gradings', { method: 'POST', body: JSON.stringify({ uploadId }) })
    return gradingSchema.parse(data)
  },
  get: async (id: string): Promise<Grading> => {
    const data = await apiFetch(`/api/gradings/${id}`)
    return gradingSchema.parse(data)
  },
  generatePractice: async (gradingId: string): Promise<GeneratedWorksheet> => {
    const data = await apiFetch(`/api/gradings/${gradingId}/generate-practice`, { method: 'POST' })
    return generatedWorksheetSchema.parse(data)
  },
  insights: async (): Promise<Insights> => {
    const data = await apiFetch('/api/gradings/insights/me')
    return insightsSchema.parse(data)
  },
}
