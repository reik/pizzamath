import { useParams, Link } from 'react-router-dom'
import { useGrading } from '@/features/gradings/hooks/useGrading'
import { GradingResult } from '@/features/gradings/components/GradingResult'
import { ErrorBreakdown } from '@/features/gradings/components/ErrorBreakdown'

export function GradingPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useGrading(id)

  if (isLoading) return <p className="p-6 text-gray-500">Loading grading…</p>
  if (error || !data) return <p className="p-6 text-red-600">Could not load grading.</p>

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/my-uploads" className="text-sm text-orange-600 hover:underline">← Back to uploads</Link>
      <h1 className="mt-2 text-2xl font-bold">Worksheet Grading</h1>
      <p className="mt-1 text-gray-600">Score: <span className="font-semibold">{data.score} / {data.total}</span></p>

      <ErrorBreakdown problems={data.problems} />

      <ol className="mt-8 space-y-4">
        {data.problems.map((p) => (
          <li key={p.problemIndex}><GradingResult problem={p} /></li>
        ))}
      </ol>
    </main>
  )
}
