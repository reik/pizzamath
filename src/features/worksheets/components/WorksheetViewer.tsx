import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Worksheet } from '@/types/worksheet'
import { cn } from '@/utils/cn'
import { GeometryRenderer } from './GeometryRenderer'

interface WorksheetViewerProps {
  worksheet: Worksheet
}

function WorksheetContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="mb-4 border-b-2 border-orange-400 pb-2 text-center text-2xl font-bold text-gray-900">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 mt-6 text-lg font-semibold text-gray-800 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-4 font-semibold text-gray-700">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 leading-relaxed text-gray-700">{children}</p>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-2 space-y-3 list-decimal list-inside text-gray-700">{children}</ol>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 ml-2 space-y-2 list-disc list-inside text-gray-700">{children}</ul>
        ),
        li: ({ children }) => (
          <li className="text-gray-700">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
        hr: () => <hr className="my-6 border-gray-200" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
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

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {(worksheet.categoryId === 'cat-6' || worksheet.categoryId === 'cat-12') && !showAnswers ? (
          <GeometryRenderer content={worksheet.content} />
        ) : (
          <WorksheetContent content={showAnswers ? worksheet.answerSheet.content : worksheet.content} />
        )}
      </div>
    </div>
  )
}
