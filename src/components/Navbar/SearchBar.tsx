import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function SearchBar() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [value, setValue] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      navigate({ pathname: '/', search: params.toString() })
    }, 300)
    return () => clearTimeout(timer)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      type="search"
      placeholder="Search by keywords…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-orange-500"
      aria-label="Search worksheets"
    />
  )
}
