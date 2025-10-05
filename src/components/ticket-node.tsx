"use client"
import { Ticket, User } from "lucide-react"

const priorityColors: Record<string, string> = {
  urgent: "border-red-500/50 bg-red-500/10",
  high: "border-orange-500/50 bg-orange-500/10",
  normal: "border-blue-500/50 bg-blue-500/10",
  low: "border-gray-500/50 bg-gray-500/10",
}

const priorityTextColors: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  normal: "text-blue-500",
  low: "text-gray-500",
}

function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export default function TicketNode({ data }: any) {
  const priority = data.priority || "normal"
  const priorityColor = priorityColors[priority] || "border-blue-500/50 bg-blue-500/10"
  const priorityTextColor = priorityTextColors[priority] || "text-blue-500"

  return (
    <div
      className={`rounded-lg border-2 ${priorityColor} px-3 py-2 shadow-sm hover:shadow-md transition-all min-w-[280px] max-w-[380px] backdrop-blur-sm group relative`}
      title={data.description || undefined}
    >
      <div className="flex items-start gap-2">
        <Ticket className={`h-4 w-4 mt-0.5 shrink-0 ${priorityTextColor}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground leading-tight">
            {truncateText(data.label, 50)}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className={`capitalize font-medium ${priorityTextColor}`}>{priority}</span>
            {data.requester && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{data.requester}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Tooltip for description on hover */}
      {data.description && (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
          <div className="font-semibold mb-1">Ticket Description:</div>
          <div className="text-muted-foreground leading-relaxed">{data.description}</div>
        </div>
      )}
    </div>
  )
}

