import { useNavigate, useLocation } from 'react-router-dom'
import { useCategories } from '@/features/worksheets'
import { useFilterStore } from '@/stores/filterStore'

export function SubcategoryDropdown() {
  const { data: categories } = useCategories()
  const { selectedCategoryId, selectedSubcategoryId, setSubcategory } = useFilterStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (!selectedCategoryId) return null

  const subcategories = categories?.find((c) => c.id === selectedCategoryId)?.subcategories ?? []

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSubcategory(e.target.value || null)
    if (pathname !== '/') navigate('/')
  }

  return (
    <select
      value={selectedSubcategoryId ?? ''}
      onChange={handleChange}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      aria-label="Subcategory"
    >
      <option value="">All Subcategories</option>
      {subcategories.map((sub) => (
        <option key={sub.id} value={sub.id}>{sub.name}</option>
      ))}
    </select>
  )
}
