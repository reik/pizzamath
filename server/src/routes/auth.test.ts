import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import crypto from 'crypto'

vi.mock('../email.js', () => ({
  sendPasswordResetEmail: vi.fn(async () => {}),
}))

let app: typeof import('../app.js')['app']
let db: typeof import('../db.js')['db']

beforeEach(async () => {
  vi.resetModules()
  ;({ app } = await import('../app.js'))
  ;({ db } = await import('../db.js'))
})

describe('POST /api/auth/forgot-password', () => {
  it('returns 200 for a registered email and creates a token', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'abc@abc.co' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE user_id = ?').get('admin-1') as { token_hash: string } | undefined
    expect(row).toBeDefined()
  })

  it('returns 200 even for an unregistered email (prevents enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({})
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/reset-password', () => {
  function insertToken(userId: string, rawToken: string, offsetMs = 60 * 60 * 1000) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + offsetMs).toISOString()
    db.prepare('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .run(tokenHash, userId, expiresAt)
  }

  it('resets the password and deletes the token when token is valid', async () => {
    insertToken('admin-1', 'valid-token-abc')

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'valid-token-abc', newPassword: 'newSecurePass1' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })

    const tokenHash = crypto.createHash('sha256').update('valid-token-abc').digest('hex')
    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ?').get(tokenHash)
    expect(row).toBeUndefined()

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'abc@abc.co', password: 'newSecurePass1' })
    expect(login.status).toBe(200)
  })

  it('returns 400 for an unknown token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'does-not-exist', newPassword: 'newSecurePass1' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/invalid or expired/i)
  })

  it('returns 400 for an expired token', async () => {
    insertToken('admin-1', 'expired-token-xyz', -1000)
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'expired-token-xyz', newPassword: 'newSecurePass1' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/invalid or expired/i)
  })

  it('returns 400 when newPassword is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'some-token' })
    expect(res.status).toBe(400)
  })
})
