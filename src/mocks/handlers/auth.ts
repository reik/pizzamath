import { http, HttpResponse } from 'msw'
import { db } from '../db'

function getBearerUserId(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7) || null
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }
    const user = db.user.findFirst({ where: { email: { equals: email } } })
    if (!user || user.password !== password) {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }
    if (user.accountStatus === 'suspended') {
      return HttpResponse.json({ message: 'Account suspended. Contact support.' }, { status: 403 })
    }
    return HttpResponse.json({ token: user.id, user: toUserDto(user) })
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

  http.get('/api/auth/me', ({ request }) => {
    const userId = getBearerUserId(request)
    if (!userId) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const user = db.user.findFirst({ where: { id: { equals: userId } } })
    if (!user) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(toUserDto(user))
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
