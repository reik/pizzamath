import { useRef, useState } from 'react'
import { analyzeUploadedImage } from '@/api/claude'
import { useCreateUpload } from '../hooks/useUserUploads'
import { useAuthStore } from '@/features/auth/store'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AcceptedMediaType = (typeof ACCEPTED_TYPES)[number]

interface UploadZoneProps {
  onUploaded?: (id: string) => void
}

export function UploadZone({ onUploaded }: UploadZoneProps) {
  const user = useAuthStore((s) => s.user)
  const createUpload = useCreateUpload(user?.id ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type as AcceptedMediaType)) {
      setErrorMsg('Please upload a JPEG, PNG, WebP, or GIF image.')
      setStatus('error')
      return
    }

    setStatus('analyzing')
    setErrorMsg('')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)

      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type as AcceptedMediaType

      try {
        const metadata = await analyzeUploadedImage(base64, mediaType)

        setStatus('saving')
        const created = await createUpload.mutateAsync({
          title: metadata.title,
          categoryId: metadata.categoryId,
          subcategoryId: metadata.subcategoryId,
          level: metadata.level,
          schoolGrade: metadata.schoolGrade,
          content: metadata.content,
          answerContent: metadata.answerContent,
          originalImageDataUrl: dataUrl,
        })

        setStatus('idle')
        setPreview(null)
        onUploaded?.(created.id)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Upload failed. Please try again.')
        setStatus('error')
      }
    }
    reader.readAsDataURL(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const isProcessing = status === 'analyzing' || status === 'saving'

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !isProcessing && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) { e.preventDefault(); inputRef.current?.click() } }}
        role="button"
        tabIndex={0}
        aria-label="Upload worksheet image"
        aria-disabled={isProcessing}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer',
          isProcessing
            ? 'border-orange-300 bg-orange-50 cursor-not-allowed'
            : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={handleChange}
          disabled={isProcessing}
        />

        {preview && (
          <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-contain" />
        )}

        {status === 'analyzing' && (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <p className="text-sm font-medium text-orange-700">Analyzing image with AI…</p>
          </>
        )}

        {status === 'saving' && (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <p className="text-sm font-medium text-orange-700">Saving worksheet…</p>
          </>
        )}

        {status === 'idle' && (
          <>
            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-gray-600">
              Drop an image here or <span className="text-orange-600">click to browse</span>
            </p>
            <p className="text-xs text-gray-400">JPEG, PNG, WebP, GIF — AI will extract the math problem</p>
          </>
        )}
      </div>

      {status === 'error' && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}
    </div>
  )
}
