import { useEffect } from 'react'
import { RegisterForm } from '@/features/auth'

export function RegisterPage() {
  useEffect(() => { document.title = 'Create Account — PizzaMath' }, [])
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-orange-600">PizzaMath</h1>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
