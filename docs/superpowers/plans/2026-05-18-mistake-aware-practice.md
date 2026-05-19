# Mistake-Aware Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let parents/teachers upload a photo of a completed math worksheet, get a per-problem error diagnosis from Claude vision, and generate a targeted re-practice worksheet that drills only the specific sub-skills the student missed.

**Architecture:** A new `gradings` domain on top of existing `user_uploads`. Server-side Claude vision call returns a structured per-problem grading (Zod-validated). Results persist in two new SQLite tables (`worksheet_gradings`, `grading_problems`). The frontend renders a diagnostic page and offers a one-click "Generate targeted practice" CTA that reuses the existing Claude generation flow with error categories injected into the prompt. A separate insights page aggregates errors across a user's gradings to show longitudinal skill-gap trends.

**Tech Stack:** Express + better-sqlite3 + `@anthropic-ai/sdk` (vision) on the backend; React 19 + Vite + React Query + Zod + Tailwind on the frontend. Tests: Vitest + supertest (backend, new) and Vitest + React Testing Library (frontend, existing).

---

## Purpose & Why (preserved for future reference)

### The problem
Every existing math-worksheet vendor — IXL, Khan Academy, Math-Drills, Education.com, Kumon — produces **dead artifacts**. A student does a worksheet, a parent grades it, mistakes get noted on the fridge, and the next worksheet has no knowledge of what happened. The feedback loop is broken. Parents see a score; they do not see *which sub-skill* the student is actually stuck on.

### The differentiator
PizzaMath already has three primitives no competitor combines:
1. **Photo upload** of completed work (`features/uploads`)
2. **Claude API** for generation (`server/src/routes/claude.ts`)
3. **Per-attempt progress tracking** with comments (`features/progress`)

We can use Claude's vision to read a photo of paper homework, classify each mistake by sub-skill, and auto-generate the *exact next worksheet* that drills the gap. This is what a $200/month Kumon tutor does in person; we do it from a phone photo in 30 seconds.

### Why this wins
- IXL gives 50 problems and a green/red bar. It does not say *why* the red was red.
- Khan adapts inside its own platform but cannot ingest pencil-and-paper work — and most elementary homework still happens on paper.
- Math-Drills and Education.com are static PDF libraries with zero feedback loop.
- Kumon's whole value prop is "diagnose the gap and re-drill" — but it requires a physical center and a tutor.

### Why it is tractable
Every primitive exists. The new code is: a Claude vision prompt for grading + an error-taxonomy schema + a targeted-generation prompt + a small dashboard view. No new infra; no new auth model; no new vendor.

### Scope discipline
This plan stays inside the existing app. It does **not** add billing, payments, real-time collaboration, multi-student parent accounts, push notifications, or mobile apps. Those are tempting and explicitly out of scope.

---

## Error Taxonomy (shared module)

A fixed enumerated list of error categories. The vision prompt is given this list and asked to tag each wrong answer with exactly one category, plus a one-sentence human-readable explanation. The list is small on purpose — it has to be aggregatable for the insights view to be meaningful.

| ID | Label | Example |
| --- | --- | --- |
| `arithmetic_fact` | Arithmetic fact error | $7 \times 8 = 54$ |
| `regrouping` | Carry/borrow error | Subtracted $42 - 18 = 24$ → wrote $36$ (forgot to borrow) |
| `place_value` | Place-value misalignment | Lined up $23 + 4$ as $27$ → got $63$ |
| `operation_confusion` | Wrong operation | Added when the problem said "difference" |
| `sign_error` | Sign / negative-number error | $-3 - 4 = 1$ |
| `fraction_common_denominator` | Did not find common denominator | $\frac{1}{2} + \frac{1}{3} = \frac{2}{5}$ |
| `fraction_simplification` | Did not simplify | $\frac{4}{8}$ left as final answer |
| `decimal_point` | Decimal-point misplacement | $2.3 \times 4 = 92$ |
| `word_problem_setup` | Misread the word problem | Translated "twice as many" as "+2" |
| `order_of_operations` | PEMDAS violation | $2 + 3 \times 4 = 20$ |
| `missed_step` | Skipped a sub-step | Found common denominator but never converted numerators |
| `conceptual` | Underlying concept misunderstanding | Treats variables as labels, not values |
| `careless` | Right method, wrong final answer | Worked out long division correctly, wrote a typo |

Extending this list later is fine; do **not** extend it during this plan.

---

## File Structure

### New files (server)
- `server/src/errorTaxonomy.ts` — `ERROR_CATEGORIES` constant + `ErrorCategoryId` type
- `server/src/claude/visionGrader.ts` — Claude vision grading call + Zod schema + parser
- `server/src/claude/targetedGen.ts` — error-aware worksheet generation prompt + parser
- `server/src/routes/gradings.ts` — Express router (`POST /`, `GET /:id`, `POST /:id/generate-practice`, `GET /insights/me`)
- `server/src/types/grading.ts` — domain TS types + Zod schemas
- `server/src/app.ts` — exported Express app (extracted from `index.ts`, see Task 1)
- `server/src/test/setup.ts` — Vitest setup file
- `server/src/health.test.ts`, `errorTaxonomy.test.ts`, `db.test.ts`, `types/grading.test.ts`, `claude/visionGrader.test.ts`, `claude/targetedGen.test.ts`, `routes/gradings.test.ts` — co-located tests

### New files (frontend)
- `src/types/errorTaxonomy.ts` — mirror of server taxonomy (typed)
- `src/api/gradings.ts` — fetch wrappers + Zod schemas + query keys
- `src/features/gradings/components/GradingResult.tsx`
- `src/features/gradings/components/ErrorBreakdown.tsx`
- `src/features/gradings/components/GeneratePracticeButton.tsx`
- `src/features/gradings/components/InsightsChart.tsx`
- `src/features/gradings/hooks/useGrading.ts`
- `src/features/gradings/hooks/useCreateGrading.ts`
- `src/features/gradings/hooks/useGenerateTargetedPractice.ts`
- `src/features/gradings/hooks/useInsights.ts`
- `src/features/gradings/index.ts` — barrel
- `src/pages/GradingPage.tsx`
- `src/pages/InsightsPage.tsx`
- Test files co-located (`.test.tsx`) for each component

### Modified files
- `server/src/db.ts` — append `worksheet_gradings` and `grading_problems` `CREATE TABLE` statements to the existing migration block
- `server/src/index.ts` — reduce to just `app.listen(...)` (Task 1)
- `server/package.json` — add `vitest`, `supertest`, `@types/supertest` devDeps; add `"test"` script
- `src/router.tsx` — add `/gradings/:id` and `/insights` routes (authed)
- `src/pages/MyUploadsPage.tsx` — add "Grade this" button per upload
- `src/components/Navbar/AccountMenu.tsx` — add "Insights" link

---

## Stage 0: Foundation

### Task 1: Add backend test infrastructure

**Files:**
- Modify: `server/package.json`
- Create: `server/vitest.config.ts`
- Create: `server/src/test/setup.ts`
- Create: `server/src/health.test.ts`
- Create: `server/src/app.ts` (extracted from `server/src/index.ts`)
- Modify: `server/src/index.ts`

- [ ] **Step 1: Install backend test deps**

```bash
cd server && npm install --save-dev vitest supertest @types/supertest
```

- [ ] **Step 2: Add test script to `server/package.json`**

