import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useUserUpload, useUpdateUpload } from '@/features/uploads'
import { MathRenderer } from '@/features/uploads/components/MathRenderer'
import { useAuthStore } from '@/features/auth/store'
import { ProgressEntryForm } from '@/features/progress/components/ProgressEntryForm'
import { generateSimilarProblem } from '@/api/claude'
import { userUploadsApi } from '@/api/userUploads'

export function UploadedWorksheetPage() {
  const { id } = useParams<{ id: string }>()
  const { data: upload, isLoading, error } = useUserUpload(id!)
  const user = useAuthStore((s) => s.user)
  const updateUpload = useUpdateUpload(id!, user?.id ?? '')
  const [showAnswers, setShowAnswers] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  if (isLoading) return <div className="p-6 animate-pulse h-40 bg-gray-100 rounded-xl m-6" />
  if (error || !upload) return <p className="p-6 text-red-600">Upload not found.</p>

  async function handleDownloadPdf() {
    const blob = await userUploadsApi.export(upload.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${upload.title}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleGenerateSimilar() {
    if (!upload) return
    setGenerating(true)
    setGenerateError('')
    try {
      const { problem, answer } = await generateSimilarProblem(upload.content, upload.answerSheet.content)
      const newContent = `${upload.content}\n\n---\n\n${problem}`
      const newAnswer = `${upload.answerSheet.content}\n\n---\n\n${answer}`
      await updateUpload.mutateAsync({ content: newContent, answerContent: newAnswer })
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/my-uploads" className="text-sm text-orange-600 hover:underline">← My Uploads</Link>

      <div className="mt-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">{upload.title}</h1>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
              My Upload
            </span>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download PDF
          </button>
          <button
            onClick={handleGenerateSimilar}
            disabled={generating}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Generate Similar Problem
              </>
            )}
          </button>
        </div>

        <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
          <span>{upload.level}</span>
          {upload.schoolGrade && <span>Grade {upload.schoolGrade}</span>}
        </div>

        {generateError && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{generateError}</p>
        )}
      </div>

      {upload.originalImageDataUrl && (
        <div className="mb-4">
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className="text-sm text-orange-600 hover:underline"
          >
            {showOriginal ? 'Hide original image' : 'Show original image'}
          </button>
          {showOriginal && (
            <img
              src={upload.originalImageDataUrl}
              alt="Original uploaded problem"
              className="mt-2 max-h-64 rounded-xl border border-gray-200 object-contain bg-gray-50 p-2"
            />
          )}
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setShowAnswers(false)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              !showAnswers ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
          >
            Worksheet
          </button>
          <button
            onClick={() => setShowAnswers(true)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              showAnswers ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
          >
            Answer Sheet
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <MathRenderer content={showAnswers ? upload.answerSheet.content : upload.content} />
        </div>
      </div>

      {user && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Log Attempt</h2>
          <ProgressEntryForm
            worksheetId={upload.id}
            worksheetTitle={upload.title}
            userId={user.id}
          />
        </div>
      )}
    </main>
  )
}
