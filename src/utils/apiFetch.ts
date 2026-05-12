import { getToken } from '@/features/auth/store'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${url}`, { ...init, headers: { ...headers, ...init?.headers } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message: string }).message)
  }
  return res.json() as Promise<T>
}
