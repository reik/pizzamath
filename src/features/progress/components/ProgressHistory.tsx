import { Link } from 'react-router-dom'
import type { ProgressEntry } from '@/types/progress'

interface ProgressHistoryProps {
  entries: ProgressEntry[]
}

export function ProgressHistory({ entries }: ProgressHistoryProps) {
  if (!entries.length) {
    return <p className="text-sm text-gray-500">No attempts logged yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Worksheet attempt history</caption>
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-600">
            <th scope="col" className="pb-2 pr-4 font-medium">Worksheet</th>
            <th scope="col" className="pb-2 pr-4 font-medium">Date</th>
            <th scope="col" className="pb-2 pr-4 font-medium">Score</th>
            <th scope="col" className="pb-2 font-medium">Comment</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-medium">
                <Link to={`/worksheets/${e.worksheetId}`} className="text-orange-600 hover:underline">
                  {e.worksheetTitle}
                </Link>
              </td>
              <td className="py-2 pr-4 text-gray-600">{e.date}</td>
              <td className="py-2 pr-4">
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  {e.score}%
                </span>
              </td>
              <td className="py-2 text-gray-600">{e.comment || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
