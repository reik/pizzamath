import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { GraphPlot, type GraphSpec } from './GraphPlot'

interface MathRendererProps {
  content: string
}

// Split content on ```graph ... ``` blocks so we can render them separately
function splitGraphBlocks(content: string): Array<{ type: 'markdown' | 'graph'; text: string }> {
  const parts = content.split(/(```graph\n[\s\S]*?```)/g)
  return parts
    .filter((p) => p.trim())
    .map((p) => {
      const match = p.match(/^```graph\n([\s\S]*?)```$/)
      return match
        ? { type: 'graph' as const, text: match[1] }
        : { type: 'markdown' as const, text: p }
    })
}

export function MathRenderer({ content }: MathRendererProps) {
  const blocks = splitGraphBlocks(content)

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === 'graph') {
          try {
            const spec = JSON.parse(block.text) as GraphSpec
            return <GraphPlot key={i} spec={spec} />
          } catch {
            return null
          }
        }

        return (
          <div key={i} className="math-content">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-900">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1.5 text-gray-900">{children}</h3>,
                p: ({ children }) => <p className="mb-2 text-sm leading-relaxed text-gray-800">{children}</p>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-2 text-sm text-gray-800">{children}</ol>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1.5 text-sm text-gray-800">{children}</ul>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                hr: () => <hr className="border-gray-200 my-4" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border-collapse text-sm">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="border border-gray-300 bg-gray-50 px-3 py-1.5 text-left font-semibold text-gray-700">{children}</th>,
                td: ({ children }) => <td className="border border-gray-300 px-3 py-1.5 text-gray-800">{children}</td>,
              }}
            >
              {block.text}
            </ReactMarkdown>
          </div>
        )
      })}
    </div>
  )
}
