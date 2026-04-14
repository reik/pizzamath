import { useWorksheets, useCategories, WorksheetCard } from '@/features/worksheets'

export function BrowsePage() {
  const { data: worksheets, isLoading, error } = useWorksheets()
  const { data: categories } = useCategories()

  const categoryMap = Object.fromEntries(categories?.map((c) => [c.id, c.name]) ?? [])

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

  if (!worksheets?.length) {
    return <p className="p-6 text-gray-500">No worksheets found. Try adjusting your filters.</p>
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Worksheets <span className="text-sm font-normal text-gray-500">({worksheets.length})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {worksheets.map((ws) => (
          <WorksheetCard key={ws.id} worksheet={ws} categoryName={categoryMap[ws.categoryId]} />
        ))}
      </div>
    </main>
  )
}
