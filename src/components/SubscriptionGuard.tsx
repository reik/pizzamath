import { Navigate, Outlet } from 'react-router-dom'
import { useSubscriptionGate } from '@/features/auth'

export function SubscriptionGuard() {
  const { isSubscribed } = useSubscriptionGate()
  if (!isSubscribed) return <Navigate to="/subscribe" replace />
  return <Outlet />
}
