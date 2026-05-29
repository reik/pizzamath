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

vi.mock('../claude/targetedGen.js', () => ({
  generateTargetedPractice: vi.fn(async () => ({
    success: true,
    data: {
      title: 'Targeted Practice', categoryId: 'cat-3', subcategoryId: 'sub-3-1',
      level: 'Beginner' as const, schoolGrade: '2', content: '1. 12 + 9 = ?', answerContent: '1. 21',
    },
  })),
}))

let app: typeof import('../app.js')['app']
let db: typeof import('../db.js')['db']

beforeEach(async () => {
  vi.resetModules()
  ;({ app } = await import('../app.js'))
  ;({ db } = await import('../db.js'))
  for (const uploadId of ['upload-test-1', 'upload-test-2', 'upload-test-3']) {
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

describe('POST /api/gradings/:id/generate-practice', () => {
  it('creates a worksheet from the grading’s error categories', async () => {
    const uploadId = 'upload-test-3'
    db.prepare(`INSERT INTO user_uploads (id,user_id,title,category_id,subcategory_id,level,school_grade,content,answer_content,image_path,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(uploadId, 'admin-1', 't', 'cat-3', 'sub-3-1', 'Beginner', '2', '', '', '/uploads/z.jpg', new Date().toISOString())
    const create = await request(app).post('/api/gradings').set('Authorization', `Bearer ${tokenFor('admin-1')}`).send({ uploadId })

    const res = await request(app)
      .post(`/api/gradings/${create.body.id}/generate-practice`)
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Targeted Practice')
    expect(res.body.id).toBeDefined()

    const persisted = db.prepare('SELECT * FROM worksheets WHERE id = ?').get(res.body.id)
    expect(persisted).toBeTruthy()
  })
})

describe('GET /api/gradings/insights/me', () => {
  it('aggregates error counts across the caller’s gradings', async () => {
    const uploadId = 'upload-test-1'
    db.prepare(`INSERT INTO user_uploads (id,user_id,title,category_id,subcategory_id,level,school_grade,content,answer_content,image_path,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(uploadId, 'admin-1', 't', 'cat-2', 'sub-2-1', 'Beginner', '3', '', '', '/uploads/x.jpg', new Date().toISOString())
    await request(app).post('/api/gradings').set('Authorization', `Bearer ${tokenFor('admin-1')}`).send({ uploadId })

    const res = await request(app)
      .get('/api/gradings/insights/me')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
    expect(res.status).toBe(200)
    expect(res.body.totalGradings).toBeGreaterThan(0)
    expect(Array.isArray(res.body.byCategory)).toBe(true)
    expect(Array.isArray(res.body.recent)).toBe(true)
    expect(Array.isArray(res.body.practiceOutcomes)).toBe(true)
  })
})

describe('practiceOutcomes in /insights/me', () => {
  function seedGrading(args: {
    userId: string; uploadId: string; gradingId: string; createdAt: string
    problems: Array<{ category: string | null; isCorrect: boolean }>
  }) {
    db.prepare(`INSERT INTO worksheet_gradings (id,user_id,upload_id,score,total,created_at) VALUES (?,?,?,?,?,?)`)
      .run(args.gradingId, args.userId, args.uploadId, 0, args.problems.length, args.createdAt)
    args.problems.forEach((p, i) => {
      db.prepare(`INSERT INTO grading_problems (id,grading_id,problem_index,problem_text,expected_answer,student_answer,is_correct,error_category,error_explanation)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(`gp-${args.gradingId}-${i}`, args.gradingId, i, 'q', 'a', p.isCorrect ? 'a' : 'b', p.isCorrect ? 1 : 0, p.category, null)
    })
  }

  function seedDrill(args: { userId: string; sourceGradingId: string; categories: string[]; createdAt: string }) {
    const worksheetId = `ws-drill-${args.sourceGradingId}`
    db.prepare(`INSERT INTO worksheets (id,title,category_id,subcategory_id,level,school_grade,author,content,answer_content,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(worksheetId, 'drill', 'cat-2', 'sub-2-1', 'Beginner', '3', 'PizzaMath (targeted)', '', '', args.createdAt)
    db.prepare(`INSERT INTO targeted_practice (id,worksheet_id,source_grading_id,user_id,target_categories,created_at) VALUES (?,?,?,?,?,?)`)
      .run(`tp-${args.sourceGradingId}`, worksheetId, args.sourceGradingId, args.userId, JSON.stringify(args.categories), args.createdAt)
  }

  it('reports "fixed" when post-drill error rate halved or better', async () => {
    const uid = 'admin-1'
    const upload = 'upload-test-1'
    db.prepare(`INSERT INTO user_uploads (id,user_id,title,category_id,subcategory_id,level,school_grade,content,answer_content,image_path,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(upload, uid, 't', 'cat-2', 'sub-2-1', 'Beginner', '3', '', '', '/uploads/x.jpg', '2026-01-01T00:00:00.000Z')

    seedGrading({ userId: uid, uploadId: upload, gradingId: 'g-pre-1', createdAt: '2026-01-02T00:00:00.000Z',
      problems: [{ category: 'regrouping', isCorrect: false }, { category: 'regrouping', isCorrect: false }] })
    seedDrill({ userId: uid, sourceGradingId: 'g-pre-1', categories: ['regrouping'], createdAt: '2026-01-03T00:00:00.000Z' })
    seedGrading({ userId: uid, uploadId: upload, gradingId: 'g-post-1', createdAt: '2026-01-04T00:00:00.000Z',
      problems: [{ category: null, isCorrect: true }] })

    const res = await request(app).get('/api/gradings/insights/me').set('Authorization', `Bearer ${tokenFor(uid)}`)
    const outcome = res.body.practiceOutcomes.find((o: { category: string }) => o.category === 'regrouping')
    expect(outcome).toBeDefined()
    expect(outcome.status).toBe('fixed')
    expect(outcome.preDrillErrors).toBe(2)
    expect(outcome.postDrillErrors).toBe(0)
  })

  it('reports "still_struggling" when post-drill error rate did not improve', async () => {
    const uid = 'admin-1'
    const upload = 'upload-test-1'
    db.prepare(`INSERT INTO user_uploads (id,user_id,title,category_id,subcategory_id,level,school_grade,content,answer_content,image_path,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(upload, uid, 't', 'cat-2', 'sub-2-1', 'Beginner', '3', '', '', '/uploads/x.jpg', '2026-01-01T00:00:00.000Z')

    seedGrading({ userId: uid, uploadId: upload, gradingId: 'g-pre-2', createdAt: '2026-01-02T00:00:00.000Z',
      problems: [{ category: 'careless', isCorrect: false }] })
    seedDrill({ userId: uid, sourceGradingId: 'g-pre-2', categories: ['careless'], createdAt: '2026-01-03T00:00:00.000Z' })
    seedGrading({ userId: uid, uploadId: upload, gradingId: 'g-post-2', createdAt: '2026-01-04T00:00:00.000Z',
      problems: [{ category: 'careless', isCorrect: false }, { category: 'careless', isCorrect: false }] })

    const res = await request(app).get('/api/gradings/insights/me').set('Authorization', `Bearer ${tokenFor(uid)}`)
    const outcome = res.body.practiceOutcomes.find((o: { category: string }) => o.category === 'careless')
    expect(outcome).toBeDefined()
    expect(outcome.status).toBe('still_struggling')
    expect(outcome.postDrillErrors).toBe(2)
  })

  it('reports "insufficient_data" when no gradings exist after the drill', async () => {
    const uid = 'admin-1'
    const upload = 'upload-test-1'
    db.prepare(`INSERT INTO user_uploads (id,user_id,title,category_id,subcategory_id,level,school_grade,content,answer_content,image_path,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(upload, uid, 't', 'cat-2', 'sub-2-1', 'Beginner', '3', '', '', '/uploads/x.jpg', '2026-01-01T00:00:00.000Z')

    seedGrading({ userId: uid, uploadId: upload, gradingId: 'g-pre-3', createdAt: '2026-01-02T00:00:00.000Z',
      problems: [{ category: 'place_value', isCorrect: false }] })
    seedDrill({ userId: uid, sourceGradingId: 'g-pre-3', categories: ['place_value'], createdAt: '2026-01-03T00:00:00.000Z' })

    const res = await request(app).get('/api/gradings/insights/me').set('Authorization', `Bearer ${tokenFor(uid)}`)
    const outcome = res.body.practiceOutcomes.find((o: { category: string }) => o.category === 'place_value')
    expect(outcome).toBeDefined()
    expect(outcome.status).toBe('insufficient_data')
  })
})
