import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'
import { useUserUploads, useDeleteUpload, UploadZone, UploadedWorksheetCard } from '@/features/uploads'
import { useCategories } from '@/features/worksheets'

export function MyUploadsPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { data: uploads, isLoading } = useUserUploads(user?.id ?? '')
  const deleteUpload = useDeleteUpload(user?.id ?? '')
  const { data: categories } = useCategories()
  const [showUploader, setShowUploader] = useState(false)

  const categoryMap = Object.fromEntries(categories?.map((c) => [c.id, c.name]) ?? [])

  function handleUploaded(id: string) {
    setShowUploader(false)
    navigate(`/my-uploads/${id}`)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Uploads</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Math problems you've uploaded — AI extracts and formats them as worksheets.
          </p>
        </div>
        <button
          onClick={() => setShowUploader((v) => !v)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          {showUploader ? 'Cancel' : '+ Upload Image'}
        </button>
      </div>

      {showUploader && (
        <div className="mb-8 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-orange-900">Upload a Math Problem</h3>
          <UploadZone onUploaded={handleUploaded} />
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && !uploads?.length && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <svg className="mb-3 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-gray-500">No uploads yet</p>
          <p className="mt-1 text-sm text-gray-400">Upload a photo of a math problem to get started</p>
        </div>
      )}

      {!isLoading && !!uploads?.length && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploads.map((upload) => (
            <div key={upload.id} className="relative group">
              <UploadedWorksheetCard upload={upload} categoryName={categoryMap[upload.categoryId]} />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (confirm('Delete this upload?')) deleteUpload.mutate(upload.id)
                }}
                className="absolute right-2 top-2 hidden rounded-md bg-white p-1 text-gray-400 shadow-sm hover:text-red-600 group-hover:flex"
                aria-label="Delete upload"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
