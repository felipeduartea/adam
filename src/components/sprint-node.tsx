// // "use client"

// // import { Handle, Position } from "@xyflow/react"
// // import { Calendar, Clock } from "lucide-react"

// // export default function SprintNode({ data }: any) {
// //   return (
// //     <div className="rounded-xl border-2 border-primary/30 bg-card/50 backdrop-blur-sm p-6 shadow-xl min-w-[380px] min-h-[500px]">
// //       <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />

// //       <div className="mb-4 pb-4 border-b border-border">
// //         <div className="flex items-start gap-3">
// //           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
// //             <Calendar className="h-5 w-5 text-primary" />
// //           </div>
// //           <div className="flex-1 min-w-0">
// //             <h3 className="text-base font-semibold text-foreground leading-tight">{data.label}</h3>
// //             {data.description && <p className="mt-1 text-sm text-muted-foreground leading-snug">{data.description}</p>}
// //           </div>
// //         </div>

// //         {data.start_date && data.due_date && (
// //           <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
// //             <Clock className="h-3.5 w-3.5" />
// //             <span>
// //               {new Date(data.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
// //               {new Date(data.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
// //             </span>
// //           </div>
// //         )}
// //       </div>

// //       <div className="space-y-3 min-h-[350px]">
// //         {/* Child nodes (issues) will appear here automatically via React Flow's parent-child system */}
// //       </div>

// //       <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
// //     </div>
// //   )
// // }

// "use client"

// import { Handle, Position } from "@xyflow/react"
// import { Calendar, Clock } from "lucide-react"

// export default function SprintNode({ data }: any) {
//   return (
//     <div className="rounded-xl border-2 border-primary/30 bg-card/50 backdrop-blur-sm p-6 shadow-xl min-w-[380px] h-full">
//       <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />

//       <div className="mb-4 pb-4 border-b border-border">
//         <div className="flex items-start gap-3">
//           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
//             <Calendar className="h-5 w-5 text-primary" />
//           </div>
//           <div className="flex-1 min-w-0">
//             <h3 className="text-base font-semibold text-foreground leading-tight">{data.label}</h3>
//             {data.description && <p className="mt-1 text-sm text-muted-foreground leading-snug">{data.description}</p>}
//           </div>
//         </div>

//         {data.start_date && data.due_date && (
//           <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
//             <Clock className="h-3.5 w-3.5" />
//             <span>
//               {new Date(data.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
//               {new Date(data.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
//             </span>
//           </div>
//         )}
//       </div>

//       <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
//     </div>
//   )
// }

"use client"

import { Handle, Position } from "@xyflow/react"
import { Calendar, Clock } from "lucide-react"

export default function SprintNode({ data }: any) {
  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card/50 backdrop-blur-sm p-6 shadow-xl min-w-[380px] h-full">
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />

      <div className="mb-4 pb-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground leading-tight">{data.label}</h3>
            {data.description && <p className="mt-1 text-sm text-muted-foreground leading-snug">{data.description}</p>}
          </div>
        </div>

        {data.start_date && data.due_date && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {new Date(data.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
              {new Date(data.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 min-h-[350px]">
        {/* Child nodes (issues) will appear here automatically via React Flow's parent-child system */}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </div>
  )
}
