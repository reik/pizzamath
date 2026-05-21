import { Router } from 'express'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { extname } from 'path'
import { v4 as uuid } from 'uuid'
import { db } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { gradeWithVision } from '../claude/visionGrader.js'

export const gradingsRouter = Router()

const createSchema = z.object({ uploadId: z.string().min(1) })

function mediaTypeForPath(p: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | null {
  const ext = extname(p).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.webp') return 'image/webp'
  return null
}

gradingsRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'uploadId required' }); return }
  const { uploadId } = parsed.data

  const upload = db.prepare('SELECT * FROM user_uploads WHERE id = ? AND user_id = ?').get(uploadId, req.userId) as { image_path: string } | undefined
  if (!upload) { res.status(404).json({ message: 'Upload not found' }); return }

  const localPath = upload.image_path.startsWith('/uploads/')
    ? `./uploads/${upload.image_path.slice('/uploads/'.length)}`
    : upload.image_path
  const mediaType = mediaTypeForPath(localPath)
  if (!mediaType) { res.status(415).json({ message: 'Unsupported image type' }); return }

  let base64: string
  try { base64 = readFileSync(localPath).toString('base64') }
  catch { res.status(404).json({ message: 'Image file missing on disk' }); return }

  const grading = await gradeWithVision(base64, mediaType)
  if (!grading.success) { res.status(422).json({ message: 'Could not grade', reason: grading.reason }); return }

  const id = uuid()
  const createdAt = new Date().toISOString()
  const insertGrading = db.prepare('INSERT INTO worksheet_gradings (id,user_id,upload_id,score,total,created_at) VALUES (?,?,?,?,?,?)')
  const insertProblem = db.prepare(`INSERT INTO grading_problems
    (id,grading_id,problem_index,problem_text,expected_answer,student_answer,is_correct,error_category,error_explanation)
    VALUES (?,?,?,?,?,?,?,?,?)`)

  const tx = db.transaction(() => {
    insertGrading.run(id, req.userId, uploadId, grading.data.score, grading.data.total, createdAt)
    for (const p of grading.data.problems) {
      insertProblem.run(
        uuid(), id, p.problemIndex, p.problemText, p.expectedAnswer, p.studentAnswer,
        p.isCorrect ? 1 : 0, p.errorCategory ?? null, p.errorExplanation ?? null,
      )
    }
  })
  tx()

  res.status(201).json({
    id, uploadId, score: grading.data.score, total: grading.data.total,
    problems: grading.data.problems, createdAt,
  })
})
