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

import { useState, useEffect, useCallback } from "react"
import WorkflowCanvas from "./workflow-canvas"
import WorkflowInput from "./workflow-input"
import WorkflowHistory from "./workflow-history"
import { Sparkles, Workflow, Save, History, RefreshCw } from "lucide-react"
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
import { Spinner } from "@/components/spinner"

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

type LinearIssue = {
  id: string
  identifier: string
  title: string
  description: string | null
  state: {
    id: string
    name: string
    type: string
  } | null
  priority: number | null
  assignee: {
    id: string
    name: string
    email: string | null
  } | null
  team: {
    id: string
    name: string
    key: string
  }
  createdAt: string
  updatedAt: string
  url: string
}

function mapLinearStateToStatus(stateType?: string) {
  switch (stateType) {
    case "started":
      return "in_progress"
    case "completed":
      return "done"
    case "canceled":
      return "blocked"
    default:
      return "todo"
  }
}

function generateLinearWorkflow(issuesWithTimestamps: Array<LinearIssue & { randomTimestamp: number }>) {
  const nodes: any[] = []
  const edges: any[] = []

  if (issuesWithTimestamps.length === 0) {
    return { nodes, edges }
  }

  // Group issues by team
  const issuesByTeam = issuesWithTimestamps.reduce((acc, issue) => {
    if (!acc[issue.team.id]) {
      acc[issue.team.id] = {
        team: issue.team,
        issues: [],
      }
    }
    acc[issue.team.id].issues.push(issue)
    return acc
  }, {} as Record<string, { team: LinearIssue["team"]; issues: (LinearIssue & { randomTimestamp: number })[] }>)

  const teams = Object.values(issuesByTeam)

  // Create team nodes (as sprint groups)
  teams.forEach((teamData, teamIndex) => {
    const teamNodeId = `team-${teamData.team.id}`
    
    // Calculate columns based on number of issues
    const issuesPerColumn = 5
    const columns = Math.ceil(teamData.issues.length / issuesPerColumn)
    
    nodes.push({
      id: teamNodeId,
      type: "sprint",
      position: { x: 100 + teamIndex * 700, y: 100 },
      data: { label: teamData.team.name },
      width: Math.max(600, columns * 350),
      height: Math.max(500, Math.min(issuesPerColumn, teamData.issues.length) * 70 + 100),
    })

    // Create issue nodes within each team in a grid layout
    teamData.issues.forEach((issue, issueIndex) => {
      const issueNodeId = `issue-${issue.id}`
      const column = Math.floor(issueIndex / issuesPerColumn)
      const row = issueIndex % issuesPerColumn
      
      const timestamp = new Date(issue.randomTimestamp).toLocaleDateString()
      
      // Position relative to team node but without parent relationship for edges to work
      const teamX = 100 + teamIndex * 700
      const teamY = 100
      
      nodes.push({
        id: issueNodeId,
        type: "issue",
        position: { 
          x: teamX + 20 + column * 320, 
          y: teamY + 50 + row * 70 
        },
        data: { 
          label: `${issue.identifier}: ${issue.title}`,
          description: issue.description ? `${timestamp} - ${issue.description}` : timestamp,
          status: mapLinearStateToStatus(issue.state?.type),
          user: issue.assignee ? { name: issue.assignee.name } : null,
          teamId: teamNodeId, // Store for reference but don't set as parent
        },
        draggable: true,
      })
    })
  })

  // Create edges connecting issues chronologically
  console.log('Creating edges for', issuesWithTimestamps.length, 'issues')
  console.log('Issue IDs:', issuesWithTimestamps.map(i => `issue-${i.id}`))
  
  for (let i = 0; i < issuesWithTimestamps.length - 1; i++) {
    const currentIssue = issuesWithTimestamps[i]
    const nextIssue = issuesWithTimestamps[i + 1]
    
    const sourceId = `issue-${currentIssue.id}`
    const targetId = `issue-${nextIssue.id}`
    
    console.log(`Creating edge ${i}: ${sourceId} -> ${targetId}`)
    
    edges.push({
      id: `edge-${i}`,
      source: sourceId,
      target: targetId,
      type: 'default',
      markerEnd: {
        type: 'arrowclosed',
      },
      style: { 
        stroke: '#10b981', 
        strokeWidth: 4 
      },
      animated: true,
      label: `${Math.round((nextIssue.randomTimestamp - currentIssue.randomTimestamp) / (24 * 60 * 60 * 1000))}d`,
    })
  }
  
  console.log('Total edges created:', edges.length)

  return { nodes, edges }
}

