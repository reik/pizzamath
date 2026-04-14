export type Level = 'Beginner' | 'Intermediate' | 'Advanced'

export type SchoolGrade =
  | 'K' | '1' | '2' | '3' | '4' | '5' | '6'
  | '7' | '8' | '9' | '10' | '11' | '12'

export interface Subcategory {
  id: string
  name: string
  categoryId: string
}

export interface Category {
  id: string
  name: string
  grades: string
  subcategories: Subcategory[]
}

export interface AnswerSheet {
  id: string
  worksheetId: string
  content: string
}

export interface Worksheet {
  id: string
  title: string
  categoryId: string
  subcategoryId: string
  level: Level
  schoolGrade: SchoolGrade | null
  author: string
  content: string
  answerSheet: AnswerSheet
  createdAt: string
}

export interface WorksheetFilters {
  categoryId?: string
  subcategoryId?: string
  keyword?: string
}
