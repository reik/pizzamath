import { http, HttpResponse } from 'msw'
import { db } from '../db'

const DEMO_PASSWORD = import.meta.env.VITE_TEST_PASSWORD as string

const DEMO_USERS: Record<string, { id: string; email: string; password: string; role: string }> = {
  'admin@pizzamath.com': { id: 'admin-1', email: 'admin@pizzamath.com', password: DEMO_PASSWORD, role: 'admin' },
  'user@pizzamath.com':  { id: 'user-1',  email: 'user@pizzamath.com',  password: DEMO_PASSWORD, role: 'user'  },
}

function getDemoUser(email: string) {
  return DEMO_USERS[email] ?? null
}

function getBearerUserId(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7) || null
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }
    const dbUser = db.user.findFirst({ where: { email: { equals: email } } })
    if (dbUser) {
      if (dbUser.password !== password) return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      if (dbUser.accountStatus === 'suspended') return HttpResponse.json({ message: 'Account suspended. Contact support.' }, { status: 403 })
      return HttpResponse.json({ token: dbUser.id, user: toUserDto(dbUser) })
    }
    const demo = getDemoUser(email)
    if (!demo || demo.password !== password) return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    return HttpResponse.json({
      token: demo.id,
      user: { id: demo.id, email: demo.email, role: demo.role, accountStatus: 'active', subscription: { status: 'active', plan: 'annual', expiresAt: '2027-12-31T00:00:00.000Z' }, createdAt: '2026-01-01T00:00:00.000Z' },
    })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { email: string; password: string; plan: 'monthly' | 'annual' }
    const existing = db.user.findFirst({ where: { email: { equals: body.email } } })
    if (existing) {
      return HttpResponse.json({ message: 'Email already registered' }, { status: 409 })
    }
    const user = db.user.create({
      id: `user-${Date.now()}`,
      email: body.email,
      password: body.password,
      role: 'user',
      accountStatus: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: body.plan,
      subscriptionExpiresAt: body.plan === 'annual'
        ? new Date(Date.now() + 365 * 86400000).toISOString()
        : new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    })
    return HttpResponse.json({ token: user.id, user: toUserDto(user) }, { status: 201 })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ ok: true })
  }),

  http.post('/api/auth/change-password', async ({ request }) => {
    const userId = getBearerUserId(request)
    if (!userId) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const { currentPassword, newPassword } = await request.json() as { currentPassword: string; newPassword: string }
    const user = db.user.findFirst({ where: { id: { equals: userId } } })
    if (!user || user.password !== currentPassword) {
      return HttpResponse.json({ message: 'Current password is incorrect' }, { status: 400 })
    }
    db.user.update({ where: { id: { equals: userId } }, data: { password: newPassword } })
    return HttpResponse.json({ ok: true })
  }),

  http.post('/api/auth/forgot-password', async () => {
    return HttpResponse.json({ ok: true })
  }),

  http.post('/api/auth/reset-password', async () => {
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const userId = getBearerUserId(request)
    if (!userId) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const user = db.user.findFirst({ where: { id: { equals: userId } } })
    if (user) return HttpResponse.json(toUserDto(user))
    const demo = Object.values(DEMO_USERS).find(u => u.id === userId)
    if (!demo) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ id: demo.id, email: demo.email, role: demo.role, accountStatus: 'active', subscription: { status: 'active', plan: 'annual', expiresAt: '2027-12-31T00:00:00.000Z' }, createdAt: '2026-01-01T00:00:00.000Z' })
  }),
]

function toUserDto(user: ReturnType<typeof db.user.findFirst>) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    subscription: {
      status: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      expiresAt: user.subscriptionExpiresAt,
    },
    createdAt: user.createdAt,
  }
}

export { toUserDto }
