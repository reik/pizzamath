import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addUserSchema, type AddUserInput } from '@/api/users'
import { cn } from '@/utils/cn'

interface AddUserFormProps {
  onSubmit: (data: AddUserInput) => void
  isPending?: boolean
  error?: string | null
}

export function AddUserForm({ onSubmit, isPending, error }: AddUserFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddUserInput>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: 'user', plan: 'monthly' },
  })

  function handleValid(data: AddUserInput) {
    onSubmit(data)
    reset()
  }

  const field = 'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

  return (
    <form onSubmit={handleSubmit(handleValid)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input type="email" {...register('email')}
            className={cn(field, errors.email ? 'border-red-500' : 'border-gray-300')} />
          {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
          <input type="password" {...register('password')}
            className={cn(field, errors.password ? 'border-red-500' : 'border-gray-300')} />
          {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
          <select {...register('role')} className={cn(field, 'border-gray-300')}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
          <select {...register('plan')} className={cn(field, 'border-gray-300')}>
            <option value="monthly">Monthly — $10/mo</option>
            <option value="annual">Annual — $100/yr</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending}
        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
        {isPending ? 'Adding…' : 'Add User'}
      </button>
    </form>
  )
}
