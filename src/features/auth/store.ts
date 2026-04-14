import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'

interface AuthStore {
  user: User | null
  token: string | null
  setUser: (user: User, token: string) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => set({ user, token }),
      clearUser: () => set({ user: null, token: null }),
    }),
    { name: 'pizzamath-auth' },
  ),
)

export function getToken(): string | null {
  return useAuthStore.getState().token
}
