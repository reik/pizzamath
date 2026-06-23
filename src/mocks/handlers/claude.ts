import { http, HttpResponse } from 'msw'

export const claudeHandlers = [
  http.post('/api/claude/analyze-image', () => {
    return HttpResponse.json({
      categoryId: 'cat-2',
      subcategoryId: 'sub-2-1',
      level: 'Beginner',
      schoolGrade: '3',
      title: 'Addition and Subtraction Practice',
      content: 'Solve the following problems:\n1. 24 + 37 = ?\n2. 85 - 46 = ?\n3. 13 + 58 = ?\n4. 72 - 29 = ?',
      answerContent: '1. 61\n2. 39\n3. 71\n4. 43',
    })
  }),

  http.post('/api/claude/chat', () => {
    const stream = new ReadableStream({
      start(controller) {
        const tokens = [
          'Here', ' is', ' a', ' sample', ' math', ' worksheet', '.',
          '\n\n```json\n',
          JSON.stringify({
            categoryId: 'cat-2',
            subcategoryId: 'sub-2-1',
            level: 'Beginner',
            schoolGrade: '3',
            title: 'Practice Worksheet',
            content: 'Solve:\n1. 5 + 7 = ?\n2. 12 - 4 = ?',
            answerContent: '1. 12\n2. 8',
          }),
          '\n```',
        ]
        const encoder = new TextEncoder()
        tokens.forEach(token => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
        })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }),

  http.post('/api/claude/similar-problem', () => {
    return HttpResponse.json({
      problem: 'Solve the following:\n1. 18 + 25 = ?\n2. 63 - 37 = ?',
      answer: '1. 43\n2. 26',
    })
  }),
]
