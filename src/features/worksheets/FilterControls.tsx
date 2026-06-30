import { useNavigate, useParams } from 'react-router-dom'
import { useCategories } from '@/features/worksheets'
import { slugify } from '@/utils/slugify'

export function FilterControls() {
  const navigate = useNavigate()
  const { categorySlug, subcategorySlug } = useParams()
  const { data: categories } = useCategories()

  const selectedCategory = categories?.find((c) => slugify(c.name) === categorySlug)
  const subcategories = selectedCategory?.subcategories ?? []

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    navigate(value ? `/browse/${value}` : '/')
  }

  function handleSubcategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    navigate(value ? `/browse/${categorySlug}/${value}` : `/browse/${categorySlug}`)
  }

  return (
    <div className="mb-4 flex flex-col sm:flex-row gap-2">
      <select
        value={categorySlug ?? ''}
        onChange={handleCategoryChange}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Category"
      >
        <option value="">All Categories</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={slugify(cat.name)}>
            {cat.name}
          </option>
        ))}
      </select>

      {subcategories.length > 0 && (
        <select
          value={subcategorySlug ?? ''}
          onChange={handleSubcategoryChange}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Subcategory"
        >
          <option value="">All Subcategories</option>
          {subcategories.map((sub) => (
            <option key={sub.id} value={slugify(sub.name)}>
              {sub.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
