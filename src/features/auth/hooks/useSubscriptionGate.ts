import { useAuthStore } from '../store'

export function useSubscriptionGate() {
  const user = useAuthStore((s) => s.user)
  const isSubscribed = user?.subscription.status === 'active'
  return { isSubscribed }
}
