// // import { memo } from "react"
// // import type { NodeProps, Node } from "@xyflow/react"
// // import { Calendar } from "lucide-react"

// // interface GroupNodeData extends Record<string, unknown> {
// //   label: string
// //   description: string
// //   start_date: string
// //   due_date: string
// // }

// // function GroupNode({ data }: NodeProps<Node<GroupNodeData>>) {
// //   return (
// //     <div className="w-full h-full flex flex-col">
// //       <div className="mb-3">
// //         <h3 className="text-lg font-semibold text-foreground mb-1">{data.label}</h3>
// //         {data.description && (
// //           <p className="text-sm text-muted-foreground mb-2">{data.description}</p>
// //         )}
// //         {data.start_date && data.due_date && (
// //           <div className="flex items-center gap-2 text-xs text-muted-foreground">
// //             <Calendar className="w-3.5 h-3.5" />
// //             <span>
// //               {new Date(data.start_date).toLocaleDateString()} –{" "}
// //               {new Date(data.due_date).toLocaleDateString()}
// //             </span>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   )
// // }

// // export default memo(GroupNode)

// import { memo } from "react"
// import type { NodeProps, Node } from "@xyflow/react"
// import { Calendar } from "lucide-react"

// interface GroupNodeData extends Record<string, unknown> {
//   label: string
//   description: string
//   start_date: string
//   due_date: string
// }

// function GroupNode({ data }: NodeProps<Node<GroupNodeData>>) {
//   return (
//     <div className="w-full h-full flex flex-col">
//       {/* Sprint header */}
//       <div className="mb-3">
//         <h3 className="text-lg font-semibold text-foreground mb-1">{data.label}</h3>
//         {data.description && <p className="text-sm text-muted-foreground mb-2">{data.description}</p>}
//         {data.start_date && data.due_date && (
//           <div className="flex items-center gap-2 text-xs text-muted-foreground">
//             <Calendar className="w-3.5 h-3.5" />
//             <span>
//               {new Date(data.start_date).toLocaleDateString()} – {new Date(data.due_date).toLocaleDateString()}
//             </span>
//           </div>
//         )}
//       </div>
//       {/* Issues will be rendered as child nodes by React Flow */}
//     </div>
//   )
// }

// export default memo(GroupNode)

import { memo } from "react"
import type { NodeProps, Node } from "@xyflow/react"
import { Calendar } from "lucide-react"

interface GroupNodeData extends Record<string, unknown> {
  label: string
  description: string
  start_date: string
  due_date: string
}

function GroupNode({ data }: NodeProps<Node<GroupNodeData>>) {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Sprint header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-foreground mb-1">{data.label}</h3>
        {data.description && <p className="text-sm text-muted-foreground mb-2">{data.description}</p>}
        {data.start_date && data.due_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {new Date(data.start_date).toLocaleDateString()} – {new Date(data.due_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      {/* Issues will be rendered as child nodes by React Flow */}
    </div>
  )
}

export default memo(GroupNode)
