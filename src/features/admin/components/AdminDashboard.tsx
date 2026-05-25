import { Link } from 'react-router-dom'
import { useAdminWorksheets } from '../hooks/useAdminWorksheets'

export function AdminDashboard() {
  const { query, deleteMutation } = useAdminWorksheets()

  if (query.isLoading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />
  if (query.error) return <p className="text-red-600">Failed to load worksheets.</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          All Worksheets ({query.data?.length ?? 0})
        </h2>
        <Link
          to="/admin/generate"
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + Generate with AI
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">All worksheets</caption>
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th scope="col" className="pb-2 pr-4 font-medium">Title</th>
              <th scope="col" className="pb-2 pr-4 font-medium">Level</th>
              <th scope="col" className="pb-2 pr-4 font-medium">Grade</th>
              <th scope="col" className="pb-2 pr-4 font-medium">Author</th>
              <th scope="col" className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {query.data?.map((ws) => (
              <tr key={ws.id} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium text-gray-800">
                  <Link to={`/worksheets/${ws.id}`} className="hover:underline text-orange-600">{ws.title}</Link>
                </td>
                <td className="py-2 pr-4 text-gray-600">{ws.level}</td>
                <td className="py-2 pr-4 text-gray-600">{ws.schoolGrade ?? '—'}</td>
                <td className="py-2 pr-4 text-gray-600">{ws.author}</td>
                <td className="py-2">
                  <button
                    onClick={() => deleteMutation.mutate(ws.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:underline text-xs disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
