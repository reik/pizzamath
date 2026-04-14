import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useFilterStore } from '@/stores/filterStore'

export function SearchBar() {
  const setKeyword = useFilterStore((s) => s.setKeyword)
  const [value, setValue] = useState('')
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(value)
      if (value && pathname !== '/') navigate('/')
    }, 300)
    return () => clearTimeout(timer)
  }, [value, setKeyword, pathname, navigate])

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
