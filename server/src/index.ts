import 'dotenv/config'
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

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '20mb' }))

// Serve uploaded images as static files
app.use('/uploads', express.static(join(__dirname, '../../uploads')))

// API routes
app.use('/api/auth', authRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/worksheets', worksheetsRouter)
app.use('/api/progress', progressRouter)
app.use('/api/users', usersRouter)
app.use('/api/user-uploads', userUploadsRouter)

app.listen(PORT, () => {
  console.log(`PizzaMath API running on http://localhost:${PORT}`)
})
