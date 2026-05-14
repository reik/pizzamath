import { useState } from 'react'
import { useUserManagement } from '../hooks/useUserManagement'
import { AddUserForm } from './AddUserForm'
import { useAuthStore } from '@/features/auth/store'
import { cn } from '@/utils/cn'

export function UserManagement() {
  const currentUser = useAuthStore((s) => s.user)
  const { query, createMutation, suspendMutation, activateMutation, deleteMutation } = useUserManagement()
  const [showAddForm, setShowAddForm] = useState(false)

  if (query.isLoading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />
  if (query.error) return <p className="text-red-600">Failed to load users.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Users ({query.data?.length ?? 0})
        </h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          {showAddForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">New User</h3>
          <AddUserForm
            onSubmit={(data) => createMutation.mutate(data, { onSuccess: () => setShowAddForm(false) })}
            isPending={createMutation.isPending}
            error={createMutation.error ? (createMutation.error as Error).message : null}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="pb-2 pr-4 font-medium">Email</th>
              <th className="pb-2 pr-4 font-medium">Role</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Plan</th>
              <th className="pb-2 pr-4 font-medium">Expiry</th>
              <th className="pb-2 pr-4 font-medium">Joined</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.map((user) => {
              const isSelf = user.id === currentUser?.id
              const isSuspended = user.accountStatus === 'suspended'
              return (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-800">{user.email}</td>
                  <td className="py-2 pr-4">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700',
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
                    )}>
                      {user.accountStatus}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-600 capitalize">{user.subscription.plan ?? '—'}</td>
                  <td className="py-2 pr-4 text-gray-600">
                    {user.subscription.expiresAt
                      ? new Date(user.subscription.expiresAt).getFullYear() >= 2099
                        ? 'Never'
                        : new Date(user.subscription.expiresAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="py-2 pr-4 text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    {!isSelf && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => isSuspended
                            ? activateMutation.mutate(user.id)
                            : suspendMutation.mutate(user.id)
                          }
                          disabled={suspendMutation.isPending || activateMutation.isPending}
                          className="text-xs text-orange-600 hover:underline disabled:opacity-50"
                        >
                          {isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${user.email}? This cannot be undone.`)) {
                              deleteMutation.mutate(user.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {isSelf && <span className="text-xs text-gray-400">you</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
