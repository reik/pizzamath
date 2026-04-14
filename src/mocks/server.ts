import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { categoryHandlers } from './handlers/categories'
import { worksheetHandlers } from './handlers/worksheets'
import { progressHandlers } from './handlers/progress'
import { userHandlers } from './handlers/users'

export const server = setupServer(
  ...authHandlers,
  ...categoryHandlers,
  ...worksheetHandlers,
  ...progressHandlers,
  ...userHandlers,
)
