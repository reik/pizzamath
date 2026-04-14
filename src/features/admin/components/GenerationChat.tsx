import { useState, useRef, useEffect } from 'react'
import { useGenerationSession } from '../hooks/useGenerationSession'
import type { WorksheetFormInput } from '@/api/worksheets'

interface GenerationChatProps {
  onGenerate: (metadata: Partial<WorksheetFormInput>) => void
}

export function GenerationChat({ onGenerate }: GenerationChatProps) {
  const { messages, isStreaming, generatedMetadata, sendMessage, generate } = useGenerationSession()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (generatedMetadata) onGenerate(generatedMetadata)
  }, [generatedMetadata, onGenerate])

  async function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    await sendMessage(text)
  }

  const hasConversation = messages.length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-[300px] max-h-[500px] border border-gray-200 rounded-xl bg-gray-50">
        {!hasConversation && (
          <p className="text-sm text-gray-400 text-center mt-8">
            Describe the worksheet you want to create. Ask Claude for help refining it, then click Generate.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              {msg.content || <span className="animate-pulse">▌</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Describe the worksheet you want…"
          rows={2}
          disabled={isStreaming}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Send
          </button>
          {hasConversation && (
            <button
              onClick={generate}
              disabled={isStreaming}
              className="rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              Generate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
