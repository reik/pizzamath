import { http, HttpResponse } from 'msw'
import { db } from '../db'

export const userUploadHandlers = [
  http.get('/api/user-uploads', ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    if (!userId) return HttpResponse.json({ message: 'userId required' }, { status: 400 })

    const uploads = db.userUpload.findMany({ where: { userId: { equals: userId } } })
    return HttpResponse.json(uploads.map(toDto))
  }),

  http.get('/api/user-uploads/:id', ({ params }) => {
    const upload = db.userUpload.findFirst({ where: { id: { equals: params.id as string } } })
    if (!upload) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(toDto(upload))
  }),

  http.post('/api/user-uploads', async ({ request }) => {
    const body = await request.json() as {
      userId: string; title: string; categoryId: string; subcategoryId: string;
      level: string; schoolGrade: string | null; content: string;
      answerContent: string; originalImageDataUrl: string;
    }
    const upload = db.userUpload.create({
      id: `upload-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    })
    return HttpResponse.json(toDto(upload), { status: 201 })
  }),

  http.delete('/api/user-uploads/:id', ({ params }) => {
    const existing = db.userUpload.findFirst({ where: { id: { equals: params.id as string } } })
    if (!existing) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    db.userUpload.delete({ where: { id: { equals: params.id as string } } })
    return HttpResponse.json({ ok: true })
  }),
]

function toDto(u: ReturnType<typeof db.userUpload.findFirst>) {
  if (!u) return null
  return {
    id: u.id,
    userId: u.userId,
    title: u.title,
    categoryId: u.categoryId,
    subcategoryId: u.subcategoryId,
    level: u.level,
    schoolGrade: u.schoolGrade,
    content: u.content,
    answerSheet: { id: `ans-${u.id}`, content: u.answerContent },
    originalImageDataUrl: u.originalImageDataUrl,
    createdAt: u.createdAt,
  }
}
