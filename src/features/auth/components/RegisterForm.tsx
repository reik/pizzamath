import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { registerSchema, type RegisterInput } from '@/api/auth'
import { useAuth } from '../hooks/useAuth'
import { cn } from '@/utils/cn'

export function RegisterForm() {
  const { registerMutation } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { plan: 'monthly' },
  })

  return (
    <form onSubmit={handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
            errors.email ? 'border-red-500' : 'border-gray-300',
          )}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
            errors.password ? 'border-red-500' : 'border-gray-300',
          )}
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">Plan</p>
        <div className="grid grid-cols-2 gap-3">
          {(['monthly', 'annual'] as const).map((plan) => (
            <label key={plan} className="relative flex cursor-pointer rounded-md border p-3 focus-within:ring-2 focus-within:ring-orange-500">
              <input type="radio" value={plan} {...register('plan')} className="sr-only" />
              <span className="flex flex-col">
                <span className="text-sm font-medium capitalize">{plan}</span>
                <span className="text-xs text-gray-500">
                  {plan === 'monthly' ? '$10 / month' : '$100 / year'}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.plan && <p className="mt-1 text-xs text-red-600">{errors.plan.message}</p>}
      </div>

      {registerMutation.error && (
        <p className="text-sm text-red-600">{(registerMutation.error as Error).message}</p>
      )}

      <button
        type="submit"
        disabled={registerMutation.isPending}
        className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {registerMutation.isPending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-orange-600 hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
