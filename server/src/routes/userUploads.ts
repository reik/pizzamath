import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db, uploadToDto, type UploadRow } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '../../../uploads')

export const userUploadsRouter = Router()

userUploadsRouter.get('/', requireAuth, (req, res) => {
  const { userId } = req.query as { userId: string }
  const rows = db.prepare('SELECT * FROM user_uploads WHERE user_id = ? ORDER BY created_at DESC').all(userId) as UploadRow[]
  res.json(rows.map((r) => uploadToDto(r, '/uploads')))
})

userUploadsRouter.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM user_uploads WHERE id = ?').get(req.params.id) as UploadRow | undefined
  if (!row) { res.status(404).json({ message: 'Not found' }); return }
  res.json(uploadToDto(row, '/uploads'))
})

userUploadsRouter.post('/', requireAuth, (req: AuthRequest, res) => {
  const { userId, title, categoryId, subcategoryId, level, schoolGrade, content, answerContent, originalImageDataUrl } = req.body as {
    userId: string; title: string; categoryId: string; subcategoryId: string
    level: string; schoolGrade: string | null; content: string; answerContent: string
    originalImageDataUrl: string
  }

  // Decode and save the base64 image
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

userUploadsRouter.delete('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM user_uploads WHERE id = ?').get(req.params.id) as UploadRow | undefined
  if (!row) { res.status(404).json({ message: 'Not found' }); return }

  const filePath = join(UPLOADS_DIR, row.image_path)
  if (existsSync(filePath)) unlinkSync(filePath)

  db.prepare('DELETE FROM user_uploads WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})
