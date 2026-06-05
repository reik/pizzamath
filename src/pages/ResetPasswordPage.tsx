import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { cn } from '@/utils/cn'

const formSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

export function ResetPasswordPage() {
  useEffect(() => { document.title = 'Set New Password — PizzaMath' }, [])
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md text-center space-y-4">
          <p className="text-sm text-red-600">Missing or invalid reset link.</p>
          <Link to="/forgot-password" className="text-sm font-medium text-orange-600 hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    )
  }

  async function onSubmit(data: FormValues) {
    setApiError('')
    try {
      await authApi.resetPassword({ token: token!, newPassword: data.newPassword })
      navigate('/login', { replace: true })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Invalid or expired reset link')
    }
  }

  const fieldClass =
    'w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-orange-600">PizzaMath</h1>
          <p className="mt-1 text-sm text-gray-500">Set a new password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="rp-new" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              id="rp-new"
              type="password"
              autoComplete="new-password"
              {...register('newPassword')}
              aria-describedby={errors.newPassword ? 'rp-new-error' : undefined}
              className={cn(fieldClass, errors.newPassword ? 'border-red-500' : 'border-gray-300')}
            />
            {errors.newPassword && (
              <p id="rp-new-error" className="mt-1 text-xs text-red-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="rp-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              id="rp-confirm"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              aria-describedby={errors.confirmPassword ? 'rp-confirm-error' : undefined}
              className={cn(fieldClass, errors.confirmPassword ? 'border-red-500' : 'border-gray-300')}
            />
            {errors.confirmPassword && (
              <p id="rp-confirm-error" className="mt-1 text-xs text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {apiError && <p className="text-sm text-red-600">{apiError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  )
}
