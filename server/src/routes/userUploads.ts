import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'
import PDFDocument from 'pdfkit'
import { db, uploadToDto, type UploadRow } from '../db.js'
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth.js'

const createUploadSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  schoolGrade: z.string().nullable(),
  content: z.string().min(1),
  answerContent: z.string().min(1),
  originalImageDataUrl: z.string().regex(/^data:image\/(jpeg|png|webp|gif);base64,/),
})

const updateUploadSchema = z.object({
  content: z.string().min(1).optional(),
  answerContent: z.string().min(1).optional(),
})

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '../../../uploads')
const IMAGE_BASE = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '') + '/uploads'

export const userUploadsRouter = Router()

userUploadsRouter.get('/all', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM user_uploads ORDER BY created_at DESC').all() as UploadRow[]
  res.json(rows.map((r) => uploadToDto(r, IMAGE_BASE)))
})

userUploadsRouter.get('/', requireAuth, (req, res) => {
  const { userId } = req.query as { userId: string }
  const rows = db.prepare('SELECT * FROM user_uploads WHERE user_id = ? ORDER BY created_at DESC').all(userId) as UploadRow[]
  res.json(rows.map((r) => uploadToDto(r, IMAGE_BASE)))
})

userUploadsRouter.get('/:id/export', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM user_uploads WHERE id = ?').get(req.params.id) as UploadRow | undefined
  if (!row) { res.status(404).json({ message: 'Not found' }); return }

  const safeTitle = row.title.replace(/[^\w\s-]/g, '').trim()
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`)
  res.setHeader('Content-Type', 'application/pdf')

  const doc = new PDFDocument({ margin: 50, size: 'LETTER' })
  doc.pipe(res)

  const stripMd = (text: string) =>
    text.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim()

  const writeSectionLines = (text: string) => {
    for (const line of stripMd(text).split('\n')) {
      if (line.trim() === '') { doc.moveDown(0.4); continue }
      doc.fontSize(11).fillColor('#1a1a1a').text(line, { lineGap: 3 })
    }
  }

  doc.fontSize(20).fillColor('#ea580c').text(row.title, { align: 'center' })
  doc.moveDown(0.5)
  const meta = [row.level, row.school_grade ? `Grade ${row.school_grade}` : null]
    .filter(Boolean).join('  ·  ')
  doc.fontSize(10).fillColor('#6b7280').text(meta, { align: 'center' })
  doc.moveDown(1)

  doc.fontSize(13).fillColor('#111827').text('Worksheet', { underline: true })
  doc.moveDown(0.4)
  writeSectionLines(row.content)

  doc.addPage()
  doc.fontSize(13).fillColor('#111827').text('Answer Sheet', { underline: true })
  doc.moveDown(0.4)
  writeSectionLines(row.answer_content)

  doc.end()
})

userUploadsRouter.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM user_uploads WHERE id = ?').get(req.params.id) as UploadRow | undefined
  if (!row) { res.status(404).json({ message: 'Not found' }); return }
  res.json(uploadToDto(row, '/uploads'))
})

userUploadsRouter.post('/', requireAuth, (req: AuthRequest, res) => {
  const parsed = createUploadSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid request', errors: parsed.error.flatten().fieldErrors }); return }
  const { userId, title, categoryId, subcategoryId, level, schoolGrade, content, answerContent, originalImageDataUrl } = parsed.data

  const match = originalImageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) { res.status(400).json({ message: 'Invalid image data' }); return }
  const [, ext, base64Data] = match
  const id = uuid()
  const filename = `${id}.${ext}`

  try {
    writeFileSync(join(UPLOADS_DIR, filename), Buffer.from(base64Data, 'base64'))
  } catch {
    res.status(500).json({ message: 'Failed to save image' })
    return
  }

  db.prepare(`
    INSERT INTO user_uploads (id,user_id,title,category_id,subcategory_id,level,school_grade,content,answer_content,image_path,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, userId, title, categoryId, subcategoryId, level, schoolGrade ?? null, content, answerContent, filename, new Date().toISOString())

  const row = db.prepare('SELECT * FROM user_uploads WHERE id = ?').get(id) as UploadRow
  res.status(201).json(uploadToDto(row, '/uploads'))
})

userUploadsRouter.patch('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM user_uploads WHERE id = ?').get(req.params.id) as UploadRow | undefined
  if (!row) { res.status(404).json({ message: 'Not found' }); return }

  const parsedPatch = updateUploadSchema.safeParse(req.body)
  if (!parsedPatch.success) { res.status(400).json({ message: 'Invalid request', errors: parsedPatch.error.flatten().fieldErrors }); return }
  const { content, answerContent } = parsedPatch.data
  if (content !== undefined) db.prepare('UPDATE user_uploads SET content = ? WHERE id = ?').run(content, req.params.id)
  if (answerContent !== undefined) db.prepare('UPDATE user_uploads SET answer_content = ? WHERE id = ?').run(answerContent, req.params.id)

  const updated = db.prepare('SELECT * FROM user_uploads WHERE id = ?').get(req.params.id) as UploadRow
  res.json(uploadToDto(updated, '/uploads'))
})

userUploadsRouter.delete('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM user_uploads WHERE id = ?').get(req.params.id) as UploadRow | undefined
  if (!row) { res.status(404).json({ message: 'Not found' }); return }

  const filePath = join(UPLOADS_DIR, row.image_path)
  if (existsSync(filePath)) unlinkSync(filePath)

  db.prepare('DELETE FROM user_uploads WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})
