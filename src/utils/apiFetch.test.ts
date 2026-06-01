import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiFetch } from './apiFetch'
import { useAuthStore } from '@/features/auth/store'

const fakeUser = { id: 'u-1', email: 't@t.co', role: 'user' as const, accountStatus: 'active', subscription: { status: 'active', plan: 'monthly', expiresAt: null }, createdAt: '2026-01-01T00:00:00.000Z' }

describe('apiFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    useAuthStore.getState().clearUser()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('clears the auth store on 401 when a token was sent', async () => {
    useAuthStore.getState().setUser(fakeUser, 'expired-token')
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 }))

    await expect(apiFetch('/api/worksheets')).rejects.toThrow('Invalid or expired token')
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('does NOT clear the auth store on 401 when no token was sent', async () => {
    useAuthStore.setState({ user: fakeUser, token: null })
    const clearSpy = vi.spyOn(useAuthStore.getState(), 'clearUser')
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }))

    await expect(apiFetch('/api/worksheets')).rejects.toThrow('Unauthorized')
    expect(clearSpy).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toEqual(fakeUser)

    clearSpy.mockRestore()
  })

  it('leaves the auth store alone on non-401 errors', async () => {
    useAuthStore.getState().setUser(fakeUser, 'valid-token')
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Server error' }), { status: 500 }))

    await expect(apiFetch('/api/worksheets')).rejects.toThrow('Server error')
    expect(useAuthStore.getState().token).toBe('valid-token')
    expect(useAuthStore.getState().user).toEqual(fakeUser)
  })
})
