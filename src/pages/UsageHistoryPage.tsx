import { useAuthStore } from '@/features/auth/store'
import { useProgress, ProgressHistory } from '@/features/progress'

export function UsageHistoryPage() {
  const user = useAuthStore((s) => s.user)
  const { data: entries, isLoading } = useProgress(user?.id ?? '')

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Usage History</h1>
      {isLoading ? (
        <div className="animate-pulse h-32 rounded-xl bg-gray-100" />
      ) : (
        <ProgressHistory entries={entries ?? []} />
      )}
    </main>
  )
}
