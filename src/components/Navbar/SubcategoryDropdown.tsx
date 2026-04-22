import { useNavigate, useParams } from 'react-router-dom'
import { useCategories } from '@/features/worksheets'
import { slugify } from '@/utils/slugify'

export function SubcategoryDropdown() {
  const { data: categories } = useCategories()
  const { categorySlug = '', subcategorySlug = '' } = useParams()
  const navigate = useNavigate()

  if (!categorySlug) return null

  const selectedCategory = categories?.find((c) => slugify(c.name) === categorySlug)
  const subcategories = selectedCategory?.subcategories ?? []

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    navigate(value ? `/browse/${categorySlug}/${value}` : `/browse/${categorySlug}`)
  }

  return (
    <select
      value={subcategorySlug}
      onChange={handleChange}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      aria-label="Subcategory"
    >
      <option value="">All Subcategories</option>
      {subcategories.map((sub) => (
        <option key={sub.id} value={slugify(sub.name)}>{sub.name}</option>
      ))}
    </select>
  )
}
