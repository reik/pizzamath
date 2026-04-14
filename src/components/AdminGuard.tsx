import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'

export function AdminGuard() {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
