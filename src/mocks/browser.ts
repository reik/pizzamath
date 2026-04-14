import { setupWorker } from 'msw/browser'
import './worksheets-seed'
import { authHandlers } from './handlers/auth'
import { categoryHandlers } from './handlers/categories'
import { worksheetHandlers } from './handlers/worksheets'
import { progressHandlers } from './handlers/progress'
import { userHandlers } from './handlers/users'

export const worker = setupWorker(
  ...authHandlers,
  ...categoryHandlers,
  ...worksheetHandlers,
  ...progressHandlers,
  ...userHandlers,
)
