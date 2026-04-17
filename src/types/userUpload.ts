import type { Level, SchoolGrade } from './worksheet'

export interface UserUpload {
  id: string
  userId: string
  title: string
  categoryId: string
  subcategoryId: string
  level: Level
  schoolGrade: SchoolGrade | null
  content: string
  answerSheet: { id: string; content: string }
  originalImageDataUrl: string
  createdAt: string
}
