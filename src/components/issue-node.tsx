// "use client"
// import { CheckCircle2, Circle, Clock, XCircle, User } from "lucide-react"

// const statusIconMap: Record<string, any> = {
//   todo: Circle,
//   in_progress: Clock,
//   done: CheckCircle2,
//   blocked: XCircle,
// }

// const statusColorMap: Record<string, string> = {
//   todo: "border-gray-400/50 bg-gray-500/5",
//   in_progress: "border-blue-500/50 bg-blue-500/5",
//   done: "border-green-500/50 bg-green-500/5",
//   blocked: "border-red-500/50 bg-red-500/5",
// }

// const statusTextColorMap: Record<string, string> = {
//   todo: "text-gray-400",
//   in_progress: "text-blue-500",
//   done: "text-green-500",
//   blocked: "text-red-500",
// }

// export default function IssueNode({ data }: any) {
//   const status = data.status || "todo"
//   const StatusIcon = statusIconMap[status] || Circle
//   const statusColor = statusColorMap[status] || "border-gray-400/50 bg-gray-500/5"
//   const statusTextColor = statusTextColorMap[status] || "text-gray-400"

//   return (
//     <div
//       className={`rounded-lg border-2 ${statusColor} px-3.5 py-3 shadow-sm hover:shadow-md transition-all min-w-[340px] backdrop-blur-sm`}
//     >
//       <div className="flex items-start gap-2.5">
//         <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${statusTextColor}`} />
//         <div className="flex-1 min-w-0">
//           <div className="text-sm font-medium text-foreground leading-snug">{data.label}</div>
//           {data.description && (
//             <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">{data.description}</div>
//           )}
//           <div className="mt-2.5 flex items-center gap-2.5 text-xs">
//             <span className={`capitalize font-medium ${statusTextColor}`}>{status.replace("_", " ")}</span>
//             {data.user && (
//               <>
//                 <span className="text-muted-foreground">•</span>
//                 <div className="flex items-center gap-1.5 text-muted-foreground">
//                   <User className="h-3 w-3" />
//                   <span>{data.user.name}</span>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"
import { CheckCircle2, Circle, Clock, XCircle, User } from "lucide-react"

const statusIconMap: Record<string, any> = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: XCircle,
}

const statusColorMap: Record<string, string> = {
  todo: "border-gray-400/50 bg-gray-500/5",
  in_progress: "border-blue-500/50 bg-blue-500/5",
  done: "border-green-500/50 bg-green-500/5",
  blocked: "border-red-500/50 bg-red-500/5",
}

const statusTextColorMap: Record<string, string> = {
  todo: "text-gray-400",
  in_progress: "text-blue-500",
  done: "text-green-500",
  blocked: "text-red-500",
}

function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export default function IssueNode({ data }: any) {
  const status = data.status || "todo"
  const StatusIcon = statusIconMap[status] || Circle
  const statusColor = statusColorMap[status] || "border-gray-400/50 bg-gray-500/5"
  const statusTextColor = statusTextColorMap[status] || "text-gray-400"

  return (
    <div
      className={`rounded-lg border-2 ${statusColor} px-3 py-2 shadow-sm hover:shadow-md transition-all min-w-[280px] max-w-[380px] backdrop-blur-sm group relative`}
      title={data.description || undefined}
    >
      <div className="flex items-start gap-2">
        <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${statusTextColor}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground leading-tight">
            {truncateText(data.label, 50)}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className={`capitalize font-medium ${statusTextColor}`}>{status.replace("_", " ")}</span>
            {data.user && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{data.user.name}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Tooltip for description on hover */}
      {data.description && (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
          <div className="font-semibold mb-1">Description:</div>
          <div className="text-muted-foreground leading-relaxed">{data.description}</div>
        </div>
      )}
    </div>
  )
}
