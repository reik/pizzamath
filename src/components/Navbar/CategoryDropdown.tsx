import { useNavigate, useLocation } from 'react-router-dom'
import { useCategories } from '@/features/worksheets'
import { useFilterStore } from '@/stores/filterStore'

export function CategoryDropdown() {
  const { data: categories } = useCategories()
  const { selectedCategoryId, setCategory } = useFilterStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setCategory(e.target.value || null)
    if (pathname !== '/') navigate('/')
  }

  return (
    <select
      value={selectedCategoryId ?? ''}
      onChange={handleChange}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      aria-label="Category"
    >
      <option value="">All Categories</option>
      {categories?.map((cat) => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  )
}
