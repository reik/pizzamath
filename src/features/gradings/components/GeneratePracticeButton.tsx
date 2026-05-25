import { useNavigate } from 'react-router-dom'
import { useGenerateTargetedPractice } from '../hooks/useGenerateTargetedPractice'

export function GeneratePracticeButton({ gradingId }: { gradingId: string }) {
  const navigate = useNavigate()
  const { mutate, isPending, error } = useGenerateTargetedPractice()
  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={isPending}
        onClick={() => mutate(gradingId, { onSuccess: (w) => navigate(`/worksheets/${w.id}`) })}
        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {isPending ? 'Generating…' : 'Generate targeted practice'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error.message}</p>}
    </div>
  )
}
