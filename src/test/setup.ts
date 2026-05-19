import '@testing-library/jest-dom'
import { server } from '@/mocks/server'
import { seedTestDb } from '@/mocks/test-seed'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => seedTestDb())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())
