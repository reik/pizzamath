# PizzaMath — Domain Model

## Worksheet attributes

| Field | Required | Description |
|-------|----------|-------------|
| `category` | yes | Top-level CA Common Core domain (e.g., "Number & Operations") |
| `subcategory` | yes | Standard cluster within the category |
| `level` | yes | Difficulty descriptor: `Beginner`, `Intermediate`, or `Advanced` |
| `author` | yes | Creator of the worksheet |
| `schoolGrade` | no | K–12 grade level |

Each worksheet has a paired answer sheet stored alongside it.

## California Common Core categories

Seed the database with these top-level categories on first deploy:

| Category | Grades |
|----------|--------|
| Counting & Cardinality | K |
| Operations & Algebraic Thinking | K–5 |
| Number & Operations in Base Ten | K–5 |
| Number & Operations — Fractions | 3–5 |
| Measurement & Data | K–5 |
| Geometry | K–12 |
| Ratios & Proportional Relationships | 6–7 |
| The Number System | 6–8 |
| Expressions & Equations | 6–8 |
| Functions | 8–12 |
| Statistics & Probability | 6–12 |
| Number & Quantity | 9–12 |
| Algebra | 9–12 |
| Modeling | 9–12 |

## Authentication & roles

- Email/password registration + login (private site — all routes require auth)
- Subscription: $10/month or $100/year
- Roles: `user` | `admin`
- Seed the first admin (email + password) at deploy time
- Admin capabilities: add/delete worksheets, access admin tools panel
