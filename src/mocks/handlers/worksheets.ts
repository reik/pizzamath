import { http, HttpResponse } from 'msw'
import { db } from '../db'

export const worksheetHandlers = [
  http.get('/api/worksheets', ({ request }) => {
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('categoryId')
    const subcategoryId = url.searchParams.get('subcategoryId')
    const keyword = url.searchParams.get('keyword')?.toLowerCase()

    let worksheets = db.worksheet.getAll()

    if (categoryId) {
      worksheets = worksheets.filter((w) => w.categoryId === categoryId)
    }
    if (subcategoryId) {
      worksheets = worksheets.filter((w) => w.subcategoryId === subcategoryId)
    }
    if (keyword) {
      const tokens = keyword.split(/[\s,]+/).filter(Boolean)
      worksheets = worksheets.filter((w) =>
        tokens.every(
          (token) =>
            w.title.toLowerCase().includes(token) ||
            w.content.toLowerCase().includes(token),
        ),
      )
    }

    return HttpResponse.json(worksheets.map(toDto))
  }),

  http.get('/api/worksheets/:id', ({ params }) => {
    const worksheet = db.worksheet.findFirst({ where: { id: { equals: params.id as string } } })
    if (!worksheet) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(toDto(worksheet))
  }),

  http.post('/api/worksheets', async ({ request }) => {
    const body = await request.json() as {
      title: string; categoryId: string; subcategoryId: string;
      level: string; schoolGrade: string | null; author: string;
      content: string; answerContent: string;
    }
    const worksheet = db.worksheet.create({
      id: `ws-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    })
    return HttpResponse.json(toDto(worksheet), { status: 201 })
  }),

  http.delete('/api/worksheets/:id', ({ params }) => {
    const existing = db.worksheet.findFirst({ where: { id: { equals: params.id as string } } })
    if (!existing) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    db.worksheet.delete({ where: { id: { equals: params.id as string } } })
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/worksheets/:id/export', ({ params, request }) => {
    const worksheet = db.worksheet.findFirst({ where: { id: { equals: params.id as string } } })
    if (!worksheet) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    const url = new URL(request.url)
    const format = url.searchParams.get('format') ?? 'pdf'
    const content = `${worksheet.title}\n\n${worksheet.content}`
    const blob = new Blob([content], { type: format === 'pdf' ? 'application/pdf' : 'application/msword' })
    return new HttpResponse(blob, {
      headers: { 'Content-Disposition': `attachment; filename="${worksheet.title}.${format}"` },
    })
  }),
]

function toDto(w: ReturnType<typeof db.worksheet.findFirst>) {
  if (!w) return null
  return {
    id: w.id,
    title: w.title,
    categoryId: w.categoryId,
    subcategoryId: w.subcategoryId,
    level: w.level,
    schoolGrade: w.schoolGrade,
    author: w.author,
    content: w.content,
    answerSheet: { id: `ans-${w.id}`, worksheetId: w.id, content: w.answerContent },
    createdAt: w.createdAt,
  }
}
