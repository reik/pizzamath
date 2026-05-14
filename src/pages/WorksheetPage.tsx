import { useParams, useNavigate, Link } from 'react-router-dom'
import { useWorksheet, WorksheetViewer, useCategories } from '@/features/worksheets'
import { ExportButton } from '@/features/worksheets/components/ExportButton'
import { ProgressEntryForm } from '@/features/progress/components/ProgressEntryForm'
import { useAuthStore } from '@/features/auth/store'
import { slugify } from '@/utils/slugify'

export function WorksheetPage() {
  const { id } = useParams<{ categorySlug: string; subcategorySlug: string; id: string }>()
  const navigate = useNavigate()
  const { data: worksheet, isLoading, error } = useWorksheet(id!)
  const { data: categories } = useCategories()
  const user = useAuthStore((s) => s.user)

  const categoryName = categories?.find((c) => c.id === worksheet?.categoryId)?.name
  const subcategoryName = categories
    ?.flatMap((c) => c.subcategories)
    .find((s) => s.id === worksheet?.subcategoryId)?.name

  if (isLoading) return <div className="p-6 animate-pulse h-40 bg-gray-100 rounded-xl m-6" />
  if (error || !worksheet) return <p className="p-6 text-red-600">Worksheet not found.</p>

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <button onClick={() => navigate(-1)} className="text-sm text-orange-600 hover:underline">← Back</button>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{worksheet.title}</h1>
        <div className="mt-1 flex flex-wrap gap-2 text-sm">
          {categoryName && (
            <Link
              to={`/browse/${slugify(categoryName)}`}
              className="rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
            >
              {categoryName}
            </Link>
          )}
          {subcategoryName && categoryName && (
            <Link
              to={`/browse/${slugify(categoryName)}/${slugify(subcategoryName)}`}
              className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              {subcategoryName}
            </Link>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
          <span>{worksheet.level}</span>
          {worksheet.schoolGrade && <span>Grade {worksheet.schoolGrade}</span>}
          <span>by {worksheet.author}</span>
        </div>
      </div>

      <WorksheetViewer worksheet={worksheet} />

      <div className="mt-4 flex gap-2">
        <ExportButton worksheetId={worksheet.id} worksheetTitle={worksheet.title} format="pdf" />
        <ExportButton worksheetId={worksheet.id} worksheetTitle={worksheet.title} format="doc" />
      </div>

      {user && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Log Attempt</h2>
          <ProgressEntryForm
            worksheetId={worksheet.id}
            worksheetTitle={worksheet.title}
            userId={user.id}
          />
        </div>
      )}
    </main>
  )
}
