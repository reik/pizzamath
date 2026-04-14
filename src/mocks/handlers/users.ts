import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { toUserDto } from './auth'

export const userHandlers = [
  http.get('/api/users', () => {
    const users = db.user.getAll()
    return HttpResponse.json(users.map(toUserDto))
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as {
      email: string; password: string; role: string;
      plan: 'monthly' | 'annual'
    }
    const existing = db.user.findFirst({ where: { email: { equals: body.email } } })
    if (existing) {
      return HttpResponse.json({ message: 'Email already registered' }, { status: 409 })
    }
    const user = db.user.create({
      id: `user-${Date.now()}`,
      email: body.email,
      password: body.password,
      role: body.role ?? 'user',
      accountStatus: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: body.plan,
      subscriptionExpiresAt: body.plan === 'annual'
        ? new Date(Date.now() + 365 * 86400000).toISOString()
        : new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    })
    return HttpResponse.json(toUserDto(user), { status: 201 })
  }),

  http.patch('/api/users/:id', async ({ params, request }) => {
    const body = await request.json() as { accountStatus?: string; role?: string }
    const existing = db.user.findFirst({ where: { id: { equals: params.id as string } } })
    if (!existing) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    const updated = db.user.update({
      where: { id: { equals: params.id as string } },
      data: body,
    })
    return HttpResponse.json(toUserDto(updated))
  }),

  http.delete('/api/users/:id', ({ params }) => {
    const existing = db.user.findFirst({ where: { id: { equals: params.id as string } } })
    if (!existing) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    db.user.delete({ where: { id: { equals: params.id as string } } })
    return HttpResponse.json({ ok: true })
  }),
]
