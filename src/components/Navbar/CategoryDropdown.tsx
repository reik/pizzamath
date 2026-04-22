import { useNavigate, useParams } from 'react-router-dom'
import { useCategories } from '@/features/worksheets'
import { slugify } from '@/utils/slugify'

export function CategoryDropdown() {
  const { data: categories } = useCategories()
  const { categorySlug = '' } = useParams()
  const navigate = useNavigate()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    navigate(value ? `/browse/${value}` : '/')
  }

  return (
    <select
      value={categorySlug}
      onChange={handleChange}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      aria-label="Category"
    >
      <option value="">All Categories</option>
      {categories?.map((cat) => (
        <option key={cat.id} value={slugify(cat.name)}>{cat.name}</option>
      ))}
    </select>
  )
}
