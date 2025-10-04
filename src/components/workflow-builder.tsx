"use client"

import { useState, useEffect } from "react"
import WorkflowCanvas from "./workflow-canvas"
import WorkflowInput from "./workflow-input"
import WorkflowHistory from "./workflow-history"
import { Sparkles, Workflow, Save, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export interface SavedWorkflow {
  id: string
  name: string
  nodes: any[]
  edges: any[]
  createdAt: string
  updatedAt: string
}

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [workflowName, setWorkflowName] = useState("")
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)

  const loadWorkflow = (workflow: SavedWorkflow) => {
    setNodes(workflow.nodes)
    setEdges(workflow.edges)
    setCurrentWorkflowId(workflow.id)
    setShowHistory(false)
  }

  const saveWorkflow = () => {
    if (!workflowName.trim()) return

    const workflows = JSON.parse(localStorage.getItem("workflows") || "[]")
    const now = new Date().toISOString()

    if (currentWorkflowId) {
      // Update existing workflow
      const index = workflows.findIndex((w: SavedWorkflow) => w.id === currentWorkflowId)
      if (index !== -1) {
        workflows[index] = {
          ...workflows[index],
          name: workflowName,
          nodes,
          edges,
          updatedAt: now,
        }
      }
    } else {
      // Create new workflow
      const newWorkflow: SavedWorkflow = {
        id: crypto.randomUUID(),
        name: workflowName,
        nodes,
        edges,
        createdAt: now,
        updatedAt: now,
      }
      workflows.unshift(newWorkflow)
      setCurrentWorkflowId(newWorkflow.id)
    }

    localStorage.setItem("workflows", JSON.stringify(workflows))
    setShowSaveDialog(false)
    setWorkflowName("")
  }

  useEffect(() => {
    if (currentWorkflowId) {
      const workflows = JSON.parse(localStorage.getItem("workflows") || "[]")
      const current = workflows.find((w: SavedWorkflow) => w.id === currentWorkflowId)
      if (current) {
        setWorkflowName(current.name)
      }
    }
  }, [currentWorkflowId])

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              ADAM
            </h1>
            <p className="text-sm text-muted-foreground">Rethink your decision-making</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Save className="h-4 w-4" />
                Save Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Workflow</DialogTitle>
                <DialogDescription>Give your workflow a name to save it for later.</DialogDescription>
              </DialogHeader>
              <Input
                placeholder="Enter workflow name..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveWorkflow()}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveWorkflow} disabled={!workflowName.trim()}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4" />
            History
          </Button>

          <div className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">AI Powered</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex flex-1 overflow-hidden">
        {showHistory && (
          <div className="absolute left-0 top-0 z-10 h-full w-80 flex-shrink-0 border-r border-border bg-background">
            <WorkflowHistory
              onLoadWorkflow={loadWorkflow}
              currentWorkflowId={currentWorkflowId}
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}

        {/* Workflow Canvas - Full Width */}
        <div className="flex-1">
          <WorkflowCanvas nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
        </div>

        {/* AI Input - Bottom Center */}
        <WorkflowInput nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
      </div>
    </div>
  )
}
