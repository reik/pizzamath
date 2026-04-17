import { Router } from 'express'
import { db } from '../db.js'

export const categoriesRouter = Router()

categoriesRouter.get('/', (_req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY id').all() as Array<{ id: string; name: string; grades: string }>
  const subcategories = db.prepare('SELECT * FROM subcategories ORDER BY id').all() as Array<{ id: string; name: string; category_id: string }>

  const result = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    grades: cat.grades,
    subcategories: subcategories
      .filter((s) => s.category_id === cat.id)
      .map((s) => ({ id: s.id, name: s.name, categoryId: s.category_id })),
  }))

  res.json(result)
})
