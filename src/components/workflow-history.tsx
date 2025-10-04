"use client"

import { useState, useEffect } from "react"
import type { SavedWorkflow } from "./workflow-builder"
import { Clock, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface WorkflowHistoryProps {
  onLoadWorkflow: (workflow: SavedWorkflow) => void
  currentWorkflowId: string | null
  onClose: () => void
}

export default function WorkflowHistory({ onLoadWorkflow, currentWorkflowId, onClose }: WorkflowHistoryProps) {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = () => {
    const saved = localStorage.getItem("workflows")
    if (saved) {
      setWorkflows(JSON.parse(saved))
    }
  }

  const deleteWorkflow = (id: string) => {
    const updated = workflows.filter((w) => w.id !== id)
    localStorage.setItem("workflows", JSON.stringify(updated))
    setWorkflows(updated)
    setDeleteId(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Workflow History</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Workflow List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No saved workflows yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Create and save your first workflow</p>
            </div>
          ) : (
            workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`group relative rounded-lg border p-3 transition-colors hover:bg-accent/5 ${
                  currentWorkflowId === workflow.id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <button
                  onClick={() => onLoadWorkflow(workflow)}
                  className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground leading-tight">{workflow.name}</h3>
                    {currentWorkflowId === workflow.id && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{workflow.nodes.length} nodes</span>
                    <span>•</span>
                    <span>{formatDate(workflow.updatedAt)}</span>
                  </div>
                </button>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteId(workflow.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteWorkflow(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
