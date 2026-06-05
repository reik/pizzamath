import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { db, userToDto, type UserRow } from '../db.js'
import { signToken, requireAuth, type AuthRequest } from '../middleware/auth.js'
import { sendPasswordResetEmail } from '../email.js'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  plan: z.enum(['monthly', 'annual']),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
})

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid request', errors: parsed.error.flatten().fieldErrors }); return }
  const { email, password } = parsed.data
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
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid request', errors: parsed.error.flatten().fieldErrors }); return }
  const { email, password, plan } = parsed.data
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
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid request', errors: parsed.error.flatten().fieldErrors }); return }
  const { currentPassword, newPassword } = parsed.data
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as UserRow | undefined
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    res.status(400).json({ message: 'Current password is incorrect' })
    return
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.userId)
  res.json({ ok: true })
})

authRouter.post('/forgot-password', async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Valid email required' }); return }

  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(parsed.data.email) as { id: string; email: string } | undefined

  // Always 200 — prevents email enumeration
  if (!user) { res.json({ ok: true }); return }

  // Invalidate any existing token for this user
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id)

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  db.prepare('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(tokenHash, user.id, expiresAt)

  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:5175/pizzamath'
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`

  await sendPasswordResetEmail(user.email, resetUrl)
  res.json({ ok: true })
})

authRouter.post('/reset-password', (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'token and newPassword (min 8 chars) required' }); return }

  const { token, newPassword } = parsed.data
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const row = db.prepare('SELECT user_id, expires_at FROM password_reset_tokens WHERE token_hash = ?')
    .get(tokenHash) as { user_id: string; expires_at: string } | undefined

  if (!row || new Date(row.expires_at) < new Date()) {
    res.status(400).json({ message: 'Invalid or expired reset link' }); return
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), row.user_id)
  db.prepare('DELETE FROM password_reset_tokens WHERE token_hash = ?').run(tokenHash)

  res.json({ ok: true })
})
