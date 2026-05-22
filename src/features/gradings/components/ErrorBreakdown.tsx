import { ERROR_CATEGORIES } from '@/types/errorTaxonomy'
import type { GradedProblem } from '@/api/gradings'

interface Props { problems: GradedProblem[] }

export function ErrorBreakdown({ problems }: Props) {
  const wrong = problems.filter((p) => !p.isCorrect && p.errorCategory)
  const total = problems.length
  if (wrong.length === 0) {
    return <p className="mt-4 text-sm text-green-700">No mistakes — nice work!</p>
  }

  const counts = new Map<string, number>()
  for (const p of wrong) {
    if (!p.errorCategory) continue
    counts.set(p.errorCategory, (counts.get(p.errorCategory) ?? 0) + 1)
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])

  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Where the mistakes are</h2>
      <ul className="mt-3 space-y-2">
        {sorted.map(([catId, count]) => {
          const label = ERROR_CATEGORIES.find((c) => c.id === catId)?.label ?? catId
          return (
            <li key={catId} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{label}</span>
              <span className="font-mono text-xs text-gray-500">{count} of {total}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
