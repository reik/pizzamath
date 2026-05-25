import { Link } from 'react-router-dom'
import { useInsights } from '@/features/gradings/hooks/useInsights'
import { InsightsChart } from '@/features/gradings/components/InsightsChart'

export function InsightsPage() {
  const { data, isLoading } = useInsights()
  if (isLoading || !data) return <p className="p-6 text-gray-500">Loading…</p>

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Skill-gap Insights</h1>
      <p className="mt-1 text-gray-600">
        {data.totalGradings} worksheet{data.totalGradings === 1 ? '' : 's'} graded.
      </p>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Most common mistakes</h2>
        <InsightsChart data={data.byCategory} />
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700">Recent gradings</h2>
        <ul className="mt-2 space-y-1">
          {data.recent.map((g) => (
            <li key={g.id} className="text-sm">
              <Link to={`/gradings/${g.id}`} className="text-orange-600 hover:underline">
                {g.score} / {g.total} — {new Date(g.createdAt).toLocaleDateString()}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
