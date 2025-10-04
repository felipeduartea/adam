// "use client"

// import { useState, useEffect } from "react"
// import WorkflowCanvas from "./workflow-canvas"
// import WorkflowInput from "./workflow-input"
// import WorkflowHistory from "./workflow-history"
// import { Sparkles, Workflow, Save, History } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import type { Node, Edge } from "@xyflow/react"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { mockWorkflowData } from "../lib/mock-data"

// export interface SavedWorkflow {
//   id: string
//   name: string
//   nodes: any[]
//   edges: any[]
//   createdAt: string
//   updatedAt: string
// }

// interface WorkflowBuilderProps {
//   initialNodes?: Node[]
//   initialEdges?: Edge[]
// }

// export default function WorkflowBuilder({ initialNodes = [], initialEdges = [] }: WorkflowBuilderProps) {
//   const [nodes, setNodes] = useState<any[]>(initialNodes)
//   const [edges, setEdges] = useState<any[]>(initialEdges)
//   const [showHistory, setShowHistory] = useState(false)
//   const [showSaveDialog, setShowSaveDialog] = useState(false)
//   const [workflowName, setWorkflowName] = useState("")
//   const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)

//   const loadWorkflow = (workflow: SavedWorkflow) => {
//     setNodes(workflow.nodes)
//     setEdges(workflow.edges)
//     setCurrentWorkflowId(workflow.id)
//     setShowHistory(false)
//   }

//   const saveWorkflow = () => {
//     if (!workflowName.trim()) return

//     const workflows = JSON.parse(localStorage.getItem("workflows") || "[]")
//     const now = new Date().toISOString()

//     if (currentWorkflowId) {
//       // Update existing workflow
//       const index = workflows.findIndex((w: SavedWorkflow) => w.id === currentWorkflowId)
//       if (index !== -1) {
//         workflows[index] = {
//           ...workflows[index],
//           name: workflowName,
//           nodes,
//           edges,
//           updatedAt: now,
//         }
//       }
//     } else {
//       // Create new workflow
//       const newWorkflow: SavedWorkflow = {
//         id: crypto.randomUUID(),
//         name: workflowName,
//         nodes,
//         edges,
//         createdAt: now,
//         updatedAt: now,
//       }
//       workflows.unshift(newWorkflow)
//       setCurrentWorkflowId(newWorkflow.id)
//     }

//     localStorage.setItem("workflows", JSON.stringify(workflows))
//     setShowSaveDialog(false)
//     setWorkflowName("")
//   }

//   useEffect(() => {
//     if (currentWorkflowId) {
//       const workflows = JSON.parse(localStorage.getItem("workflows") || "[]")
//       const current = workflows.find((w: SavedWorkflow) => w.id === currentWorkflowId)
//       if (current) {
//         setWorkflowName(current.name)
//       }
//     }
//   }, [currentWorkflowId])

//   useEffect(() => {
//     if (initialNodes.length > 0) {
//       setNodes(initialNodes)
//     }
//   }, [initialNodes])

//   useEffect(() => {
//     if (initialEdges.length > 0) {
//       setEdges(initialEdges)
//     }
//   }, [initialEdges])

//   return (
//     <div className="flex h-full w-full flex-col bg-background">
//       {/* Header */}
//       <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
//         <div className="flex items-center gap-3">
//           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
//             <Workflow className="h-5 w-5 text-primary" />
//           </div>
//           <div>
//             <h1 className="text-lg font-semibold text-foreground">
//               {currentWorkflowId && workflowName ? workflowName : "Workflow Builder"}
//             </h1>
//             <p className="text-sm text-muted-foreground">Create workflows with AI assistance</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-3">
//           <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
//             <DialogTrigger asChild>
//               <Button variant="outline" size="sm" className="gap-2 bg-transparent">
//                 <Save className="h-4 w-4" />
//                 Save Workflow
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>Save Workflow</DialogTitle>
//                 <DialogDescription>Give your workflow a name to save it for later.</DialogDescription>
//               </DialogHeader>
//               <Input
//                 placeholder="Enter workflow name..."
//                 value={workflowName}
//                 onChange={(e) => setWorkflowName(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && saveWorkflow()}
//               />
//               <DialogFooter>
//                 <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
//                   Cancel
//                 </Button>
//                 <Button onClick={saveWorkflow} disabled={!workflowName.trim()}>
//                   Save
//                 </Button>
//               </DialogFooter>
//             </DialogContent>
//           </Dialog>