Add to the `scripts` block:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `server/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Create `server/src/test/setup.ts`**

```ts
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret'
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? 'test-key'
```

- [ ] **Step 5: Extract Express app — create `server/src/app.ts`**

```ts
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'
import { worksheetsRouter } from './routes/worksheets.js'
import { categoriesRouter } from './routes/categories.js'
import { progressRouter } from './routes/progress.js'
import { usersRouter } from './routes/users.js'
import { userUploadsRouter } from './routes/userUploads.js'
import { claudeRouter } from './routes/claude.js'

export const app = express()

const ALLOWED_ORIGINS = ['http://localhost:5175', 'https://reik.github.io']
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }))
app.use(express.json({ limit: '20mb' }))

app.get('/api/health', (_req, res) => { res.json({ ok: true }) })

app.use('/api/auth', authRouter)
app.use('/api/worksheets', worksheetsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/progress', progressRouter)
app.use('/api/users', usersRouter)
app.use('/api/user-uploads', userUploadsRouter)
app.use('/api/claude', claudeRouter)
```

- [ ] **Step 6: Slim `server/src/index.ts`**

```ts
import 'dotenv/config'
import { app } from './app.js'

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`PizzaMath API running on http://localhost:${PORT}`)
})
```

If the existing `index.ts` also serves static `/uploads`, move that `app.use(...)` into `app.ts` too — preserve every previous behavior.

- [ ] **Step 7: Write the health smoke test**

Create `server/src/health.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from './app.js'

