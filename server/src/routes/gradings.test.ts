import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('../claude/visionGrader.js', () => ({
  gradeWithVision: vi.fn(async () => ({
    success: true,
    data: {
      score: 1, total: 2,
      problems: [
        { problemIndex: 0, problemText: '2+2', expectedAnswer: '4', studentAnswer: '4', isCorrect: true },
        { problemIndex: 1, problemText: '3+5', expectedAnswer: '8', studentAnswer: '7', isCorrect: false, errorCategory: 'careless', errorExplanation: 'off by one' },
      ],
    },
  })),
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, readFileSync: vi.fn(() => Buffer.from('fake-image-bytes')) }
})

let app: typeof import('../app.js')['app']
let db: typeof import('../db.js')['db']

beforeEach(async () => {
  vi.resetModules()
  ;({ app } = await import('../app.js'))
  ;({ db } = await import('../db.js'))
  for (const uploadId of ['upload-test-1', 'upload-test-2']) {
    db.prepare(
      `DELETE FROM grading_problems WHERE grading_id IN (SELECT id FROM worksheet_gradings WHERE upload_id = ?)`,
    ).run(uploadId)
    db.prepare(`DELETE FROM worksheet_gradings WHERE upload_id = ?`).run(uploadId)
    db.prepare(`DELETE FROM user_uploads WHERE id = ?`).run(uploadId)
  }
})

function tokenFor(userId: string): string {
  return jwt.sign({ userId, role: 'user' }, process.env.JWT_SECRET ?? 'test-secret', { expiresIn: '1h' })
}

describe('POST /api/gradings', () => {
  it('400s when uploadId missing', async () => {
    const res = await request(app)
      .post('/api/gradings')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('404s when upload not owned by user', async () => {
    const res = await request(app)
      .post('/api/gradings')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
      .send({ uploadId: 'nonexistent' })
    expect(res.status).toBe(404)
  })

  it('persists a grading + problems and returns 201', async () => {
    const uploadId = 'upload-test-1'
    db.prepare(`INSERT INTO user_uploads (id,user_id,title,category_id,subcategory_id,level,school_grade,content,answer_content,image_path,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(uploadId, 'admin-1', 't', 'cat-2', 'sub-2-1', 'Beginner', '3', '', '', '/uploads/x.jpg', new Date().toISOString())

    const res = await request(app)
      .post('/api/gradings')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
      .send({ uploadId })
    expect(res.status).toBe(201)
    expect(res.body.score).toBe(1)
    expect(res.body.total).toBe(2)
    expect(res.body.problems).toHaveLength(2)

    const persisted = db.prepare('SELECT COUNT(*) as n FROM grading_problems WHERE grading_id = ?').get(res.body.id) as { n: number }
    expect(persisted.n).toBe(2)
  })
})

describe('GET /api/gradings/:id', () => {
  it('404s when grading is not the user’s', async () => {
    const res = await request(app)
      .get('/api/gradings/does-not-exist')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
    expect(res.status).toBe(404)
  })

  it('returns the grading with problems for the owner', async () => {
    const uploadId = 'upload-test-2'
    db.prepare(`INSERT INTO user_uploads (id,user_id,title,category_id,subcategory_id,level,school_grade,content,answer_content,image_path,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(uploadId, 'admin-1', 't', 'cat-2', 'sub-2-1', 'Beginner', '3', '', '', '/uploads/y.jpg', new Date().toISOString())
    const create = await request(app).post('/api/gradings').set('Authorization', `Bearer ${tokenFor('admin-1')}`).send({ uploadId })
    const res = await request(app).get(`/api/gradings/${create.body.id}`).set('Authorization', `Bearer ${tokenFor('admin-1')}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(create.body.id)
    expect(res.body.problems).toHaveLength(2)
  })
})
