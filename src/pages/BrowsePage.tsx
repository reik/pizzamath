import { useWorksheets, useCategories, WorksheetCard } from '@/features/worksheets'
import { useUserUploads, UploadedWorksheetCard } from '@/features/uploads'
import { useAuthStore } from '@/features/auth/store'
import { useFilterStore } from '@/stores/filterStore'
import type { UserUpload } from '@/types/userUpload'

export function BrowsePage() {
  const { data: worksheets, isLoading, error } = useWorksheets()
  const { data: categories } = useCategories()
  const user = useAuthStore((s) => s.user)
  const { selectedCategoryId, selectedSubcategoryId, keyword } = useFilterStore()
  const { data: allUploads } = useUserUploads(user?.id ?? '')

  const categoryMap = Object.fromEntries(categories?.map((c) => [c.id, c.name]) ?? [])

  const filteredUploads = (allUploads ?? []).filter((u: UserUpload) => {
    if (selectedCategoryId && u.categoryId !== selectedCategoryId) return false
    if (selectedSubcategoryId && u.subcategoryId !== selectedSubcategoryId) return false
    if (keyword) {
      const kw = keyword.toLowerCase()
      if (!u.title.toLowerCase().includes(kw) && !u.content.toLowerCase().includes(kw)) return false
    }
    return true
  })

  const totalCount = (worksheets?.length ?? 0) + filteredUploads.length

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="p-6 text-red-600">Failed to load worksheets.</p>
  }

  if (!worksheets?.length && !filteredUploads.length) {
    return <p className="p-6 text-gray-500">No worksheets found. Try adjusting your filters.</p>
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Worksheets <span className="text-sm font-normal text-gray-500">({totalCount})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUploads.map((upload) => (
          <UploadedWorksheetCard key={upload.id} upload={upload} categoryName={categoryMap[upload.categoryId]} />
        ))}
        {worksheets?.map((ws) => (
          <WorksheetCard key={ws.id} worksheet={ws} categoryName={categoryMap[ws.categoryId]} />
        ))}
      </div>
    </main>
  )
}
