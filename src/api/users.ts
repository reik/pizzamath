import { z } from 'zod'
import type { User } from '@/types/user'
import { apiFetch } from '@/utils/apiFetch'

export const addUserSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'admin']),
  plan: z.enum(['monthly', 'annual']),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type AddUserInput = z.infer<typeof addUserSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const usersApi = {
  getAll: () => apiFetch<User[]>('/api/users'),

  create: (data: AddUserInput) =>
    apiFetch<User>('/api/users', { method: 'POST', body: JSON.stringify(data) }),

  suspend: (id: string) =>
    apiFetch<User>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ accountStatus: 'suspended' }),
    }),

  activate: (id: string) =>
    apiFetch<User>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ accountStatus: 'active' }),
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/users/${id}`, { method: 'DELETE' }),

  changePassword: (data: Omit<ChangePasswordInput, 'confirmPassword'>) =>
    apiFetch<{ ok: boolean }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
