import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { db, userToDto, type UserRow } from '../db.js'
import { signToken, requireAuth, type AuthRequest } from '../middleware/auth.js'

export const authRouter = Router()

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body as { email: string; password: string }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }
  if (user.account_status === 'suspended') {
    res.status(403).json({ message: 'Account suspended. Contact support.' })
    return
  }
  res.json({ token: signToken(user.id, user.role), user: userToDto(user) })
})

authRouter.post('/register', (req, res) => {
  const { email, password, plan } = req.body as { email: string; password: string; plan: 'monthly' | 'annual' }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ message: 'Email already registered' })
    return
  }
  const id = uuid()
  const hash = bcrypt.hashSync(password, 10)
  const expiresAt = plan === 'annual'
    ? new Date(Date.now() + 365 * 86400000).toISOString()
    : new Date(Date.now() + 30 * 86400000).toISOString()

  db.prepare(`
    INSERT INTO users (id,email,password_hash,role,account_status,subscription_status,subscription_plan,subscription_expires_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, email, hash, 'user', 'active', 'active', plan, expiresAt, new Date().toISOString())

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow
  res.status(201).json({ token: signToken(user.id, user.role), user: userToDto(user) })
})

authRouter.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as UserRow | undefined
  if (!user) { res.status(404).json({ message: 'Not found' }); return }
  res.json(userToDto(user))
})

authRouter.post('/change-password', requireAuth, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as UserRow | undefined
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    res.status(400).json({ message: 'Current password is incorrect' })
    return
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.userId)
  res.json({ ok: true })
})
