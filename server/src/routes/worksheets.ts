import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import PDFDocument from 'pdfkit'
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

  const safeTitle = row.title.replace(/[^\w\s-]/g, '').trim()
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`)
  res.setHeader('Content-Type', 'application/pdf')

  const doc = new PDFDocument({ margin: 50, size: 'LETTER' })
  doc.pipe(res)

  const stripMd = (text: string) =>
    text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .trim()

  const writeSectionLines = (text: string) => {
    const lines = stripMd(text).split('\n')
    for (const line of lines) {
      if (line.trim() === '') { doc.moveDown(0.4); continue }
      doc.fontSize(11).fillColor('#1a1a1a').text(line, { lineGap: 3 })
    }
  }

  // Title
  doc.fontSize(20).fillColor('#ea580c').text(row.title, { align: 'center' })
  doc.moveDown(0.5)

  // Metadata row
  const meta = [row.level, row.school_grade ? `Grade ${row.school_grade}` : null, row.author]
    .filter(Boolean).join('  ·  ')
  doc.fontSize(10).fillColor('#6b7280').text(meta, { align: 'center' })
  doc.moveDown(1)

  // Worksheet content
  doc.fontSize(13).fillColor('#111827').text('Worksheet', { underline: true })
  doc.moveDown(0.4)
  writeSectionLines(row.content)

  // Answer sheet on new page
  doc.addPage()
  doc.fontSize(13).fillColor('#111827').text('Answer Sheet', { underline: true })
  doc.moveDown(0.4)
  writeSectionLines(row.answer_content)

  doc.end()
})
