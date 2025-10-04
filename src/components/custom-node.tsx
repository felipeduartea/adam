"use client"

import { Handle, Position } from "@xyflow/react"
import { Play, Database, Code, Zap } from "lucide-react"

const iconMap: Record<string, any> = {
  start: Play,
  database: Database,
  code: Code,
  action: Zap,
}

export default function CustomNode({ data }: any) {
  const Icon = iconMap[data.type] || Play

  return (
    <div className="rounded-lg border-2 border-border bg-card px-4 py-3 shadow-lg transition-all hover:border-primary">
      <Handle type="target" position={Position.Top} className="!bg-primary" />

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{data.label}</div>
          {data.description && <div className="text-xs text-muted-foreground">{data.description}</div>}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  )
}
