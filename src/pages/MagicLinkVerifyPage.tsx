import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/features/auth/store'

type Status = 'verifying' | 'success' | 'error'

export function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [status, setStatus] = useState<Status>('verifying')
  const [error, setError] = useState<string>('')
  const hasRun = useRef(false)

  useEffect(() => {
    document.title = 'Signing you in — PizzaMath'
  }, [])

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setError('Missing token')
      return
    }

    authApi
      .verifyMagicLink(token)
      .then((data) => {
        setUser(data.user, data.token)
        setStatus('success')
        navigate('/', { replace: true })
      })
      .catch((err: unknown) => {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Could not sign you in')
      })
  }, [searchParams, navigate, setUser])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <main id="main-content" className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md text-center">
        <h1 className="text-2xl font-bold text-orange-600">PizzaMath</h1>
        {status === 'verifying' && (
          <p className="mt-4 text-sm text-gray-600" role="status" aria-live="polite">Signing you in…</p>
        )}
        {status === 'success' && (
          <p className="mt-4 text-sm text-gray-600" role="status" aria-live="polite">Signed in. Redirecting…</p>
        )}
        {status === 'error' && (
          <div className="mt-4 space-y-3" role="alert">
            <p className="text-sm text-red-600">{error}</p>
            <Link
              to="/login"
              className="inline-block rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
