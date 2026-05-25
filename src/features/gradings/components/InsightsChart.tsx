import { ERROR_CATEGORIES } from '@/types/errorTaxonomy'

interface Props {
  data: { category: string; count: number }[]
}

export function InsightsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No recurring mistakes yet — grade a worksheet to start tracking.
      </p>
    )
  }
  const max = Math.max(...data.map((d) => d.count))
  return (
    <ul className="space-y-2">
      {data.map((d) => {
        const label = ERROR_CATEGORIES.find((c) => c.id === d.category)?.label ?? d.category
        const pct = (d.count / max) * 100
        return (
          <li key={d.category} className="flex items-center gap-3">
            <span className="w-48 truncate text-sm text-gray-700">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100">
              <div className="h-full rounded bg-orange-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right font-mono text-xs text-gray-500">{d.count}</span>
          </li>
        )
      })}
    </ul>
  )
}
