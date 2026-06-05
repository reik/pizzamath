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
  vi.mock('../email.js', () => ({ sendPasswordResetEmail: vi.fn(async () => {}) }))
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
