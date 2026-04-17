import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { db, userToDto, type UserRow } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

export const usersRouter = Router()

usersRouter.get('/', requireAdmin, (_req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as UserRow[]
  res.json(users.map(userToDto))
})

usersRouter.post('/', requireAdmin, (req, res) => {
  const { email, password, role } = req.body as { email: string; password: string; role: string }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) { res.status(409).json({ message: 'Email already registered' }); return }

  const id = uuid()
  db.prepare(`
    INSERT INTO users (id,email,password_hash,role,account_status,subscription_status,subscription_plan,subscription_expires_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, email, bcrypt.hashSync(password, 10), role ?? 'user', 'active', 'inactive', null, null, new Date().toISOString())

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow
  res.status(201).json(userToDto(user))
})

usersRouter.patch('/:id', requireAdmin, (req, res) => {
  const { accountStatus } = req.body as { accountStatus: string }
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
  if (!existing) { res.status(404).json({ message: 'Not found' }); return }
  db.prepare('UPDATE users SET account_status = ? WHERE id = ?').run(accountStatus, req.params.id)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as UserRow
  res.json(userToDto(user))
})

usersRouter.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
  if (!existing) { res.status(404).json({ message: 'Not found' }); return }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})
