import { Router } from 'express'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { dirname, extname, join } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { db } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { gradeWithVision } from '../claude/visionGrader.js'
import { generateTargetedPractice } from '../claude/targetedGen.js'
import { isErrorCategoryId, type ErrorCategoryId } from '../errorTaxonomy.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '../../../uploads')

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

  const filename = upload.image_path.replace(/^\/?uploads\//, '')
  const localPath = join(UPLOADS_DIR, filename)
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

gradingsRouter.get('/:id', requireAuth, (req: AuthRequest, res) => {
  const grading = db.prepare('SELECT * FROM worksheet_gradings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as
    | { id: string; upload_id: string; score: number; total: number; created_at: string }
    | undefined
  if (!grading) { res.status(404).json({ message: 'Not found' }); return }

  const problems = db.prepare(`SELECT problem_index, problem_text, expected_answer, student_answer, is_correct, error_category, error_explanation
    FROM grading_problems WHERE grading_id = ? ORDER BY problem_index ASC`).all(req.params.id) as Array<{
      problem_index: number; problem_text: string; expected_answer: string; student_answer: string;
      is_correct: number; error_category: string | null; error_explanation: string | null;
    }>

  res.json({
    id: grading.id,
    uploadId: grading.upload_id,
    score: grading.score,
    total: grading.total,
    createdAt: grading.created_at,
    problems: problems.map((p) => ({
      problemIndex: p.problem_index,
      problemText: p.problem_text,
      expectedAnswer: p.expected_answer,
      studentAnswer: p.student_answer,
      isCorrect: !!p.is_correct,
      errorCategory: p.error_category ?? undefined,
      errorExplanation: p.error_explanation ?? undefined,
    })),
  })
})

gradingsRouter.post('/:id/generate-practice', requireAuth, async (req: AuthRequest, res) => {
  const grading = db.prepare('SELECT * FROM worksheet_gradings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as
    | { id: string; upload_id: string } | undefined
  if (!grading) { res.status(404).json({ message: 'Not found' }); return }

  const upload = db.prepare('SELECT level, school_grade FROM user_uploads WHERE id = ?').get(grading.upload_id) as
    { level: 'Beginner' | 'Intermediate' | 'Advanced'; school_grade: string | null }

  const rows = db.prepare('SELECT error_category FROM grading_problems WHERE grading_id = ? AND is_correct = 0 AND error_category IS NOT NULL').all(grading.id) as { error_category: string }[]
  const categories: ErrorCategoryId[] = [...new Set(rows.map((r) => r.error_category))].filter(isErrorCategoryId)
  if (categories.length === 0) { res.status(400).json({ message: 'No mistakes to drill — nothing to generate.' }); return }

  const generated = await generateTargetedPractice({
    categories,
    level: upload.level,
    schoolGrade: upload.school_grade,
  })
  if (!generated.success) { res.status(422).json({ message: 'Generation failed', reason: generated.reason }); return }

  const id = uuid()
  const createdAt = new Date().toISOString()
  db.prepare(`INSERT INTO worksheets (id,title,category_id,subcategory_id,level,school_grade,author,content,answer_content,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, generated.data.title, generated.data.categoryId, generated.data.subcategoryId, generated.data.level, generated.data.schoolGrade, 'PizzaMath (targeted)', generated.data.content, generated.data.answerContent, createdAt)

  res.status(201).json({ id, ...generated.data, createdAt })
})
