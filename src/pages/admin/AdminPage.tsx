import { useState } from 'react'
import { AdminDashboard } from '@/features/admin/components/AdminDashboard'
import { UserManagement } from '@/features/admin/components/UserManagement'
import { cn } from '@/utils/cn'

type Tab = 'worksheets' | 'users'

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('worksheets')

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['worksheets', 'users'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'worksheets' && <AdminDashboard />}
      {tab === 'users' && <UserManagement />}
    </main>
  )
}
