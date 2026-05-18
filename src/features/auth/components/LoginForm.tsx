import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  loginSchema,
  magicLinkRequestSchema,
  authApi,
  type LoginInput,
  type MagicLinkRequestInput,
} from '@/api/auth'
import { useAuth } from '../hooks/useAuth'
import { cn } from '@/utils/cn'

type Mode = 'magic' | 'password'

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('magic')
  const [magicSent, setMagicSent] = useState(false)
  const { loginMutation } = useAuth()

  const magicForm = useForm<MagicLinkRequestInput>({
    resolver: zodResolver(magicLinkRequestSchema),
  })

  const magicMutation = useMutation({
    mutationFn: (data: MagicLinkRequestInput) => authApi.requestMagicLink(data),
    onSuccess: () => setMagicSent(true),
  })

  const passwordForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  if (magicSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-orange-50 p-4 text-sm text-orange-900">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-xs text-orange-800">
            If an account exists for that email, we&apos;ve sent a sign-in link. It expires in 15 minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setMagicSent(false); magicForm.reset() }}
          className="text-sm text-orange-600 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
        >
          Use a different email
        </button>
      </div>
    )
  }

  if (mode === 'magic') {
    return (
      <form
        onSubmit={magicForm.handleSubmit((data) => magicMutation.mutate(data))}
        className="space-y-4"
        noValidate
      >
        <div>
          <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="magic-email"
            type="email"
            autoComplete="email"
            {...magicForm.register('email')}
            aria-describedby={magicForm.formState.errors.email ? 'magic-email-error' : undefined}
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
              magicForm.formState.errors.email ? 'border-red-500' : 'border-gray-300',
            )}
          />
          {magicForm.formState.errors.email && (
            <p id="magic-email-error" className="mt-1 text-xs text-red-600">
              {magicForm.formState.errors.email.message}
            </p>
          )}
        </div>

        {magicMutation.error && (
          <p className="text-sm text-red-600">{(magicMutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={magicMutation.isPending}
          className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {magicMutation.isPending ? 'Sending link…' : 'Email me a sign-in link'}
        </button>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => setMode('password')}
            className="text-gray-600 hover:text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
          >
            Use password instead
          </button>
        </div>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-orange-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    )
  }

  return (
    <form
      onSubmit={passwordForm.handleSubmit((data) => loginMutation.mutate(data))}
      className="space-y-4"
      noValidate
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...passwordForm.register('email')}
          aria-describedby={passwordForm.formState.errors.email ? 'login-email-error' : undefined}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
            passwordForm.formState.errors.email ? 'border-red-500' : 'border-gray-300',
          )}
        />
        {passwordForm.formState.errors.email && (
          <p id="login-email-error" className="mt-1 text-xs text-red-600">
            {passwordForm.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...passwordForm.register('password')}
          aria-describedby={passwordForm.formState.errors.password ? 'login-password-error' : undefined}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
            passwordForm.formState.errors.password ? 'border-red-500' : 'border-gray-300',
          )}
        />
        {passwordForm.formState.errors.password && (
          <p id="login-password-error" className="mt-1 text-xs text-red-600">
            {passwordForm.formState.errors.password.message}
          </p>
        )}
      </div>

      {loginMutation.error && (
        <p className="text-sm text-red-600">{(loginMutation.error as Error).message}</p>
      )}

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="text-center text-sm">
        <button
          type="button"
          onClick={() => setMode('magic')}
          className="text-gray-600 hover:text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
        >
          Email me a sign-in link instead
        </button>
      </div>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-orange-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}
