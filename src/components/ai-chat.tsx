"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Bot, User } from "lucide-react"
import type { Node, Edge } from "@xyflow/react"

interface AIChatProps {
  nodes: Node[]
  setNodes: (nodes: Node[]) => void
  edges: Edge[]
  setEdges: (edges: Edge[]) => void
}

export default function AIChat({ nodes, setNodes, edges, setEdges }: AIChatProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // const { messages, sendMessage, status } = useChat({
  //   api: "/api/workflow-chat",
  // })

  const { messages, append, status } = useChat({  
    api: "/api/workflow-chat",
  })
  
  // wrapper to behave like sendMessage
  const sendMessage = (text: string) =>
    append({
      role: "user",
      content: text,
    })  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === "submitted" || status === "streaming") return

    const context = JSON.stringify({ nodes, edges })
    // sendMessage(`${input}\n\nCurrent workflow: ${context}`)
    sendMessage(input)
    setInput("")
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Chat Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Bot className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Ask me to build your workflow</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">Start by describing your workflow</p>
              <p className="mt-1 text-xs text-muted-foreground">Try: "Create a data processing workflow"</p>
            </div>
          </div>
        )}

        {messages.map((message: { id: React.Key | null | undefined; role: string; parts: any[] }) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Bot className="h-4 w-4 text-accent" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {message.parts.map((part: { type: string; text: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined }, index: React.Key | null | undefined) => {
                if (part.type === "text") {
                  return (
                    <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
                      {part.text}
                    </p>
                  )
                }
                return null
              })}
            </div>

            {message.role === "user" && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        ))}

        {(status === "submitted" || status === "streaming") && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-secondary-foreground" />
              <span className="text-sm text-secondary-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your workflow..."
            disabled={status === "submitted" || status === "streaming"}
            className="flex-1 bg-background"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || status === "submitted" || status === "streaming"}>
            {(status === "submitted" || status === "streaming") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
