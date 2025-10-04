"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Sparkles } from "lucide-react"
import type { Node, Edge } from "@xyflow/react"
import { convertEntitiesToNodes } from "@/lib/workflow-utils"

interface WorkflowInputProps {
  nodes: Node[]
  setNodes: (nodes: Node[]) => void
  edges: Edge[]
  setEdges: (edges: Edge[]) => void
}

export default function WorkflowInput({ nodes, setNodes, edges, setEdges }: WorkflowInputProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate workflow")

      const data = await response.json()

      const { nodes: newNodes, edges: newEdges } = convertEntitiesToNodes({
        projects: data.projects || [],
        sprints: data.sprints || [],
        issues: data.issues || [],
        users: [],
      })

      // Replace current workflow with new one
      setNodes(newNodes)
      setEdges(newEdges)

      setInput("")
    } catch (error) {
      console.error("Error generating workflow:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="absolute bottom-0 left-1/2 z-20 mb-8 w-full max-w-2xl -translate-x-1/2 px-4">
      <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your project... (e.g., 'Build a mobile app with authentication and user profiles')"
              disabled={isLoading}
              className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button type="submit" size="lg" disabled={!input.trim() || isLoading} className="gap-2 px-6">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI will generate a project workflow with sprints and issues
        </p>
      </div>
    </div>
  )
}