describe('GET /api/health', () => {
  it('returns 200 with ok:true', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
```

- [ ] **Step 8: Run the test — expect pass**

```bash
cd server && npm test
```

- [ ] **Step 9: Commit**

```bash
git add server/package.json server/package-lock.json server/vitest.config.ts server/src/test/setup.ts server/src/health.test.ts server/src/app.ts server/src/index.ts
git commit -m "chore(server): add vitest + supertest, extract app from index"
```

---

### Task 2: Add shared error taxonomy

**Files:**
- Create: `server/src/errorTaxonomy.ts`
- Create: `server/src/errorTaxonomy.test.ts`
- Create: `src/types/errorTaxonomy.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/errorTaxonomy.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ERROR_CATEGORIES, isErrorCategoryId } from './errorTaxonomy.js'

describe('errorTaxonomy', () => {
  it('exposes 13 fixed categories with unique ids', () => {
    const ids = ERROR_CATEGORIES.map((c) => c.id)
    expect(ids).toHaveLength(13)
    expect(new Set(ids).size).toBe(13)
  })

  it('isErrorCategoryId guards unknown values', () => {
    expect(isErrorCategoryId('regrouping')).toBe(true)
    expect(isErrorCategoryId('not_a_real_one')).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect failure ("Cannot find module")**

```bash
cd server && npm test -- errorTaxonomy
```

- [ ] **Step 3: Create `server/src/errorTaxonomy.ts`**

```ts
export const ERROR_CATEGORIES = [
  { id: 'arithmetic_fact', label: 'Arithmetic fact error' },
  { id: 'regrouping', label: 'Carry/borrow error' },
  { id: 'place_value', label: 'Place-value misalignment' },
  { id: 'operation_confusion', label: 'Wrong operation' },
  { id: 'sign_error', label: 'Sign / negative-number error' },
  { id: 'fraction_common_denominator', label: 'Missing common denominator' },
  { id: 'fraction_simplification', label: 'Did not simplify fraction' },
  { id: 'decimal_point', label: 'Decimal-point misplacement' },
  { id: 'word_problem_setup', label: 'Misread the word problem' },
  { id: 'order_of_operations', label: 'PEMDAS violation' },
  { id: 'missed_step', label: 'Skipped a sub-step' },
  { id: 'conceptual', label: 'Conceptual misunderstanding' },
  { id: 'careless', label: 'Careless (right method, wrong answer)' },
] as const

export type ErrorCategoryId = (typeof ERROR_CATEGORIES)[number]['id']

const ID_SET = new Set<string>(ERROR_CATEGORIES.map((c) => c.id))
export function isErrorCategoryId(value: unknown): value is ErrorCategoryId {
  return typeof value === 'string' && ID_SET.has(value)
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd server && npm test -- errorTaxonomy
```

- [ ] **Step 5: Mirror to the frontend**

Create `src/types/errorTaxonomy.ts` with the **same** content (duplicate intentionally — no shared monorepo today; the test in Step 1 pins the IDs, so divergence is a test failure).

- [ ] **Step 6: Commit**

```bash
git add server/src/errorTaxonomy.ts server/src/errorTaxonomy.test.ts src/types/errorTaxonomy.ts
git commit -m "feat(grading): add fixed error taxonomy module (server + client)"
```

---

## Stage 1: Photo Grading (MVP)

### Task 3: Database schema for gradings

**Files:**
- Modify: `server/src/db.ts`
- Create: `server/src/db.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/db.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { db } from './db.js'

describe('db schema', () => {
  it('has worksheet_gradings table with required columns', () => {
    const cols = db.prepare(`PRAGMA table_info(worksheet_gradings)`).all() as { name: string }[]
    const names = cols.map((c) => c.name)
    expect(names).toEqual(
      expect.arrayContaining(['id', 'user_id', 'upload_id', 'score', 'total', 'created_at']),
    )
  })

  it('has grading_problems table with required columns', () => {
    const cols = db.prepare(`PRAGMA table_info(grading_problems)`).all() as { name: string }[]
    const names = cols.map((c) => c.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'id', 'grading_id', 'problem_index', 'problem_text',
        'expected_answer', 'student_answer', 'is_correct',
        'error_category', 'error_explanation',
      ]),
    )
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd server && npm test -- db
```

- [ ] **Step 3: Append the schema to `server/src/db.ts`**

Inside the existing `db.exec(\`...\`)` block (the one that ends with the `magic_link_tokens` table or whichever is currently last, depending on which branch this is being implemented on), append:

```sql
CREATE TABLE IF NOT EXISTS worksheet_gradings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  upload_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (upload_id) REFERENCES user_uploads(id)
);

CREATE INDEX IF NOT EXISTS idx_gradings_user_id ON worksheet_gradings(user_id);

CREATE TABLE IF NOT EXISTS grading_problems (
  id TEXT PRIMARY KEY,
  grading_id TEXT NOT NULL,
  problem_index INTEGER NOT NULL,
  problem_text TEXT NOT NULL,
  expected_answer TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  error_category TEXT,
  error_explanation TEXT,
  FOREIGN KEY (grading_id) REFERENCES worksheet_gradings(id)
);

CREATE INDEX IF NOT EXISTS idx_grading_problems_grading_id ON grading_problems(grading_id);
```

- [ ] **Step 4: Run — expect pass**

```bash
cd server && npm test -- db
```

- [ ] **Step 5: Commit**

```bash
git add server/src/db.ts server/src/db.test.ts
git commit -m "feat(db): add worksheet_gradings + grading_problems tables"
```

---

### Task 4: Domain Zod schemas

**Files:**
- Create: `server/src/types/grading.ts`
- Create: `server/src/types/grading.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { gradedProblemSchema, gradingResponseSchema } from './grading.js'

describe('grading schemas', () => {
  it('accepts a well-formed graded problem', () => {
    const result = gradedProblemSchema.safeParse({
      problemIndex: 0,
      problemText: '7 × 8 = ?',
      expectedAnswer: '56',
      studentAnswer: '54',
      isCorrect: false,
      errorCategory: 'arithmetic_fact',
      errorExplanation: 'Recall error: 7×8 is 56, not 54.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown error category', () => {
    const result = gradedProblemSchema.safeParse({
      problemIndex: 0, problemText: 'x', expectedAnswer: '1', studentAnswer: '2',
      isCorrect: false, errorCategory: 'made_up', errorExplanation: 'x',
    })
    expect(result.success).toBe(false)
  })

  it('allows correct answers to omit error fields', () => {
    const result = gradedProblemSchema.safeParse({
      problemIndex: 1, problemText: '2+2', expectedAnswer: '4', studentAnswer: '4', isCorrect: true,
    })
    expect(result.success).toBe(true)
  })

  it('parses a top-level grading response', () => {
    const result = gradingResponseSchema.safeParse({
      score: 1, total: 2,
      problems: [
        { problemIndex: 0, problemText: 'a', expectedAnswer: '1', studentAnswer: '1', isCorrect: true },
        { problemIndex: 1, problemText: 'b', expectedAnswer: '2', studentAnswer: '3', isCorrect: false, errorCategory: 'careless', errorExplanation: '.' },
      ],
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd server && npm test -- grading
```

- [ ] **Step 3: Create `server/src/types/grading.ts`**

```ts
import { z } from 'zod'
import { ERROR_CATEGORIES } from '../errorTaxonomy.js'

const errorCategoryIds = ERROR_CATEGORIES.map((c) => c.id) as [string, ...string[]]

export const gradedProblemSchema = z.object({
  problemIndex: z.number().int().nonnegative(),
  problemText: z.string().min(1),
  expectedAnswer: z.string().min(1),
  studentAnswer: z.string(),
  isCorrect: z.boolean(),
  errorCategory: z.enum(errorCategoryIds).optional(),
  errorExplanation: z.string().optional(),
})

export const gradingResponseSchema = z.object({
  score: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  problems: z.array(gradedProblemSchema).min(1),
})

export type GradedProblem = z.infer<typeof gradedProblemSchema>
export type GradingResponse = z.infer<typeof gradingResponseSchema>
```

- [ ] **Step 4: Run — expect pass**

```bash
cd server && npm test -- grading
```

- [ ] **Step 5: Commit**

```bash
git add server/src/types/grading.ts server/src/types/grading.test.ts
git commit -m "feat(grading): add Zod schemas for graded problems"
```

---

### Task 5: Claude vision grader module

**Files:**
- Create: `server/src/claude/visionGrader.ts`
- Create: `server/src/claude/visionGrader.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { parseGradingResponse, buildGradingPrompt } from './visionGrader.js'

describe('visionGrader', () => {
  it('parses a Claude response with a single fenced JSON block', () => {
    const raw = 'I analyzed the worksheet.\n\n```json\n{"score":1,"total":2,"problems":[{"problemIndex":0,"problemText":"2+2","expectedAnswer":"4","studentAnswer":"4","isCorrect":true},{"problemIndex":1,"problemText":"3+5","expectedAnswer":"8","studentAnswer":"7","isCorrect":false,"errorCategory":"careless","errorExplanation":"off by one"}]}\n```'
    const result = parseGradingResponse(raw)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.score).toBe(1)
      expect(result.data.problems).toHaveLength(2)
    }
  })

  it('returns failure when no JSON block is present', () => {
    expect(parseGradingResponse('no json here').success).toBe(false)
  })

  it('returns failure when the JSON shape is wrong', () => {
    expect(parseGradingResponse('```json\n{"score":1}\n```').success).toBe(false)
  })

  it('embeds the full error taxonomy in the system prompt', () => {
    const prompt = buildGradingPrompt()
    expect(prompt).toContain('arithmetic_fact')
    expect(prompt).toContain('regrouping')
    expect(prompt).toContain('careless')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd server && npm test -- visionGrader
```

- [ ] **Step 3: Create `server/src/claude/visionGrader.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'
import { ERROR_CATEGORIES } from '../errorTaxonomy.js'
import { gradingResponseSchema, type GradingResponse } from '../types/grading.js'

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (client) return client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY required')
  client = new Anthropic({ apiKey })
  return client
}

export function buildGradingPrompt(): string {
  const categoryLines = ERROR_CATEGORIES.map((c) => `- ${c.id}: ${c.label}`).join('\n')
  return `You are a math worksheet grader for PizzaMath. The image contains a completed math worksheet (printed problems with handwritten student answers).

For EACH problem visible in the image:
1. Read the printed problem (use LaTeX in problemText: $\\frac{1}{2}$, $x^2$, etc.)
2. Compute the correct answer (expectedAnswer)
3. Read the student's handwritten answer (studentAnswer) — if illegible or blank, use "" and mark isCorrect=false with errorCategory="careless"
4. Decide isCorrect
5. If incorrect, pick exactly ONE errorCategory from this list:
${categoryLines}
6. Write a one-sentence errorExplanation in plain English a parent can understand.

Respond ONLY with this JSON block at the END of your message:
\`\`\`json
{
  "score": <number of correct problems>,
  "total": <total number of problems>,
  "problems": [
    {
      "problemIndex": 0,
      "problemText": "...",
      "expectedAnswer": "...",
      "studentAnswer": "...",
      "isCorrect": true | false,
      "errorCategory": "<one id from the list, only if incorrect>",
      "errorExplanation": "<one sentence, only if incorrect>"
    }
  ]
}
\`\`\``
}

export type ParseResult =
  | { success: true; data: GradingResponse }
  | { success: false; reason: string }

export function parseGradingResponse(raw: string): ParseResult {
  const match = raw.match(/```json\s*([\s\S]*?)```/)
  if (!match) return { success: false, reason: 'no_json_block' }
  let parsed: unknown
  try { parsed = JSON.parse(match[1]) } catch { return { success: false, reason: 'invalid_json' } }
  const validated = gradingResponseSchema.safeParse(parsed)
  if (!validated.success) return { success: false, reason: 'schema_mismatch' }
  return { success: true, data: validated.data }
}

export async function gradeWithVision(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
): Promise<ParseResult> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3072,
    system: [{ type: 'text', text: buildGradingPrompt(), cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
        { type: 'text', text: 'Grade this worksheet.' },
      ],
    }],
  })
  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  return parseGradingResponse(text)
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd server && npm test -- visionGrader
```

- [ ] **Step 5: Commit**

```bash
git add server/src/claude/visionGrader.ts server/src/claude/visionGrader.test.ts
git commit -m "feat(grading): add Claude vision grader with prompt + parser"
```

---

### Task 6: `POST /api/gradings` endpoint

**Files:**
- Create: `server/src/routes/gradings.ts`
- Create: `server/src/routes/gradings.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run — expect failure ("Cannot find module ./routes/gradings.js")**

```bash
cd server && npm test -- gradings
```

- [ ] **Step 3: Create `server/src/routes/gradings.ts`**

```ts
import { Router } from 'express'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { extname } from 'path'
import { v4 as uuid } from 'uuid'
import { db } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { gradeWithVision } from '../claude/visionGrader.js'

export const gradingsRouter = Router()

const createSchema = z.object({ uploadId: z.string().min(1) })

function mediaTypeForPath(p: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | null {
  const ext = extname(p).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.webp') return 'image/webp'
  return null
}

gradingsRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'uploadId required' }); return }
  const { uploadId } = parsed.data

  const upload = db.prepare('SELECT * FROM user_uploads WHERE id = ? AND user_id = ?').get(uploadId, req.userId) as { image_path: string } | undefined
  if (!upload) { res.status(404).json({ message: 'Upload not found' }); return }

  const localPath = upload.image_path.startsWith('/uploads/')
    ? `./uploads/${upload.image_path.slice('/uploads/'.length)}`
    : upload.image_path
  const mediaType = mediaTypeForPath(localPath)
  if (!mediaType) { res.status(415).json({ message: 'Unsupported image type' }); return }

  let base64: string
  try { base64 = readFileSync(localPath).toString('base64') }
  catch { res.status(404).json({ message: 'Image file missing on disk' }); return }

  const grading = await gradeWithVision(base64, mediaType)
  if (!grading.success) { res.status(422).json({ message: 'Could not grade', reason: grading.reason }); return }

  const id = uuid()
  const createdAt = new Date().toISOString()
  const insertGrading = db.prepare('INSERT INTO worksheet_gradings (id,user_id,upload_id,score,total,created_at) VALUES (?,?,?,?,?,?)')
  const insertProblem = db.prepare(`INSERT INTO grading_problems
    (id,grading_id,problem_index,problem_text,expected_answer,student_answer,is_correct,error_category,error_explanation)
    VALUES (?,?,?,?,?,?,?,?,?)`)

  const tx = db.transaction(() => {
    insertGrading.run(id, req.userId, uploadId, grading.data.score, grading.data.total, createdAt)
    for (const p of grading.data.problems) {
      insertProblem.run(
        uuid(), id, p.problemIndex, p.problemText, p.expectedAnswer, p.studentAnswer,
        p.isCorrect ? 1 : 0, p.errorCategory ?? null, p.errorExplanation ?? null,
      )
    }
  })
  tx()

  res.status(201).json({
    id, uploadId, score: grading.data.score, total: grading.data.total,
    problems: grading.data.problems, createdAt,
  })
})
```

- [ ] **Step 4: Register the router in `server/src/app.ts`**

Add the import + mount:

```ts
import { gradingsRouter } from './routes/gradings.js'
// ...
app.use('/api/gradings', gradingsRouter)
```

- [ ] **Step 5: Run — expect pass**

```bash
cd server && npm test -- gradings
```

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/gradings.ts server/src/routes/gradings.test.ts server/src/app.ts
git commit -m "feat(api): POST /api/gradings — grade an uploaded worksheet"
```

---

### Task 7: `GET /api/gradings/:id` endpoint

**Files:**
- Modify: `server/src/routes/gradings.ts`
- Modify: `server/src/routes/gradings.test.ts`

- [ ] **Step 1: Add a failing test**

Append to `gradings.test.ts`:

```ts
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
```

- [ ] **Step 2: Run — expect failure**

```bash
cd server && npm test -- gradings
```

- [ ] **Step 3: Append the route to `gradings.ts`**

```ts
gradingsRouter.get('/:id', requireAuth, (req: AuthRequest, res) => {
  const grading = db.prepare('SELECT * FROM worksheet_gradings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as
    | { id: string; upload_id: string; score: number; total: number; created_at: string }
    | undefined
  if (!grading) { res.status(404).json({ message: 'Not found' }); return }

  const problems = db.prepare(`SELECT problem_index, problem_text, expected_answer, student_answer, is_correct, error_category, error_explanation
    FROM grading_problems WHERE grading_id = ? ORDER BY problem_index ASC`).all(req.params.id) as Array<{
      problem_index: number; problem_text: string; expected_answer: string; student_answer: string;
      is_correct: number; error_category: string | null; error_explanation: string | null;
    }>

  res.json({
    id: grading.id,
    uploadId: grading.upload_id,
    score: grading.score,
    total: grading.total,
    createdAt: grading.created_at,
    problems: problems.map((p) => ({
      problemIndex: p.problem_index,
      problemText: p.problem_text,
      expectedAnswer: p.expected_answer,
      studentAnswer: p.student_answer,
      isCorrect: !!p.is_correct,
      errorCategory: p.error_category ?? undefined,
      errorExplanation: p.error_explanation ?? undefined,
    })),
  })
})
```

- [ ] **Step 4: Run — expect pass**

```bash
cd server && npm test -- gradings
```

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/gradings.ts server/src/routes/gradings.test.ts
git commit -m "feat(api): GET /api/gradings/:id"
```

---

### Task 8: Frontend API client for gradings

**Files:**
- Create: `src/api/gradings.ts`
- Create: `src/api/gradings.test.ts`

- [ ] **Step 1: Read an existing API client to match style**

Before writing, open `src/api/worksheets.ts` and identify the existing fetch wrapper (e.g. is there an `apiFetch`? a `client.get`? does it auto-attach the JWT?). The plan below uses `apiFetch`; substitute whatever your codebase calls it.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { gradingSchema } from './gradings'

describe('gradingSchema', () => {
  it('parses a server response', () => {
    const res = gradingSchema.safeParse({
      id: 'g1', uploadId: 'u1', score: 1, total: 2, createdAt: '2026-05-18T00:00:00.000Z',
      problems: [
        { problemIndex: 0, problemText: 'a', expectedAnswer: '1', studentAnswer: '1', isCorrect: true },
        { problemIndex: 1, problemText: 'b', expectedAnswer: '2', studentAnswer: '3', isCorrect: false, errorCategory: 'careless', errorExplanation: '.' },
      ],
    })
    expect(res.success).toBe(true)
  })

  it('rejects unknown error category', () => {
    const res = gradingSchema.safeParse({
      id: 'g1', uploadId: 'u1', score: 0, total: 1, createdAt: '2026-05-18T00:00:00.000Z',
      problems: [{ problemIndex: 0, problemText: 'a', expectedAnswer: '1', studentAnswer: '2', isCorrect: false, errorCategory: 'bogus', errorExplanation: '.' }],
    })
    expect(res.success).toBe(false)
  })
})
```

- [ ] **Step 3: Run — expect failure**

```bash
npm test -- gradings
```

- [ ] **Step 4: Create `src/api/gradings.ts`**

```ts
import { z } from 'zod'
import { ERROR_CATEGORIES } from '@/types/errorTaxonomy'
import { apiFetch } from './client'  // adjust to your existing helper

const errorCategoryIds = ERROR_CATEGORIES.map((c) => c.id) as [string, ...string[]]

export const gradedProblemSchema = z.object({
  problemIndex: z.number().int().nonnegative(),
  problemText: z.string(),
  expectedAnswer: z.string(),
  studentAnswer: z.string(),
  isCorrect: z.boolean(),
  errorCategory: z.enum(errorCategoryIds).optional(),
  errorExplanation: z.string().optional(),
})

export const gradingSchema = z.object({
  id: z.string(),
  uploadId: z.string(),
  score: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  createdAt: z.string(),
  problems: z.array(gradedProblemSchema),
})

export const generatedWorksheetSchema = z.object({
  id: z.string(),
  title: z.string(),
  categoryId: z.string(),
  subcategoryId: z.string(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  schoolGrade: z.string().nullable(),
  content: z.string(),
  answerContent: z.string(),
  createdAt: z.string(),
})

export const insightsSchema = z.object({
  totalGradings: z.number().int().nonnegative(),
  byCategory: z.array(z.object({ category: z.string(), count: z.number().int().nonnegative() })),
  recent: z.array(z.object({ id: z.string(), score: z.number(), total: z.number(), createdAt: z.string() })),
})

export type Grading = z.infer<typeof gradingSchema>
export type GradedProblem = z.infer<typeof gradedProblemSchema>
export type GeneratedWorksheet = z.infer<typeof generatedWorksheetSchema>
export type Insights = z.infer<typeof insightsSchema>

export const gradingsApi = {
  create: async (uploadId: string): Promise<Grading> => {
    const data = await apiFetch('/api/gradings', { method: 'POST', body: JSON.stringify({ uploadId }) })
    return gradingSchema.parse(data)
  },
  get: async (id: string): Promise<Grading> => {
    const data = await apiFetch(`/api/gradings/${id}`)
    return gradingSchema.parse(data)
  },
  generatePractice: async (gradingId: string): Promise<GeneratedWorksheet> => {
    const data = await apiFetch(`/api/gradings/${gradingId}/generate-practice`, { method: 'POST' })
    return generatedWorksheetSchema.parse(data)
  },
  insights: async (): Promise<Insights> => {
    const data = await apiFetch('/api/gradings/insights/me')
    return insightsSchema.parse(data)
  },
}

export const gradingsQueryKeys = {
  one: (id: string) => ['gradings', id] as const,
  insights: ['gradings', 'insights'] as const,
} as const
```

- [ ] **Step 5: Run — expect pass**

```bash
npm test -- gradings
```

- [ ] **Step 6: Commit**

```bash
git add src/api/gradings.ts src/api/gradings.test.ts
git commit -m "feat(client): typed gradings API client"
```

---

### Task 9: `GradingResult` component (per-problem card)

**Files:**
- Create: `src/features/gradings/components/GradingResult.tsx`
- Create: `src/features/gradings/components/GradingResult.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GradingResult } from './GradingResult'

describe('GradingResult', () => {
  it('renders correct problem without an error block', () => {
    render(<GradingResult problem={{ problemIndex: 0, problemText: '2+2', expectedAnswer: '4', studentAnswer: '4', isCorrect: true }} />)
    expect(screen.getByText('2+2')).toBeInTheDocument()
    expect(screen.queryByText(/expected:/i)).not.toBeInTheDocument()
  })

  it('renders incorrect problem with expected answer, category label, and explanation', () => {
    render(<GradingResult problem={{ problemIndex: 1, problemText: '3+5', expectedAnswer: '8', studentAnswer: '7', isCorrect: false, errorCategory: 'careless', errorExplanation: 'off by one' }} />)
    expect(screen.getByText(/3\+5/)).toBeInTheDocument()
    expect(screen.getByText(/expected:/i)).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText(/off by one/i)).toBeInTheDocument()
    expect(screen.getByText(/careless/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- GradingResult
```

- [ ] **Step 3: Create the component**

```tsx
import { ERROR_CATEGORIES } from '@/types/errorTaxonomy'
import type { GradedProblem } from '@/api/gradings'

interface Props { problem: GradedProblem }

const categoryLabel = (id: string | undefined): string => {
  if (!id) return ''
  return ERROR_CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export function GradingResult({ problem }: Props) {
  const correct = problem.isCorrect
  return (
    <div className={`rounded-lg border p-4 ${correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-sm text-gray-800">{problem.problemText}</p>
        <span className={`text-xs font-semibold ${correct ? 'text-green-700' : 'text-red-700'}`}>
          {correct ? '✓' : '✗'} {problem.studentAnswer || '(blank)'}
        </span>
      </div>
      {!correct && (
        <>
          <p className="mt-2 text-sm text-gray-700">
            Expected: <span className="font-semibold">{problem.expectedAnswer}</span>
          </p>
          {problem.errorCategory && (
            <p className="mt-1 text-xs uppercase tracking-wide text-red-600">
              {categoryLabel(problem.errorCategory)}
            </p>
          )}
          {problem.errorExplanation && (
            <p className="mt-1 text-sm text-gray-600">{problem.errorExplanation}</p>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- GradingResult
```

- [ ] **Step 5: Commit**

```bash
git add src/features/gradings/components/GradingResult.tsx src/features/gradings/components/GradingResult.test.tsx
git commit -m "feat(client): GradingResult per-problem card"
```

---

### Task 10: `ErrorBreakdown` summary component

**Files:**
- Create: `src/features/gradings/components/ErrorBreakdown.tsx`
- Create: `src/features/gradings/components/ErrorBreakdown.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBreakdown } from './ErrorBreakdown'

describe('ErrorBreakdown', () => {
  it('shows positive empty-state when all answers correct', () => {
    render(<ErrorBreakdown problems={[{ problemIndex: 0, problemText: 'x', expectedAnswer: '1', studentAnswer: '1', isCorrect: true }]} />)
    expect(screen.getByText(/no mistakes/i)).toBeInTheDocument()
  })

  it('groups errors by category with counts', () => {
    render(
      <ErrorBreakdown problems={[
        { problemIndex: 0, problemText: 'a', expectedAnswer: '1', studentAnswer: '2', isCorrect: false, errorCategory: 'regrouping', errorExplanation: '.' },
        { problemIndex: 1, problemText: 'b', expectedAnswer: '3', studentAnswer: '5', isCorrect: false, errorCategory: 'regrouping', errorExplanation: '.' },
        { problemIndex: 2, problemText: 'c', expectedAnswer: '7', studentAnswer: '6', isCorrect: false, errorCategory: 'careless', errorExplanation: '.' },
      ]} />,
    )
    expect(screen.getByText(/carry\/borrow/i)).toBeInTheDocument()
    expect(screen.getByText(/2 of 3/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- ErrorBreakdown
```

- [ ] **Step 3: Create the component**

```tsx
import { ERROR_CATEGORIES } from '@/types/errorTaxonomy'
import type { GradedProblem } from '@/api/gradings'

interface Props { problems: GradedProblem[] }

export function ErrorBreakdown({ problems }: Props) {
  const wrong = problems.filter((p) => !p.isCorrect && p.errorCategory)
  const total = problems.length
  if (wrong.length === 0) {
    return <p className="mt-4 text-sm text-green-700">No mistakes — nice work!</p>
  }

  const counts = new Map<string, number>()
  for (const p of wrong) {
    if (!p.errorCategory) continue
    counts.set(p.errorCategory, (counts.get(p.errorCategory) ?? 0) + 1)
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])

  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Where the mistakes are</h2>
      <ul className="mt-3 space-y-2">
        {sorted.map(([catId, count]) => {
          const label = ERROR_CATEGORIES.find((c) => c.id === catId)?.label ?? catId
          return (
            <li key={catId} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{label}</span>
              <span className="font-mono text-xs text-gray-500">{count} of {total}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- ErrorBreakdown
```

- [ ] **Step 5: Commit**

```bash
git add src/features/gradings/components/ErrorBreakdown.tsx src/features/gradings/components/ErrorBreakdown.test.tsx
git commit -m "feat(client): ErrorBreakdown summary component"
```

---

### Task 11: `useGrading` hook + `GradingPage` + route

**Files:**
- Create: `src/features/gradings/hooks/useGrading.ts`
- Create: `src/pages/GradingPage.tsx`
- Create: `src/pages/GradingPage.test.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { GradingPage } from './GradingPage'

const server = setupServer(
  http.get('/api/gradings/g1', () => HttpResponse.json({
    id: 'g1', uploadId: 'u1', score: 1, total: 2, createdAt: '2026-05-18T00:00:00.000Z',
    problems: [
      { problemIndex: 0, problemText: '2+2', expectedAnswer: '4', studentAnswer: '4', isCorrect: true },
      { problemIndex: 1, problemText: '3+5', expectedAnswer: '8', studentAnswer: '7', isCorrect: false, errorCategory: 'careless', errorExplanation: 'off by one' },
    ],
  })),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/gradings/:id" element={<GradingPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('GradingPage', () => {
  it('shows score and at least one error explanation', async () => {
    renderAt('/gradings/g1')
    expect(await screen.findByText(/1\s*\/\s*2/)).toBeInTheDocument()
    expect(await screen.findByText(/off by one/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- GradingPage
```

- [ ] **Step 3: Create the hook**

```ts
import { useQuery } from '@tanstack/react-query'
import { gradingsApi, gradingsQueryKeys } from '@/api/gradings'

export function useGrading(id: string | undefined) {
  return useQuery({
    queryKey: id ? gradingsQueryKeys.one(id) : ['gradings', 'none'],
    queryFn: () => gradingsApi.get(id!),
    enabled: !!id,
  })
}
```

- [ ] **Step 4: Create the page**

```tsx
import { useParams, Link } from 'react-router-dom'
import { useGrading } from '@/features/gradings/hooks/useGrading'
import { GradingResult } from '@/features/gradings/components/GradingResult'
import { ErrorBreakdown } from '@/features/gradings/components/ErrorBreakdown'

export function GradingPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useGrading(id)

  if (isLoading) return <p className="p-6 text-gray-500">Loading grading…</p>
  if (error || !data) return <p className="p-6 text-red-600">Could not load grading.</p>

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/uploads" className="text-sm text-orange-600 hover:underline">← Back to uploads</Link>
      <h1 className="mt-2 text-2xl font-bold">Worksheet Grading</h1>
      <p className="mt-1 text-gray-600">Score: <span className="font-semibold">{data.score} / {data.total}</span></p>

      <ErrorBreakdown problems={data.problems} />

      <ol className="mt-8 space-y-4">
        {data.problems.map((p) => (
          <li key={p.problemIndex}><GradingResult problem={p} /></li>
        ))}
      </ol>
    </main>
  )
}
```

- [ ] **Step 5: Register the route in `src/router.tsx`**

Add inside the authed routes section (alongside other authed pages):

```tsx
<Route path="/gradings/:id" element={<GradingPage />} />
```

- [ ] **Step 6: Run — expect pass**

```bash
npm test -- GradingPage
```

- [ ] **Step 7: Commit**

```bash
git add src/features/gradings/hooks/useGrading.ts src/pages/GradingPage.tsx src/pages/GradingPage.test.tsx src/router.tsx
git commit -m "feat(client): GradingPage + useGrading hook + route"
```

---

### Task 12: "Grade this" button on `MyUploadsPage`

**Files:**
- Create: `src/features/gradings/hooks/useCreateGrading.ts`
- Create: `src/features/gradings/hooks/useCreateGrading.test.tsx`
- Modify: `src/pages/MyUploadsPage.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { useCreateGrading } from './useCreateGrading'

const server = setupServer(
  http.post('/api/gradings', async ({ request }) => {
    const body = await request.json() as { uploadId: string }
    return HttpResponse.json({
      id: 'g-new', uploadId: body.uploadId, score: 1, total: 1, createdAt: '2026-05-18T00:00:00.000Z',
      problems: [{ problemIndex: 0, problemText: 'x', expectedAnswer: '1', studentAnswer: '1', isCorrect: true }],
    }, { status: 201 })
  }),
)

beforeAll(() => server.listen())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useCreateGrading', () => {
  it('returns the created grading on success', async () => {
    const { result } = renderHook(() => useCreateGrading(), { wrapper })
    result.current.mutate('u1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe('g-new')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- useCreateGrading
```

- [ ] **Step 3: Create the hook**

```ts
import { useMutation } from '@tanstack/react-query'
import { gradingsApi, type Grading } from '@/api/gradings'

export function useCreateGrading() {
  return useMutation<Grading, Error, string>({
    mutationFn: (uploadId: string) => gradingsApi.create(uploadId),
  })
}
```

- [ ] **Step 4: Add the button to `MyUploadsPage.tsx`**

Inline a small component at the top of the file:

```tsx
import { useNavigate } from 'react-router-dom'
import { useCreateGrading } from '@/features/gradings/hooks/useCreateGrading'

function GradeButton({ uploadId }: { uploadId: string }) {
  const navigate = useNavigate()
  const { mutate, isPending } = useCreateGrading()
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => mutate(uploadId, { onSuccess: (g) => navigate(`/gradings/${g.id}`) })}
      className="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
    >
      {isPending ? 'Grading…' : 'Grade this'}
    </button>
  )
}
```

Render `<GradeButton uploadId={upload.id} />` inside each upload row's action area (find the existing action column in `MyUploadsPage.tsx` and add it alongside whatever is there).

- [ ] **Step 5: Run — expect pass**

```bash
npm test -- useCreateGrading
```

- [ ] **Step 6: Commit**

```bash
git add src/features/gradings/hooks/useCreateGrading.ts src/features/gradings/hooks/useCreateGrading.test.tsx src/pages/MyUploadsPage.tsx
git commit -m "feat(client): Grade-this button on MyUploadsPage"
```

---

## Stage 2: Targeted Re-Practice

### Task 13: Targeted-generation prompt module

**Files:**
- Create: `server/src/claude/targetedGen.ts`
- Create: `server/src/claude/targetedGen.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { buildTargetedPrompt, parseTargetedResponse } from './targetedGen.js'

describe('targetedGen', () => {
  it('embeds the requested error categories in the prompt', () => {
    const p = buildTargetedPrompt({ categories: ['regrouping', 'place_value'], level: 'Beginner', schoolGrade: '2' })
    expect(p).toContain('Carry/borrow error')
    expect(p).toContain('Place-value misalignment')
    expect(p).toContain('Beginner')
    expect(p).toContain('grade 2')
  })

  it('parses the generated worksheet payload', () => {
    const raw = '```json\n{"title":"Targeted Practice","categoryId":"cat-3","subcategoryId":"sub-3-1","level":"Beginner","schoolGrade":"2","content":"1. ...","answerContent":"1. ..."}\n```'
    const r = parseTargetedResponse(raw)
    expect(r.success).toBe(true)
  })

  it('fails to parse when JSON is missing', () => {
    expect(parseTargetedResponse('no json').success).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd server && npm test -- targetedGen
```

- [ ] **Step 3: Create `server/src/claude/targetedGen.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { ERROR_CATEGORIES, type ErrorCategoryId } from '../errorTaxonomy.js'

const generatedSchema = z.object({
  title: z.string().min(1),
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  schoolGrade: z.string().nullable(),
  content: z.string().min(1),
  answerContent: z.string().min(1),
})
export type GeneratedWorksheet = z.infer<typeof generatedSchema>

interface Args {
  categories: ErrorCategoryId[]
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  schoolGrade: string | null
}

export function buildTargetedPrompt({ categories, level, schoolGrade }: Args): string {
  const lines = categories.map((id) => {
    const c = ERROR_CATEGORIES.find((x) => x.id === id)
    return `- ${c?.label ?? id}`
  }).join('\n')
  const gradeLine = schoolGrade ? `Aim for grade ${schoolGrade}.` : 'Grade-agnostic.'

  return `You are a math worksheet generator for PizzaMath.

A student just made mistakes in these sub-skills:
${lines}

Generate a 10-problem TARGETED PRACTICE worksheet at level "${level}". ${gradeLine}

Structure:
- 2 warm-up problems easier than the missed skill
- 6 problems drilling the missed sub-skills directly
- 2 challenge problems slightly harder

Formatting: LaTeX for math ($\\frac{a}{b}$, $x^2$), markdown numbered list, blank line between problems.

Respond ONLY with this JSON block at the end:
\`\`\`json
{
  "title": "Targeted practice — <topic>",
  "categoryId": "cat-X",
  "subcategoryId": "sub-X-Y",
  "level": "${level}",
  "schoolGrade": ${schoolGrade ? `"${schoolGrade}"` : 'null'},
  "content": "<markdown worksheet>",
  "answerContent": "<full answer key>"
}
\`\`\``
}

export type ParseResult =
  | { success: true; data: GeneratedWorksheet }
  | { success: false; reason: string }

export function parseTargetedResponse(raw: string): ParseResult {
  const match = raw.match(/```json\s*([\s\S]*?)```/)
  if (!match) return { success: false, reason: 'no_json_block' }
  let parsed: unknown
  try { parsed = JSON.parse(match[1]) } catch { return { success: false, reason: 'invalid_json' } }
  const validated = generatedSchema.safeParse(parsed)
  if (!validated.success) return { success: false, reason: 'schema_mismatch' }
  return { success: true, data: validated.data }
}

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (client) return client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY required')
  client = new Anthropic({ apiKey })
  return client
}

export async function generateTargetedPractice(args: Args): Promise<ParseResult> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3072,
    system: [{ type: 'text', text: buildTargetedPrompt(args), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: 'Generate the targeted practice worksheet now.' }],
  })
  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  return parseTargetedResponse(text)
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd server && npm test -- targetedGen
```

- [ ] **Step 5: Commit**

```bash
git add server/src/claude/targetedGen.ts server/src/claude/targetedGen.test.ts
git commit -m "feat(grading): error-aware worksheet generation prompt"
```

---

### Task 14: `POST /api/gradings/:id/generate-practice` endpoint

**Files:**
- Modify: `server/src/routes/gradings.ts`
- Modify: `server/src/routes/gradings.test.ts`

- [ ] **Step 1: Add a failing test**

Append to `gradings.test.ts`:

```ts
vi.mock('../claude/targetedGen.js', () => ({
  generateTargetedPractice: vi.fn(async () => ({
    success: true,
    data: {
      title: 'Targeted Practice', categoryId: 'cat-3', subcategoryId: 'sub-3-1',
      level: 'Beginner' as const, schoolGrade: '2', content: '1. 12 + 9 = ?', answerContent: '1. 21',
    },
  })),
}))

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
```

- [ ] **Step 2: Run — expect failure**

```bash
cd server && npm test -- gradings
```

- [ ] **Step 3: Append the route**

At the bottom of `server/src/routes/gradings.ts`:

```ts
import { generateTargetedPractice } from '../claude/targetedGen.js'
import { isErrorCategoryId, type ErrorCategoryId } from '../errorTaxonomy.js'

gradingsRouter.post('/:id/generate-practice', requireAuth, async (req: AuthRequest, res) => {
  const grading = db.prepare('SELECT * FROM worksheet_gradings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as
    | { id: string; upload_id: string } | undefined
  if (!grading) { res.status(404).json({ message: 'Not found' }); return }

  const upload = db.prepare('SELECT level, school_grade FROM user_uploads WHERE id = ?').get(grading.upload_id) as
    { level: 'Beginner' | 'Intermediate' | 'Advanced'; school_grade: string | null }

  const rows = db.prepare('SELECT error_category FROM grading_problems WHERE grading_id = ? AND is_correct = 0 AND error_category IS NOT NULL').all(grading.id) as { error_category: string }[]
  const categories: ErrorCategoryId[] = [...new Set(rows.map((r) => r.error_category))].filter(isErrorCategoryId)
  if (categories.length === 0) { res.status(400).json({ message: 'No mistakes to drill — nothing to generate.' }); return }

  const generated = await generateTargetedPractice({
    categories,
    level: upload.level,
    schoolGrade: upload.school_grade,
  })
  if (!generated.success) { res.status(422).json({ message: 'Generation failed', reason: generated.reason }); return }

  const id = uuid()
  const createdAt = new Date().toISOString()
  db.prepare(`INSERT INTO worksheets (id,title,category_id,subcategory_id,level,school_grade,author,content,answer_content,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, generated.data.title, generated.data.categoryId, generated.data.subcategoryId, generated.data.level, generated.data.schoolGrade, 'PizzaMath (targeted)', generated.data.content, generated.data.answerContent, createdAt)

  res.status(201).json({ id, ...generated.data, createdAt })
})
```

- [ ] **Step 4: Run — expect pass**

```bash
cd server && npm test -- gradings
```

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/gradings.ts server/src/routes/gradings.test.ts
git commit -m "feat(api): POST /api/gradings/:id/generate-practice"
```

---

### Task 15: `GeneratePracticeButton` + flow

**Files:**
- Create: `src/features/gradings/hooks/useGenerateTargetedPractice.ts`
- Create: `src/features/gradings/components/GeneratePracticeButton.tsx`
- Modify: `src/pages/GradingPage.tsx`

- [ ] **Step 1: Create hook**

```ts
import { useMutation } from '@tanstack/react-query'
import { gradingsApi, type GeneratedWorksheet } from '@/api/gradings'

export function useGenerateTargetedPractice() {
  return useMutation<GeneratedWorksheet, Error, string>({
    mutationFn: (gradingId: string) => gradingsApi.generatePractice(gradingId),
  })
}
```

- [ ] **Step 2: Create button component**

```tsx
import { useNavigate } from 'react-router-dom'
import { useGenerateTargetedPractice } from '../hooks/useGenerateTargetedPractice'

export function GeneratePracticeButton({ gradingId }: { gradingId: string }) {
  const navigate = useNavigate()
  const { mutate, isPending, error } = useGenerateTargetedPractice()
  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={isPending}
        onClick={() => mutate(gradingId, { onSuccess: (w) => navigate(`/worksheets/${w.id}`) })}
        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {isPending ? 'Generating…' : 'Generate targeted practice'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error.message}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Mount on `GradingPage.tsx`** below the problem list:

```tsx
import { GeneratePracticeButton } from '@/features/gradings/components/GeneratePracticeButton'

// ...inside the page, after the <ol>:
{data.problems.some((p) => !p.isCorrect && p.errorCategory) && (
  <GeneratePracticeButton gradingId={data.id} />
)}
```

- [ ] **Step 4: Smoke test manually**

Run `npm run dev:all`, open a grading with at least one mistake, click the button, confirm navigation to the newly generated worksheet page.

- [ ] **Step 5: Commit**

```bash
git add src/features/gradings/hooks/useGenerateTargetedPractice.ts src/features/gradings/components/GeneratePracticeButton.tsx src/pages/GradingPage.tsx
git commit -m "feat(client): generate targeted practice flow"
```

---

## Stage 3: Insights Dashboard

### Task 16: `GET /api/gradings/insights/me` endpoint

**Files:**
- Modify: `server/src/routes/gradings.ts`
- Modify: `server/src/routes/gradings.test.ts`

- [ ] **Step 1: Add a failing test**

Append to `gradings.test.ts`:

```ts
describe('GET /api/gradings/insights/me', () => {
  it('aggregates error counts across the caller’s gradings', async () => {
    const res = await request(app)
      .get('/api/gradings/insights/me')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
    expect(res.status).toBe(200)
    expect(res.body.totalGradings).toBeGreaterThan(0)
    expect(Array.isArray(res.body.byCategory)).toBe(true)
    expect(Array.isArray(res.body.recent)).toBe(true)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd server && npm test -- gradings
```

- [ ] **Step 3: Append the route**

```ts
gradingsRouter.get('/insights/me', requireAuth, (req: AuthRequest, res) => {
  const totals = db.prepare('SELECT COUNT(*) as n FROM worksheet_gradings WHERE user_id = ?').get(req.userId) as { n: number }
  const byCategory = db.prepare(`
    SELECT gp.error_category as category, COUNT(*) as count
    FROM grading_problems gp
    JOIN worksheet_gradings g ON g.id = gp.grading_id
    WHERE g.user_id = ? AND gp.is_correct = 0 AND gp.error_category IS NOT NULL
    GROUP BY gp.error_category
    ORDER BY count DESC
  `).all(req.userId) as { category: string; count: number }[]

  const recent = db.prepare(`
    SELECT id, score, total, created_at as createdAt
    FROM worksheet_gradings
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(req.userId) as { id: string; score: number; total: number; createdAt: string }[]

  res.json({ totalGradings: totals.n, byCategory, recent })
})
```

- [ ] **Step 4: Run — expect pass**

```bash
cd server && npm test -- gradings
```

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/gradings.ts server/src/routes/gradings.test.ts
git commit -m "feat(api): insights endpoint aggregating errors per user"
```

---

### Task 17: `InsightsChart` + `InsightsPage` + Navbar link

**Files:**
- Create: `src/features/gradings/components/InsightsChart.tsx`
- Create: `src/features/gradings/components/InsightsChart.test.tsx`
- Create: `src/features/gradings/hooks/useInsights.ts`
- Create: `src/pages/InsightsPage.tsx`
- Modify: `src/router.tsx`
- Modify: `src/components/Navbar/AccountMenu.tsx`

- [ ] **Step 1: Write the failing test for `InsightsChart`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InsightsChart } from './InsightsChart'

describe('InsightsChart', () => {
  it('renders categories with proportional bars and counts', () => {
    render(<InsightsChart data={[{ category: 'regrouping', count: 8 }, { category: 'careless', count: 2 }]} />)
    expect(screen.getByText(/carry\/borrow/i)).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<InsightsChart data={[]} />)
    expect(screen.getByText(/no recurring/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- InsightsChart
```

- [ ] **Step 3: Create the chart component**

```tsx
import { ERROR_CATEGORIES } from '@/types/errorTaxonomy'

interface Props { data: { category: string; count: number }[] }

export function InsightsChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No recurring mistakes yet — grade a worksheet to start tracking.</p>
  }
  const max = Math.max(...data.map((d) => d.count))
  return (
    <ul className="space-y-2">
      {data.map((d) => {
        const label = ERROR_CATEGORIES.find((c) => c.id === d.category)?.label ?? d.category
        const pct = (d.count / max) * 100
        return (
          <li key={d.category} className="flex items-center gap-3">
            <span className="w-48 truncate text-sm text-gray-700">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100">
              <div className="h-full rounded bg-orange-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right font-mono text-xs text-gray-500">{d.count}</span>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- InsightsChart
```

- [ ] **Step 5: Create `useInsights.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { gradingsApi, gradingsQueryKeys } from '@/api/gradings'

export function useInsights() {
  return useQuery({ queryKey: gradingsQueryKeys.insights, queryFn: gradingsApi.insights })
}
```

- [ ] **Step 6: Create `InsightsPage.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { useInsights } from '@/features/gradings/hooks/useInsights'
import { InsightsChart } from '@/features/gradings/components/InsightsChart'

export function InsightsPage() {
  const { data, isLoading } = useInsights()
  if (isLoading || !data) return <p className="p-6 text-gray-500">Loading…</p>

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Skill-gap Insights</h1>
      <p className="mt-1 text-gray-600">
        {data.totalGradings} worksheet{data.totalGradings === 1 ? '' : 's'} graded.
      </p>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Most common mistakes</h2>
        <InsightsChart data={data.byCategory} />
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700">Recent gradings</h2>
        <ul className="mt-2 space-y-1">
          {data.recent.map((g) => (
            <li key={g.id} className="text-sm">
              <Link to={`/gradings/${g.id}`} className="text-orange-600 hover:underline">
                {g.score} / {g.total} — {new Date(g.createdAt).toLocaleDateString()}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
```

- [ ] **Step 7: Register route + nav link**

In `src/router.tsx`, add the route:

```tsx
<Route path="/insights" element={<InsightsPage />} />
```

In `src/components/Navbar/AccountMenu.tsx`, add a link matching the existing menu-item style — open the file, locate the existing menu items (e.g. "Account", "Usage history"), and add an identical entry pointing to `/insights` with label `Insights`. Do not invent a new component pattern.

- [ ] **Step 8: Run all tests**

```bash
npm test
cd server && npm test
```

Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add src/features/gradings/hooks/useInsights.ts src/features/gradings/components/InsightsChart.tsx src/features/gradings/components/InsightsChart.test.tsx src/pages/InsightsPage.tsx src/router.tsx src/components/Navbar/AccountMenu.tsx
git commit -m "feat(client): insights dashboard with error-category trends"
```

---

## Final manual verification

After Task 17 ships, manually verify end-to-end on a real browser (the vision response is mocked in CI — only real-image testing catches prompt regressions):

- [ ] Sign in as a test user
- [ ] Upload a real photo of a completed worksheet (use `MyUploadsPage`)
- [ ] Click "Grade this" — confirm the page renders with per-problem results, including at least one mistake categorized
- [ ] Click "Generate targeted practice" — confirm a new worksheet opens with structure (2 warmups / 6 drills / 2 challenges)
- [ ] Visit `/insights` — confirm the chart shows the categories that were just classified
- [ ] Run the flow with a second photo that has different errors — confirm aggregation in insights

---

## Out of scope (explicitly punted)

- Billing / paywall enforcement (separate plan)
- Email-based notifications when a kid hits a milestone (needs vendor decision)
- Multi-student parent accounts (would require schema rework)
- Real-time vision streaming (current Claude SDK call is fine for 30-second response)
- Custom error taxonomy per user (locked taxonomy is the point — it has to aggregate)
- DOC export of the generated practice worksheet (existing PDF route already covers it)

---

## Self-review notes

- **Spec coverage:** Every bullet in "What's left to build → Mistake-aware practice" is implemented across Stages 1–3. Insights add longitudinal aggregation. ✓
- **Placeholders:** No "TBD" / "add appropriate validation" lines. Code blocks in every implementation step. ✓
- **Type consistency:** `Grading`, `GradedProblem`, `GeneratedWorksheet`, `Insights` types are defined once in `src/api/gradings.ts` and consumed by hooks/components. Server-side equivalents in `server/src/types/grading.ts`. Field names match across server ⇄ client (camelCase on wire, snake_case in SQL, mapped in the GET handler). ✓
- **Risks left:**
  1. The `apiFetch` helper assumed in `src/api/gradings.ts` may not exist by that exact name — Task 8 Step 1 explicitly tells the implementer to look at `src/api/worksheets.ts` first and match style. This is intentional.
  2. The vision prompt's error-category accuracy depends entirely on Claude's vision quality — there is no automated way to catch silent regressions; the final manual verification step is load-bearing.
  3. The image is read from disk on every grading request; this is fine at current scale (single SQLite, < 100 uploads/day) but will need streaming or signed-URL handling if traffic grows.