export default function WorkflowBuilder({ initialNodes = [], initialEdges = [] }: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<any[]>(initialNodes)
  const [edges, setEdges] = useState<any[]>(initialEdges)
  const [showHistory, setShowHistory] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [workflowName, setWorkflowName] = useState("Linear Workflow")
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allItems, setAllItems] = useState<any[]>([]) // Store all timeline items with timestamps

  const fetchLinearIssues = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/linear/issues")
      
      if (!response.ok) {
        throw new Error("Failed to fetch Linear issues")
      }

      const data = (await response.json()) as { issues: LinearIssue[]; totalCount: number }
      
      // Generate random timestamps for issues
      const now = Date.now()
      const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000)
      
      const issuesWithTimestamps = data.issues.map(issue => ({
        ...issue,
        randomTimestamp: sixMonthsAgo + Math.random() * (now - sixMonthsAgo),
      }))
      
      // Sort by timestamp
      issuesWithTimestamps.sort((a, b) => a.randomTimestamp - b.randomTimestamp)
      
      // Store for ticket insertion
      const itemsForStorage = issuesWithTimestamps.map(issue => ({
        type: 'issue' as const,
        data: issue,
        randomTimestamp: issue.randomTimestamp,
      }))
      setAllItems(itemsForStorage)
      
      const workflow = generateLinearWorkflow(issuesWithTimestamps)
      
      console.log('Generated workflow:', {
        nodesCount: workflow.nodes.length,
        edgesCount: workflow.edges.length,
        edges: workflow.edges,
      })
      
      setNodes(workflow.nodes)
      setEdges(workflow.edges)
    } catch (err) {
      console.error("Error fetching Linear issues:", err)
      setError(err instanceof Error ? err.message : "Failed to load issues")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialNodes.length === 0) {
      void fetchLinearIssues()
    } else {
      setLoading(false)
    }
  }, [initialNodes.length, fetchLinearIssues])

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

  const addTicketToTimeline = useCallback((message: string) => {
    // Create a new ticket with a random timestamp
    const now = Date.now()
    const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000)
    const ticketTimestamp = sixMonthsAgo + Math.random() * (now - sixMonthsAgo)
    
    const newTicket = {
      type: 'ticket',
      data: {
        id: `ticket-${Date.now()}`,
        subject: message,
        description: `Customer support ticket created from chat: ${message}`,
        priority: ['urgent', 'high', 'normal', 'low'][Math.floor(Math.random() * 4)],
        requester: 'Customer Support',
      },
      randomTimestamp: ticketTimestamp,
    }
    
    // Add ticket to timeline and regenerate workflow
    const updatedItems = [...allItems, newTicket]
    setAllItems(updatedItems)
    
    // Sort all items by timestamp
    const sortedItems = updatedItems.sort((a, b) => a.randomTimestamp - b.randomTimestamp)
    
    // Regenerate nodes and edges
    const newNodes: any[] = []
    const newEdges: any[] = []
    
    // Get existing team groups
    const teamGroups = nodes.filter(n => n.type === 'sprint')
    teamGroups.forEach(team => newNodes.push(team))
    
    // Calculate positions for timeline nodes (issues and tickets mixed)
    const timelineRow = 650 // Y position for timeline
    const startX = 150
    const spacing = 400
    
    // Add all items as nodes in chronological order
    sortedItems.forEach((item, index) => {
      const nodeId = item.type === 'issue' ? `issue-${item.data.id}` : item.data.id
      const timestamp = new Date(item.randomTimestamp).toLocaleDateString()
      
      if (item.type === 'ticket') {
        // Add ticket in chronological position
        newNodes.push({
          id: nodeId,
          type: 'ticket',
          position: { 
            x: startX + index * spacing, 
            y: timelineRow 
          },
          data: {
            label: `🎫 ${item.data.subject}`,
            description: `${timestamp} - ${item.data.description}`,
            priority: item.data.priority,
            requester: item.data.requester,
          },
          draggable: true,
        })
      } else {
        // Keep existing issue nodes in their current positions
        const existingNode = nodes.find(n => n.id === nodeId)
        if (existingNode) {
          newNodes.push(existingNode)
        }
      }
    })
    
    // Create chronological edges with arrows
    for (let i = 0; i < sortedItems.length - 1; i++) {
      const currentItem = sortedItems[i]
      const nextItem = sortedItems[i + 1]
      
      const sourceId = currentItem.type === 'issue' ? `issue-${currentItem.data.id}` : currentItem.data.id
      const targetId = nextItem.type === 'issue' ? `issue-${nextItem.data.id}` : nextItem.data.id
      
      const isTicketInvolved = currentItem.type === 'ticket' || nextItem.type === 'ticket'
      
      newEdges.push({
        id: `edge-time-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: "smoothstep",
        animated: true,
        style: { 
          stroke: isTicketInvolved ? '#f59e0b' : '#10b981', 
          strokeWidth: 4
        },
        markerEnd: 'arrowclosed',
        label: `${Math.round((nextItem.randomTimestamp - currentItem.randomTimestamp) / (24 * 60 * 60 * 1000))}d`,
        labelStyle: { fontSize: 12, fill: '#374151', fontWeight: 600 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, borderRadius: 4 },
      })
    }
    
    setNodes(newNodes)
    setEdges(newEdges)
  }, [allItems, nodes])

  useEffect(() => {
    if (currentWorkflowId) {
      const workflows = JSON.parse(localStorage.getItem("workflows") || "[]")
      const current = workflows.find((w: SavedWorkflow) => w.id === currentWorkflowId)
      if (current) {
        setWorkflowName(current.name)
      }
    }
  }, [currentWorkflowId])

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-sm text-muted-foreground">Loading Linear issues...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchLinearIssues} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <Workflow className="h-12 w-12 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">No Issues Found</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Connect Linear from the Integrations page to see your issues here.
            </p>
          </div>
          <Button onClick={fetchLinearIssues} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

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
              {currentWorkflowId && workflowName ? workflowName : "Linear Issues"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {nodes.filter(n => n.type === "issue").length} issues from Linear
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
            onClick={fetchLinearIssues}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
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
            <span className="text-sm font-medium text-accent">Live Data</span>
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

        {/* Chat Input for creating tickets */}
        <WorkflowInput 
          nodes={nodes as any} 
          setNodes={setNodes} 
          edges={edges as any} 
          setEdges={setEdges}
          onMessageSend={addTicketToTimeline}
        />
      </div>
    </div>
  )
}
