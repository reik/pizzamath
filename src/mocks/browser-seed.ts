import { db } from './db'

db.user.create({
  id: 'admin-1',
  email: 'admin@pizzamath.com',
  password: 'password123',
  role: 'admin',
  accountStatus: 'active',
  subscriptionStatus: 'active',
  subscriptionPlan: 'annual',
  subscriptionExpiresAt: '2027-12-31T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
})

db.user.create({
  id: 'user-1',
  email: 'user@pizzamath.com',
  password: 'password123',
  role: 'user',
  accountStatus: 'active',
  subscriptionStatus: 'active',
  subscriptionPlan: 'monthly',
  subscriptionExpiresAt: '2027-12-31T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
})

const CATEGORIES = [
  { id: 'cat-1',  name: 'Counting & Cardinality',              grades: 'K',    subs: ['Know number names and the count sequence', 'Count to tell the number of objects', 'Compare numbers'] },
  { id: 'cat-2',  name: 'Operations & Algebraic Thinking',     grades: 'K–5',  subs: ['Understand addition and subtraction', 'Represent and solve addition/subtraction problems', 'Multiply and divide within 100', 'Solve problems using the four operations', 'Generate and analyze patterns'] },
  { id: 'cat-3',  name: 'Number & Operations in Base Ten',     grades: 'K–5',  subs: ['Work with numbers 11–19', 'Understand place value', 'Use place value understanding', 'Generalize place value understanding'] },
  { id: 'cat-4',  name: 'Number & Operations — Fractions',     grades: '3–5',  subs: ['Develop understanding of fractions', 'Extend understanding of fraction equivalence', 'Build fractions from unit fractions', 'Apply understanding of multiplication and division to fractions'] },
  { id: 'cat-5',  name: 'Measurement & Data',                  grades: 'K–5',  subs: ['Describe and compare measurable attributes', 'Classify objects and count', 'Measure lengths indirectly', 'Represent and interpret data', 'Geometric measurement'] },
  { id: 'cat-6',  name: 'Geometry',                            grades: 'K–12', subs: ['Identify and describe shapes', 'Analyze and compare shapes', 'Draw and identify lines and angles', 'Congruence', 'Similarity', 'Trigonometry', 'Modeling with geometry'] },
  { id: 'cat-7',  name: 'Ratios & Proportional Relationships', grades: '6–7',  subs: ['Understand ratio concepts', 'Analyze proportional relationships'] },
  { id: 'cat-8',  name: 'The Number System',                   grades: '6–8',  subs: ['Apply fraction division', 'Compute with multi-digit numbers', 'Apply properties of operations', 'Know real numbers'] },
  { id: 'cat-9',  name: 'Expressions & Equations',             grades: '6–8',  subs: ['Apply properties of operations to expressions', 'Reason about one-variable equations', 'Represent and analyze quantitative relationships', 'Work with radicals and integer exponents', 'Understand connections between proportional and linear relationships'] },
  { id: 'cat-10', name: 'Functions',                           grades: '8–12', subs: ['Define, evaluate, and compare functions', 'Use functions to model relationships', 'Interpret functions', 'Build new functions from existing functions'] },
  { id: 'cat-11', name: 'Statistics & Probability',            grades: '6–12', subs: ['Develop understanding of statistical variability', 'Summarize and describe distributions', 'Investigate patterns of association', 'Interpret linear models', 'Use probability rules'] },
  { id: 'cat-12', name: 'Number & Quantity',                   grades: '9–12', subs: ['Extend properties of exponents', 'Reason quantitatively with units', 'Perform operations with complex numbers', 'Represent and model with vector quantities'] },
  { id: 'cat-13', name: 'Algebra',                             grades: '9–12', subs: ['Interpret the structure of expressions', 'Write expressions in equivalent forms', 'Perform arithmetic on polynomials', 'Create equations', 'Understand solving equations', 'Represent and solve equations graphically'] },
  { id: 'cat-14', name: 'Modeling',                            grades: '9–12', subs: ['Apply mathematics to real-world problems', 'Interpret mathematical results in context'] },
]

CATEGORIES.forEach((cat, ci) => {
  db.category.create({ id: cat.id, name: cat.name, grades: cat.grades })
  cat.subs.forEach((name, si) => {
    db.subcategory.create({ id: `sub-${ci + 1}-${si + 1}`, name, categoryId: cat.id })
  })
})
