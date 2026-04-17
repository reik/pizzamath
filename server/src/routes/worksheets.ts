import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, worksheetToDto, type WorksheetRow } from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

export const worksheetsRouter = Router()

worksheetsRouter.get('/', requireAuth, (req, res) => {
  const { categoryId, subcategoryId, keyword } = req.query as Record<string, string>

  let sql = 'SELECT * FROM worksheets WHERE 1=1'
  const params: string[] = []

  if (categoryId) { sql += ' AND category_id = ?'; params.push(categoryId) }
  if (subcategoryId) { sql += ' AND subcategory_id = ?'; params.push(subcategoryId) }
  if (keyword) {
    sql += ' AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ?)'
    params.push(`%${keyword.toLowerCase()}%`, `%${keyword.toLowerCase()}%`)
  }

  sql += ' ORDER BY created_at DESC'
  const rows = db.prepare(sql).all(...params) as WorksheetRow[]
  res.json(rows.map(worksheetToDto))
})

worksheetsRouter.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM worksheets WHERE id = ?').get(req.params.id) as WorksheetRow | undefined
  if (!row) { res.status(404).json({ message: 'Not found' }); return }
  res.json(worksheetToDto(row))
})

worksheetsRouter.post('/', requireAdmin, (req, res) => {
  const { title, categoryId, subcategoryId, level, schoolGrade, author, content, answerContent } = req.body as {
    title: string; categoryId: string; subcategoryId: string; level: string
    schoolGrade: string | null; author: string; content: string; answerContent: string
  }
  const id = uuid()
  db.prepare(`
    INSERT INTO worksheets (id,title,category_id,subcategory_id,level,school_grade,author,content,answer_content,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(id, title, categoryId, subcategoryId, level, schoolGrade ?? null, author, content, answerContent, new Date().toISOString())

  const row = db.prepare('SELECT * FROM worksheets WHERE id = ?').get(id) as WorksheetRow
  res.status(201).json(worksheetToDto(row))
})

worksheetsRouter.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM worksheets WHERE id = ?').get(req.params.id)
  if (!existing) { res.status(404).json({ message: 'Not found' }); return }
  db.prepare('DELETE FROM worksheets WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

worksheetsRouter.get('/:id/export', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM worksheets WHERE id = ?').get(req.params.id) as WorksheetRow | undefined
  if (!row) { res.status(404).json({ message: 'Not found' }); return }
  const format = (req.query.format as string) ?? 'pdf'
  const content = `${row.title}\n\n${row.content}`
  res.setHeader('Content-Disposition', `attachment; filename="${row.title}.${format}"`)
  res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/msword')
  res.send(Buffer.from(content))
})
