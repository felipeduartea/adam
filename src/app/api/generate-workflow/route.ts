import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const systemPrompt = `You are an AI assistant helping users build workflows. 
When users describe what they want, provide clear, helpful guidance about workflow design.
Suggest node types like: start, database, code, action, condition, end.
Be concise and actionable in your responses.`

  const prompt = convertToModelMessages([
    { role: "system", parts: [{ type: "text", text: systemPrompt }] },
    ...messages,
  ])

  const result = streamText({
    model: "openai/gpt-5-mini",
    prompt,
    maxOutputTokens: 1000,
    temperature: 0.7,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log("[v0] Chat aborted")
      }
    },
    consumeSseStream: consumeStream,
  })
}
