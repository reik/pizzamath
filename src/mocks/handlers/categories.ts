import { http, HttpResponse } from 'msw'
import { db } from '../db'

export const categoryHandlers = [
  http.get('/api/categories', () => {
    const categories = db.category.getAll()
    const subcategories = db.subcategory.getAll()

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      grades: cat.grades,
      subcategories: subcategories
        .filter((sub) => sub.categoryId === cat.id)
        .map((sub) => ({ id: sub.id, name: sub.name, categoryId: sub.categoryId })),
    }))

    return HttpResponse.json(result)
  }),
]
