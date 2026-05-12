import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../../data')
mkdirSync(DATA_DIR, { recursive: true })

export const db = new Database(join(DATA_DIR, 'pizzamath.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    account_status TEXT NOT NULL DEFAULT 'active',
    subscription_status TEXT NOT NULL DEFAULT 'inactive',
    subscription_plan TEXT,
    subscription_expires_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grades TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subcategories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS worksheets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category_id TEXT NOT NULL,
    subcategory_id TEXT NOT NULL,
    level TEXT NOT NULL,
    school_grade TEXT,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    answer_content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS progress_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    worksheet_id TEXT NOT NULL,
    worksheet_title TEXT NOT NULL,
    date TEXT NOT NULL,
    score REAL NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_uploads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category_id TEXT NOT NULL,
    subcategory_id TEXT NOT NULL,
    level TEXT NOT NULL,
    school_grade TEXT,
    content TEXT NOT NULL,
    answer_content TEXT NOT NULL,
    image_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`)

// ── Seed (idempotent) ────────────────────────────────────────────────────────

function seedOnce() {
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('abc@abc.co')
  if (adminExists) return

  // Admin user
  const adminHash = bcrypt.hashSync('liniLINI123', 10)
  db.prepare(`
    INSERT INTO users (id,email,password_hash,role,account_status,subscription_status,subscription_plan,subscription_expires_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run('admin-1', 'abc@abc.co', adminHash, 'admin', 'active', 'active', 'annual', '2099-12-31', new Date().toISOString())

  // Categories & subcategories
  const categorySeed: Array<{ id: string; name: string; grades: string; subcategories: string[] }> = [
    { id: 'cat-1',  name: 'Counting & Cardinality',           grades: 'K',    subcategories: ['Know number names and the count sequence', 'Count to tell the number of objects', 'Compare numbers'] },
    { id: 'cat-2',  name: 'Operations & Algebraic Thinking',  grades: 'K–5',  subcategories: ['Understand addition and subtraction', 'Represent and solve addition/subtraction problems', 'Multiply and divide within 100', 'Solve problems using the four operations', 'Generate and analyze patterns'] },
    { id: 'cat-3',  name: 'Number & Operations in Base Ten',  grades: 'K–5',  subcategories: ['Work with numbers 11–19', 'Understand place value', 'Use place value understanding', 'Generalize place value understanding'] },
    { id: 'cat-4',  name: 'Number & Operations — Fractions',  grades: '3–5',  subcategories: ['Develop understanding of fractions', 'Extend understanding of fraction equivalence', 'Build fractions from unit fractions', 'Apply understanding of multiplication and division to fractions'] },
    { id: 'cat-5',  name: 'Measurement & Data',               grades: 'K–5',  subcategories: ['Describe and compare measurable attributes', 'Classify objects and count', 'Measure lengths indirectly', 'Represent and interpret data', 'Geometric measurement'] },
    { id: 'cat-6',  name: 'Geometry',                         grades: 'K–12', subcategories: ['Identify and describe shapes', 'Analyze and compare shapes', 'Draw and identify lines and angles', 'Congruence', 'Similarity', 'Trigonometry', 'Modeling with geometry'] },
    { id: 'cat-7',  name: 'Ratios & Proportional Relationships', grades: '6–7', subcategories: ['Understand ratio concepts', 'Analyze proportional relationships'] },
    { id: 'cat-8',  name: 'The Number System',                grades: '6–8',  subcategories: ['Apply fraction division', 'Compute with multi-digit numbers', 'Apply properties of operations', 'Know real numbers'] },
    { id: 'cat-9',  name: 'Expressions & Equations',          grades: '6–8',  subcategories: ['Apply properties of operations to expressions', 'Reason about one-variable equations', 'Represent and analyze quantitative relationships', 'Work with radicals and integer exponents', 'Understand connections between proportional and linear relationships'] },
    { id: 'cat-10', name: 'Functions',                        grades: '8–12', subcategories: ['Define, evaluate, and compare functions', 'Use functions to model relationships', 'Interpret functions', 'Build new functions from existing functions'] },
    { id: 'cat-11', name: 'Statistics & Probability',         grades: '6–12', subcategories: ['Develop understanding of statistical variability', 'Summarize and describe distributions', 'Investigate patterns of association', 'Interpret linear models', 'Use probability rules'] },
    { id: 'cat-12', name: 'Number & Quantity',                grades: '9–12', subcategories: ['Extend properties of exponents', 'Reason quantitatively with units', 'Perform operations with complex numbers', 'Represent and model with vector quantities'] },
    { id: 'cat-13', name: 'Algebra',                          grades: '9–12', subcategories: ['Interpret the structure of expressions', 'Write expressions in equivalent forms', 'Perform arithmetic on polynomials', 'Create equations', 'Understand solving equations', 'Represent and solve equations graphically'] },
    { id: 'cat-14', name: 'Modeling',                        grades: '9–12', subcategories: ['Apply mathematics to real-world problems', 'Interpret mathematical results in context'] },
  ]

  const insertCat = db.prepare('INSERT INTO categories (id,name,grades) VALUES (?,?,?)')
  const insertSub = db.prepare('INSERT INTO subcategories (id,name,category_id) VALUES (?,?,?)')

  categorySeed.forEach((cat, ci) => {
    insertCat.run(cat.id, cat.name, cat.grades)
    cat.subcategories.forEach((name, si) => {
      insertSub.run(`sub-${ci + 1}-${si + 1}`, name, cat.id)
    })
  })

  // Sample worksheets
  const insertWs = db.prepare(`
    INSERT INTO worksheets (id,title,category_id,subcategory_id,level,school_grade,author,content,answer_content,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `)
  const now = new Date().toISOString()

  const worksheets = [
    { id: 'ws-1', title: 'Counting Objects 1–10', categoryId: 'cat-1', subcategoryId: 'sub-1-2', level: 'Beginner', grade: 'K', content: '## Counting Objects 1–10\n\nCount the objects in each box and write the number.\n\n1. 🍕🍕🍕 = ___\n2. 🍎🍎🍎🍎🍎 = ___\n3. ⭐⭐ = ___\n4. 🐶🐶🐶🐶 = ___\n5. 🌸🌸🌸🌸🌸🌸🌸 = ___', answer: '1. 3\n2. 5\n3. 2\n4. 4\n5. 7' },
    { id: 'ws-2', title: 'Addition within 20', categoryId: 'cat-2', subcategoryId: 'sub-2-1', level: 'Beginner', grade: '1', content: '## Addition within 20\n\nSolve each addition problem.\n\n1. 3 + 4 = ___\n2. 7 + 5 = ___\n3. 9 + 8 = ___\n4. 6 + 6 = ___\n5. 11 + 7 = ___', answer: '1. 7\n2. 12\n3. 17\n4. 12\n5. 18' },
    { id: 'ws-3', title: 'Introduction to Fractions', categoryId: 'cat-4', subcategoryId: 'sub-4-1', level: 'Intermediate', grade: '3', content: '## Introduction to Fractions\n\nWrite the fraction for the shaded part.\n\n1. A pizza cut into 4 equal slices, you eat 1. What fraction did you eat? ___\n2. A rectangle divided into 3 equal parts, 2 are shaded. What fraction is shaded? ___\n3. A circle split into 8 equal parts, 3 are colored. What fraction is colored? ___', answer: '1. 1/4\n2. 2/3\n3. 3/8' },
  ]

  worksheets.forEach((w) => {
    insertWs.run(w.id, w.title, w.categoryId, w.subcategoryId, w.level, w.grade, 'PizzaMath', w.content, w.answer, now)
  })
}

seedOnce()

// ── Typed query helpers ──────────────────────────────────────────────────────

export interface UserRow {
  id: string
  email: string
  password_hash: string
  role: string
  account_status: string
  subscription_status: string
  subscription_plan: string | null
  subscription_expires_at: string | null
  created_at: string
}

export interface WorksheetRow {
  id: string
  title: string
  category_id: string
  subcategory_id: string
  level: string
  school_grade: string | null
  author: string
  content: string
  answer_content: string
  created_at: string
}

export interface UploadRow {
  id: string
  user_id: string
  title: string
  category_id: string
  subcategory_id: string
  level: string
  school_grade: string | null
  content: string
  answer_content: string
  image_path: string
  created_at: string
}

export function worksheetToDto(w: WorksheetRow) {
  return {
    id: w.id,
    title: w.title,
    categoryId: w.category_id,
    subcategoryId: w.subcategory_id,
    level: w.level,
    schoolGrade: w.school_grade,
    author: w.author,
    content: w.content,
    answerSheet: { id: `ans-${w.id}`, worksheetId: w.id, content: w.answer_content },
    createdAt: w.created_at,
  }
}

export function uploadToDto(u: UploadRow, imageBaseUrl: string) {
  return {
    id: u.id,
    userId: u.user_id,
    title: u.title,
    categoryId: u.category_id,
    subcategoryId: u.subcategory_id,
    level: u.level,
    schoolGrade: u.school_grade,
    content: u.content,
    answerSheet: { id: `ans-${u.id}`, content: u.answer_content },
    originalImageDataUrl: `${imageBaseUrl}/${u.image_path}`,
    createdAt: u.created_at,
  }
}

export function userToDto(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    accountStatus: u.account_status,
    subscription: {
      status: u.subscription_status,
      plan: u.subscription_plan,
      expiresAt: u.subscription_expires_at,
    },
    createdAt: u.created_at,
  }
}
