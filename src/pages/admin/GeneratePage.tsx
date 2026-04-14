import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GenerationChat } from '@/features/admin/components/GenerationChat'
import { WorksheetForm } from '@/features/admin/components/WorksheetForm'
import { useAdminWorksheets } from '@/features/admin/hooks/useAdminWorksheets'
import type { WorksheetFormInput } from '@/api/worksheets'

export function GeneratePage() {
  const navigate = useNavigate()
  const { createMutation } = useAdminWorksheets()
  const [prefill, setPrefill] = useState<Partial<WorksheetFormInput>>({})

  function handleGenerate(metadata: Partial<WorksheetFormInput>) {
    setPrefill(metadata)
  }

  function handleSave(data: WorksheetFormInput) {
    createMutation.mutate(data, {
      onSuccess: () => navigate('/admin'),
    })
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Worksheet with AI</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Chat with Claude</h2>
          <GenerationChat onGenerate={handleGenerate} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Worksheet Details</h2>
          <WorksheetForm
            defaultValues={prefill}
            onSubmit={handleSave}
            isPending={createMutation.isPending}
          />
        </div>
      </div>
    </main>
  )
}
