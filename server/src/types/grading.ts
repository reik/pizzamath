import { z } from 'zod'
import { ERROR_CATEGORIES } from '../errorTaxonomy.js'

const errorCategoryIds = ERROR_CATEGORIES.map((c) => c.id) as [string, ...string[]]

export const gradedProblemSchema = z.object({
  problemIndex: z.number().int().nonnegative(),
  problemText: z.string().min(1),
  expectedAnswer: z.string().min(1),
  studentAnswer: z.string(),
  isCorrect: z.boolean(),
  errorCategory: z.enum(errorCategoryIds).optional(),
  errorExplanation: z.string().optional(),
})

export const gradingResponseSchema = z.object({
  score: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  problems: z.array(gradedProblemSchema).min(1),
})

export type GradedProblem = z.infer<typeof gradedProblemSchema>
export type GradingResponse = z.infer<typeof gradingResponseSchema>
