import { ERROR_CATEGORIES } from '@/types/errorTaxonomy'
import type { GradedProblem } from '@/api/gradings'

interface Props { problem: GradedProblem }

const categoryLabel = (id: string | undefined): string => {
  if (!id) return ''
  return ERROR_CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export function GradingResult({ problem }: Props) {
  const correct = problem.isCorrect
  return (
    <div className={`rounded-lg border p-4 ${correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-sm text-gray-800">{problem.problemText}</p>
        <span className={`text-xs font-semibold ${correct ? 'text-green-700' : 'text-red-700'}`}>
          {correct ? '✓' : '✗'} {problem.studentAnswer || '(blank)'}
        </span>
      </div>
      {!correct && (
        <>
          <p className="mt-2 text-sm text-gray-700">
            Expected: <span className="font-semibold">{problem.expectedAnswer}</span>
          </p>
          {problem.errorCategory && (
            <p className="mt-1 text-xs uppercase tracking-wide text-red-600">
              {categoryLabel(problem.errorCategory)}
            </p>
          )}
          {problem.errorExplanation && (
            <p className="mt-1 text-sm text-gray-600">{problem.errorExplanation}</p>
          )}
        </>
      )}
    </div>
  )
}
