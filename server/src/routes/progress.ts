import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

interface ProgressRow {
  id: string; user_id: string; worksheet_id: string; worksheet_title: string
  date: string; score: number; comment: string
}

function toDto(r: ProgressRow) {
  return { id: r.id, userId: r.user_id, worksheetId: r.worksheet_id, worksheetTitle: r.worksheet_title, date: r.date, score: r.score, comment: r.comment }
}

export const progressRouter = Router()

progressRouter.get('/', requireAuth, (req, res) => {
  const { userId } = req.query as { userId: string }
  const rows = db.prepare('SELECT * FROM progress_entries WHERE user_id = ? ORDER BY date DESC').all(userId) as ProgressRow[]
  res.json(rows.map(toDto))
})

progressRouter.post('/', requireAuth, (req, res) => {
  const { userId, worksheetId, worksheetTitle, date, score, comment } = req.body as {
    userId: string; worksheetId: string; worksheetTitle: string; date: string; score: number; comment: string
  }
  const id = uuid()
  db.prepare(`
    INSERT INTO progress_entries (id,user_id,worksheet_id,worksheet_title,date,score,comment)
    VALUES (?,?,?,?,?,?,?)
  `).run(id, userId, worksheetId, worksheetTitle, date, score, comment ?? '')
  const row = db.prepare('SELECT * FROM progress_entries WHERE id = ?').get(id) as ProgressRow
  res.status(201).json(toDto(row))
})
