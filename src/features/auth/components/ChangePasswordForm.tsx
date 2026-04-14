import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { changePasswordSchema, type ChangePasswordInput, usersApi } from '@/api/users'
import { cn } from '@/utils/cn'

export function ChangePasswordForm() {
  const mutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: Omit<ChangePasswordInput, 'confirmPassword'>) =>
      usersApi.changePassword({ currentPassword, newPassword }),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  function onSubmit(data: ChangePasswordInput) {
    mutation.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      { onSuccess: () => reset() },
    )
  }

  const field = 'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
        <input type="password" autoComplete="current-password" {...register('currentPassword')}
          className={cn(field, errors.currentPassword ? 'border-red-500' : 'border-gray-300')} />
        {errors.currentPassword && (
          <p className="text-xs text-red-600 mt-0.5">{errors.currentPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
        <input type="password" autoComplete="new-password" {...register('newPassword')}
          className={cn(field, errors.newPassword ? 'border-red-500' : 'border-gray-300')} />
        {errors.newPassword && (
          <p className="text-xs text-red-600 mt-0.5">{errors.newPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
        <input type="password" autoComplete="new-password" {...register('confirmPassword')}
          className={cn(field, errors.confirmPassword ? 'border-red-500' : 'border-gray-300')} />
        {errors.confirmPassword && (
          <p className="text-xs text-red-600 mt-0.5">{errors.confirmPassword.message}</p>
        )}
      </div>

      {mutation.error && (
        <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}
      {mutation.isSuccess && (
        <p className="text-sm text-green-600">Password changed successfully.</p>
      )}

      <button type="submit" disabled={mutation.isPending}
        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
        {mutation.isPending ? 'Saving…' : 'Change Password'}
      </button>
    </form>
  )
}
