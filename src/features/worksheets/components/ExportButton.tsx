import { worksheetsApi } from '@/api/worksheets'

interface ExportButtonProps {
  worksheetId: string
  worksheetTitle: string
  format: 'pdf' | 'doc'
}

export function ExportButton({ worksheetId, worksheetTitle, format }: ExportButtonProps) {
  async function handleExport() {
    const blob = await worksheetsApi.export(worksheetId, format)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${worksheetTitle}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
    >
      Download {format.toUpperCase()}
    </button>
  )
}
