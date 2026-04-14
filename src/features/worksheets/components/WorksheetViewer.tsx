import { useState } from 'react'
import type { Worksheet } from '@/types/worksheet'
import { cn } from '@/utils/cn'

interface WorksheetViewerProps {
  worksheet: Worksheet
}

export function WorksheetViewer({ worksheet }: WorksheetViewerProps) {
  const [showAnswers, setShowAnswers] = useState(false)

  return (
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

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm whitespace-pre-wrap font-mono text-sm leading-relaxed">
        {showAnswers ? worksheet.answerSheet.content : worksheet.content}
      </div>
    </div>
  )
}
