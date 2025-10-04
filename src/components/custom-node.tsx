"use client"

import { Handle, Position } from "@xyflow/react"
import { FolderKanban, Calendar, CheckCircle2, Circle, Clock, XCircle } from "lucide-react"
import type { Project, Sprint, Issue } from "@/types/entities"

const typeIconMap: Record<string, any> = {
  project: FolderKanban,
  sprint: Calendar,
  issue: CheckCircle2,
}

const statusIconMap: Record<string, any> = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: XCircle,
}

const statusColorMap: Record<string, string> = {
  todo: "text-gray-400",
  in_progress: "text-blue-500",
  done: "text-green-500",
  blocked: "text-red-500",
}

const typeColorMap: Record<string, string> = {
  project: "border-purple-500 bg-purple-500/10",
  sprint: "border-blue-500 bg-blue-500/10",
  issue: "border-green-500 bg-green-500/10",
}

export default function CustomNode({ data }: any) {
  const Icon = typeIconMap[data.type] || FolderKanban
  const entity = data.entity as Project | Sprint | Issue
  const borderColor = typeColorMap[data.type] || "border-border"

  const renderEntityDetails = () => {
    if (data.type === "issue") {
      const issue = entity as Issue
      const StatusIcon = statusIconMap[issue.status]
      const statusColor = statusColorMap[issue.status]

      return (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <StatusIcon className={`h-3 w-3 ${statusColor}`} />
          <span className="capitalize">{issue.status.replace("_", " ")}</span>
          {issue.user && (
            <>
              <span>•</span>
              <span>{issue.user.name}</span>
            </>
          )}
        </div>
      )
    }

    if (data.type === "sprint" || data.type === "project") {
      const dated = entity as Sprint | Project
      if (dated.start_date && dated.due_date) {
        return (
          <div className="mt-2 text-xs text-muted-foreground">
            {new Date(dated.start_date).toLocaleDateString()} - {new Date(dated.due_date).toLocaleDateString()}
          </div>
        )
      }
    }

    return null
  }

  return (
    <div
      className={`rounded-lg border-2 ${borderColor} bg-card px-4 py-3 shadow-lg transition-all hover:shadow-xl min-w-[200px] max-w-[280px]`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground leading-tight">{data.label}</div>
          {entity.description && (
            <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{entity.description}</div>
          )}
          {renderEntityDetails()}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  )
}
