import { z } from 'zod'
import type { User } from '@/types/user'
import { apiFetch } from '@/utils/apiFetch'

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})

export const registerSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  plan: z.enum(['monthly', 'annual']),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email required'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export interface AuthResponse {
  token: string
  user: User
}

export const authApi = {
  login: (data: LoginInput) =>
    apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  register: (data: RegisterInput) =>
    apiFetch<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () =>
    apiFetch<User>('/api/auth/me'),

  forgotPassword: (data: ForgotPasswordInput) =>
    apiFetch<{ ok: boolean }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiFetch<{ ok: boolean }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
}
