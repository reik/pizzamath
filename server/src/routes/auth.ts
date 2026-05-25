import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { randomBytes, createHash } from 'crypto'
import { db, userToDto, type UserRow } from '../db.js'
import { signToken, requireAuth, type AuthRequest } from '../middleware/auth.js'
import { sendMagicLink, sendWelcomeLink } from '../email.js'

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:5175'

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

function buildMagicLink(rawToken: string): string {
  return `${APP_BASE_URL.replace(/\/$/, '')}/auth/verify?token=${encodeURIComponent(rawToken)}`
}

interface MagicTokenRow {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  consumed_at: string | null
  created_at: string
}

function issueMagicToken(userId: string): string {
  const raw = randomBytes(32).toString('base64url')
  const now = new Date()
  db.prepare(`
    INSERT INTO magic_link_tokens (id, user_id, token_hash, expires_at, consumed_at, created_at)
    VALUES (?, ?, ?, ?, NULL, ?)
  `).run(
    uuid(),
    userId,
    hashToken(raw),
    new Date(now.getTime() + MAGIC_LINK_TTL_MS).toISOString(),
    now.toISOString(),
  )
  return raw
}

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

  const rawToken = issueMagicToken(user.id)
  sendWelcomeLink(user.email, buildMagicLink(rawToken)).catch((err) => {
    console.error('[auth/register] welcome email failed:', err)
  })

  res.status(201).json({ token: signToken(user.id, user.role), user: userToDto(user) })
})

const magicRequestSchema = z.object({ email: z.string().email() })

authRouter.post('/magic-link/request', async (req, res) => {
  const parsed = magicRequestSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid request', errors: parsed.error.flatten().fieldErrors }); return }
  const { email } = parsed.data

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined

  if (user && user.account_status !== 'suspended') {
    const rawToken = issueMagicToken(user.id)
    try {
      await sendMagicLink(user.email, buildMagicLink(rawToken))
    } catch (err) {
      console.error('[auth/magic-link/request] email send failed:', err)
    }
  }

  res.json({ ok: true })
})

const magicVerifySchema = z.object({ token: z.string().min(20) })

authRouter.post('/magic-link/verify', (req, res) => {
  const parsed = magicVerifySchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid or missing token' }); return }
  const { token } = parsed.data

  const row = db.prepare('SELECT * FROM magic_link_tokens WHERE token_hash = ?').get(hashToken(token)) as MagicTokenRow | undefined
  if (!row) { res.status(400).json({ message: 'Invalid or expired link' }); return }
  if (row.consumed_at) { res.status(400).json({ message: 'This link has already been used' }); return }
  if (new Date(row.expires_at).getTime() < Date.now()) { res.status(400).json({ message: 'This link has expired' }); return }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id) as UserRow | undefined
  if (!user) { res.status(400).json({ message: 'Account not found' }); return }
  if (user.account_status === 'suspended') { res.status(403).json({ message: 'Account suspended. Contact support.' }); return }

  const consumeResult = db
    .prepare('UPDATE magic_link_tokens SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL')
    .run(new Date().toISOString(), row.id)
  if (consumeResult.changes !== 1) { res.status(400).json({ message: 'This link has already been used' }); return }

  res.json({ token: signToken(user.id, user.role), user: userToDto(user) })
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
