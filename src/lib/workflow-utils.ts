import type { Node, Edge } from "@xyflow/react"
import type { Project, Sprint, Issue, User } from "@/types/entities"

export interface WorkflowData {
  projects: Project[]
  sprints: Sprint[]
  issues: Issue[]
  users: User[]
}

// export function convertEntitiesToNodes(data: WorkflowData): { nodes: Node[]; edges: Edge[] } {
//   const nodes: Node[] = []
//   const edges: Edge[] = []

//   data.sprints.forEach((sprint, sprintIndex) => {
//     const sprintIssues = data.issues.filter((i) => i.sprint_id === sprint.id)
//     const issueCount = sprintIssues.length
//     const sprintHeight = Math.max(400, 120 + issueCount * 120)

//     nodes.push({
//       id: sprint.id,
//       type: "group",
//       position: { x: sprintIndex * 450, y: 0 },
//       data: {
//         label: sprint.title,
//         description: sprint.description,
//         start_date: sprint.start_date,
//         due_date: sprint.due_date,
//       },
//       width: 420,
//       height: sprintHeight,
//     })
//   })

//   data.issues.forEach((issue) => {
//     if (issue.sprint_id) {
//       const sprintIssues = data.issues.filter((i) => i.sprint_id === issue.sprint_id)
//       const issueIndexInSprint = sprintIssues.findIndex((i) => i.id === issue.id)

//       nodes.push({
//         id: issue.id,
//         type: "issue",
//         position: { x: 16, y: 80 + issueIndexInSprint * 120 },
//         data: {
//           label: issue.title,
//           description: issue.description,
//           status: issue.status || "todo",
//           user: issue.user,
//         },
//         parentId: issue.sprint_id,
//         extent: "parent" as const,
//         draggable: true,
//         style: {
//           width: 380,
//         },
//       })
//     }
//   })

//   // Create edges between sprints to show workflow progression
//   data.sprints.forEach((sprint, index) => {
//     if (index > 0) {
//       edges.push({
//         id: `edge-sprint-${data.sprints[index - 1].id}-${sprint.id}`,
//         source: data.sprints[index - 1].id,
//         target: sprint.id,
//         animated: true,
//         style: { stroke: "hsl(var(--primary) / 0.5)", strokeWidth: 2 },
//         type: "smoothstep",
//       })
//     }
//   })

//   return { nodes, edges }
// }

// ... existing code ...

export function convertEntitiesToNodes(data: WorkflowData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // <CHANGE> Add sprints first as group nodes with proper styling
  data.sprints.forEach((sprint, sprintIndex) => {
    const sprintIssues = data.issues.filter((i) => i.sprint_id === sprint.id)
    const issueCount = sprintIssues.length
    const sprintHeight = Math.max(400, 120 + issueCount * 120)

    nodes.push({
      id: sprint.id,
      type: "group",
      position: { x: sprintIndex * 450, y: 0 },
      data: {
        label: sprint.title,
        description: sprint.description,
        start_date: sprint.start_date,
        due_date: sprint.due_date,
      },
      style: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "16px",
        width: 420,
        height: sprintHeight,
      },
      zIndex: -1,
    })
  })
  // </CHANGE>

  // Ensure the function always returns nodes and edges
  return { nodes, edges }
}
