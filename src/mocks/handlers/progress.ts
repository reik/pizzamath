import { http, HttpResponse } from 'msw'
import { db } from '../db'

export const progressHandlers = [
  http.get('/api/progress', ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    if (!userId) return HttpResponse.json({ message: 'userId required' }, { status: 400 })
    const entries = db.progressEntry.findMany({ where: { userId: { equals: userId } } })
    return HttpResponse.json(entries)
  }),

  http.post('/api/progress', async ({ request }) => {
    const body = await request.json() as {
      userId: string; worksheetId: string; worksheetTitle: string;
      date: string; score: number; comment: string;
    }
    const entry = db.progressEntry.create({ id: `prog-${Date.now()}`, ...body })
    return HttpResponse.json(entry, { status: 201 })
  }),
]
