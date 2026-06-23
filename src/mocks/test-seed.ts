import { db } from './db'

interface CatSeed { id: string; name: string; grades: string; subcategories: string[] }

const CATEGORIES: CatSeed[] = [
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
  { id: 'cat-14', name: 'Modeling',                         grades: '9–12', subcategories: ['Apply mathematics to real-world problems', 'Interpret mathematical results in context'] },
]

const WORKSHEETS = [
  {
    id: 'ws-1', title: 'Counting Objects 1–10', categoryId: 'cat-1', subcategoryId: 'sub-1-2',
    level: 'Beginner', schoolGrade: 'K', author: 'PizzaMath',
    content: 'Count the objects in each row and write the total.',
    answerContent: '1. 3\n2. 5\n3. 7', createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'ws-2', title: 'Add Within 20', categoryId: 'cat-2', subcategoryId: 'sub-2-1',
    level: 'Beginner', schoolGrade: '1', author: 'PizzaMath',
    content: '1. 7 + 8 = ?\n2. 9 + 6 = ?',
    answerContent: '1. 15\n2. 15', createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'ws-3', title: 'Equivalent Fractions', categoryId: 'cat-4', subcategoryId: 'sub-4-2',
    level: 'Intermediate', schoolGrade: '4', author: 'PizzaMath',
    content: 'Fractions practice: find equivalents for 1/2 and 2/3.',
    answerContent: '1. 2/4, 3/6\n2. 4/6, 6/9', createdAt: '2026-01-03T00:00:00.000Z',
  },
]

const USERS = [
  {
    id: 'admin-1', email: 'abc@abc.co', password: import.meta.env.VITE_TEST_PASSWORD, role: 'admin',
    accountStatus: 'active', subscriptionStatus: 'active', subscriptionPlan: 'annual',
    subscriptionExpiresAt: '2027-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function clearAll(): void {
  for (const u of db.user.getAll()) db.user.delete({ where: { id: { equals: u.id } } })
  for (const c of db.category.getAll()) db.category.delete({ where: { id: { equals: c.id } } })
  for (const s of db.subcategory.getAll()) db.subcategory.delete({ where: { id: { equals: s.id } } })
  for (const w of db.worksheet.getAll()) db.worksheet.delete({ where: { id: { equals: w.id } } })
  for (const p of db.progressEntry.getAll()) db.progressEntry.delete({ where: { id: { equals: p.id } } })
  for (const u of db.userUpload.getAll()) db.userUpload.delete({ where: { id: { equals: u.id } } })
}

export function seedTestDb(): void {
  clearAll()
  for (const u of USERS) db.user.create(u)
  CATEGORIES.forEach((cat, ci) => {
    db.category.create({ id: cat.id, name: cat.name, grades: cat.grades })
    cat.subcategories.forEach((name, si) => {
      db.subcategory.create({ id: `sub-${ci + 1}-${si + 1}`, name, categoryId: cat.id })
    })
  })
  for (const w of WORKSHEETS) db.worksheet.create(w)
}
