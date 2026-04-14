import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'

export function AuthGuard() {
  const { user, token, clearUser } = useAuthStore()
  const location = useLocation()

  if (!user || !token) {
    if (user) clearUser()
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
