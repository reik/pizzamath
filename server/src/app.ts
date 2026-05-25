import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { authRouter } from './routes/auth.js'
import { categoriesRouter } from './routes/categories.js'
import { worksheetsRouter } from './routes/worksheets.js'
import { progressRouter } from './routes/progress.js'
import { usersRouter } from './routes/users.js'
import { userUploadsRouter } from './routes/userUploads.js'
import { claudeRouter } from './routes/claude.js'
import { gradingsRouter } from './routes/gradings.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const app = express()

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:5175', 'https://reik.github.io']
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }))
app.use(express.json({ limit: '20mb' }))

app.get('/api/health', (_req, res) => { res.json({ ok: true }) })

// Serve uploaded images as static files
app.use('/uploads', express.static(join(__dirname, '../../uploads')))

// API routes
app.use('/api/auth', authRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/worksheets', worksheetsRouter)
app.use('/api/progress', progressRouter)
app.use('/api/users', usersRouter)
app.use('/api/user-uploads', userUploadsRouter)
app.use('/api/claude', claudeRouter)
app.use('/api/gradings', gradingsRouter)
