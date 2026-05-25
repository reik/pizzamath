import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function SubscribePage() {
  useEffect(() => { document.title = 'Subscribe — PizzaMath' }, [])
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md text-center">
        <h1 className="text-2xl font-bold text-orange-600 mb-2">Subscription Required</h1>
        <p className="text-gray-600 mb-6">
          Get full access to all worksheets for just $10/month or $100/year.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border-2 border-orange-500 p-4">
            <p className="font-semibold">Monthly</p>
            <p className="text-2xl font-bold text-orange-600">$10</p>
            <p className="text-sm text-gray-500">per month</p>
          </div>
          <div className="rounded-lg border-2 border-orange-200 p-4">
            <p className="font-semibold">Annual</p>
            <p className="text-2xl font-bold text-orange-600">$100</p>
            <p className="text-sm text-gray-500">per year — save $20</p>
          </div>
        </div>
        <Link
          to="/register"
          className="inline-block rounded-md bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600"
        >
          Get started
        </Link>
      </div>
    </div>
  )
}
