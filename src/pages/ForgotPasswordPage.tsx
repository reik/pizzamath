import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { forgotPasswordSchema, type ForgotPasswordInput, authApi } from '@/api/auth'
import { cn } from '@/utils/cn'

export function ForgotPasswordPage() {
  useEffect(() => { document.title = 'Reset Password — PizzaMath' }, [])
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setApiError('')
    try {
      await authApi.forgotPassword(data)
      setSubmitted(true)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-orange-600">PizzaMath</h1>
          <p className="mt-1 text-sm text-gray-500">Reset your password</p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-700">
              Check your email — if that address is registered you'll receive a reset link shortly.
            </p>
            <Link to="/login" className="text-sm font-medium text-orange-600 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                aria-describedby={errors.email ? 'fp-email-error' : undefined}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                  errors.email ? 'border-red-500' : 'border-gray-300',
                )}
              />
              {errors.email && (
                <p id="fp-email-error" className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {apiError && <p className="text-sm text-red-600">{apiError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>

            <p className="text-center text-sm text-gray-600">
              <Link to="/login" className="font-medium text-orange-600 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
