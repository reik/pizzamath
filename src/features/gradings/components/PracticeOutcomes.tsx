import { ERROR_CATEGORIES } from '@/types/errorTaxonomy'
import type { PracticeOutcome } from '@/api/gradings'

const LABEL_BY_ID = new Map(ERROR_CATEGORIES.map((c) => [c.id, c.label]))

const STATUS_STYLE: Record<PracticeOutcome['status'], { label: string; classes: string }> = {
  fixed: { label: '✓ Fixed', classes: 'bg-green-100 text-green-800' },
  still_struggling: { label: 'Still struggling', classes: 'bg-amber-100 text-amber-800' },
  insufficient_data: { label: 'Needs more data', classes: 'bg-gray-100 text-gray-600' },
}

interface PracticeOutcomesProps {
  outcomes: PracticeOutcome[]
}

export function PracticeOutcomes({ outcomes }: PracticeOutcomesProps) {
  if (outcomes.length === 0) return null
  return (
    <ul className="space-y-2">
      {outcomes.map((o) => {
        const style = STATUS_STYLE[o.status]
        return (
          <li key={o.category} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-800">{LABEL_BY_ID.get(o.category) ?? o.category}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                pre {o.preDrillErrors} · post {o.postDrillErrors}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${style.classes}`}>
                {style.label}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