//           <Button
//             variant="outline"
//             size="sm"
//             className="gap-2 bg-transparent"
//             onClick={() => setShowHistory(!showHistory)}
//           >
//             <History className="h-4 w-4" />
//             History
//           </Button>

//           <div className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5">
//             <Sparkles className="h-4 w-4 text-accent" />
//             <span className="text-sm font-medium text-accent">AI Powered</span>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <div className="relative flex flex-1 overflow-hidden">
//         {showHistory && (
//           <div className="absolute left-0 top-0 z-10 h-full w-80 flex-shrink-0 border-r border-border bg-background">
//             <WorkflowHistory
//               onLoadWorkflow={loadWorkflow}
//               currentWorkflowId={currentWorkflowId}
//               onClose={() => setShowHistory(false)}
//             />
//           </div>
//         )}

//         {/* Workflow Canvas - Full Width */}
//         <div className="flex-1">
//           <WorkflowCanvas nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
//         </div>

//         {/* AI Input - Bottom Center */}
//         <WorkflowInput nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
//       </div>
//     </div>
//   )
// }

"use client"

import { useState, useEffect } from "react"
import WorkflowCanvas from "./workflow-canvas"
import WorkflowInput from "./workflow-input"
import WorkflowHistory from "./workflow-history"
import { Sparkles, Workflow, Save, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Node, Edge } from "@xyflow/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { mockWorkflowData } from "@/lib/mock-data"

export interface SavedWorkflow {
  id: string
  name: string
  nodes: any[]
  edges: any[]
  createdAt: string
  updatedAt: string
}

interface WorkflowBuilderProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
}

function generateMockWorkflow() {
  const nodes: any[] = []
  const edges: any[] = []

  // Organization Node
  nodes.push({
    id: mockWorkflowData.organization.id,
    type: "organization",
    position: { x: 400, y: 50 },
    data: { label: mockWorkflowData.organization.name },
  })

  // Project Nodes
  mockWorkflowData.projects.forEach((project, index) => {
    nodes.push({
      id: project.id,
      type: "project",
      position: { x: 250 + index * 300, y: 200 },
      data: { label: project.title },
    })

    edges.push({
      id: `edge-org-${project.id}`,
      source: mockWorkflowData.organization.id,
      target: project.id,
      type: "smoothstep",
    })
  })

  // Sprint Nodes
  mockWorkflowData.sprints.forEach((sprint, index) => {
    nodes.push({
      id: sprint.id,
      type: "sprint", // This will now use LabeledSprintGroupNode
      position: { x: 200 + index * 250, y: 400 },
      data: { label: sprint.title },
      // Add width and height for the group node to contain its children
      width: 400,
      height: 250,
    })

    edges.push({
      id: `edge-proj-${sprint.id}`,
      source: sprint.project_id,
      target: sprint.id,
      type: "smoothstep",
    })
  })

  // Issue Nodes
  mockWorkflowData.issues.forEach((issue, index) => {
    nodes.push({
      id: issue.id,
      type: "issue",
      position: { x: 50 + (index % 2) * 150, y: 80 + Math.floor(index / 2) * 80 }, // Position issues relative to sprint
      data: { label: issue.title },
      parentId: issue.sprint_id, // Set the sprint as parent
      extent: "parent", // Confine issue within parent sprint
    })

    edges.push({
      id: `edge-sprint-${issue.id}`,
      source: issue.sprint_id,
      target: issue.id,
      type: "smoothstep",
    })
  })

  return { nodes, edges }
}

export default function WorkflowBuilder({ initialNodes = [], initialEdges = [] }: WorkflowBuilderProps) {
  const mockWorkflow = generateMockWorkflow()
  const [nodes, setNodes] = useState<any[]>(initialNodes.length ? initialNodes : mockWorkflow.nodes)
  const [edges, setEdges] = useState<any[]>(initialEdges.length ? initialEdges : mockWorkflow.edges)
  const [showHistory, setShowHistory] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [workflowName, setWorkflowName] = useState("Mock Workflow")
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

  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes)
    }
  }, [initialNodes])

  useEffect(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges)
    }
  }, [initialEdges])

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
              {currentWorkflowId && workflowName ? workflowName : "Workflow Builder"}
            </h1>
            <p className="text-sm text-muted-foreground">Loaded from mock data</p>
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
            <span className="text-sm font-medium text-accent">Mock Data</span>
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

        {/* Workflow Canvas */}
        <div className="flex-1">
          <WorkflowCanvas nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
        </div>

        {/* Input (kept for future AI integration) */}
        <WorkflowInput nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
      </div>
    </div>
  )
}
