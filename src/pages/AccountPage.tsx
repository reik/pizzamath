import { useAuthStore } from '@/features/auth/store'
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm'

export function AccountPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Account</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Profile</h2>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
          <p className="mt-1 text-sm text-gray-900">{user.email}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</p>
          <p className="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Status</p>
          <p className="mt-1 text-sm text-gray-900 capitalize">{user.accountStatus}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subscription</p>
          <p className="mt-1 text-sm text-gray-900 capitalize">
            {user.subscription.status} — {user.subscription.plan ?? 'none'}
          </p>
          {user.subscription.expiresAt && (
            <p className="text-xs text-gray-500">
              Expires {new Date(user.subscription.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Change Password</h2>
        <ChangePasswordForm />
      </div>
    </main>
  )
}
