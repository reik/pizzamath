import { useState, useCallback } from 'react'
import { chatWithGenerator, parseGeneratedMetadata, type ChatMessage } from '@/api/claude'
import type { WorksheetFormInput } from '@/api/worksheets'

export function useGenerationSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [generatedMetadata, setGeneratedMetadata] = useState<Partial<WorksheetFormInput> | null>(null)

  const sendMessage = useCallback(async (userText: string) => {
    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: userText }]
    setMessages(updatedMessages)
    setIsStreaming(true)

    let assistantResponse = ''
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      await chatWithGenerator(updatedMessages, (token) => {
        assistantResponse += token
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: assistantResponse }
          return next
        })
      })
    } finally {
      setIsStreaming(false)
    }

    return assistantResponse
  }, [messages])

  const generate = useCallback(async () => {
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: 'Generate the worksheet now based on our conversation.' },
    ]
    setMessages(updatedMessages)
    setIsStreaming(true)

    let assistantResponse = ''
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      await chatWithGenerator(
        updatedMessages,
        (token) => {
          assistantResponse += token
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: assistantResponse }
            return next
          })
        },
        true, // isGenerating — use max_tokens: 2048
      )
    } finally {
      setIsStreaming(false)
    }

    const metadata = parseGeneratedMetadata(assistantResponse)
    setGeneratedMetadata(metadata)
  }, [messages])

  const reset = useCallback(() => {
    setMessages([])
    setGeneratedMetadata(null)
  }, [])

  return { messages, isStreaming, generatedMetadata, sendMessage, generate, reset }
}
