"use client"

import { useCallback, useEffect } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import CustomNode from "./custom-node"
import SprintNode from "./sprint-node"
import LabeledSprintGroupNode from "./labeled-sprint-group-node"
import IssueNode from "./issue-node"
import GroupNode from "./group-node"

const nodeTypes = {
  custom: CustomNode,
  sprint: LabeledSprintGroupNode,
  issue: IssueNode,
  group: GroupNode,
}

interface WorkflowCanvasProps {
  nodes: Node[]
  setNodes: (nodes: Node[]) => void
  edges: Edge[]
  setEdges: (edges: Edge[]) => void
}

export default function WorkflowCanvas({ nodes, setNodes, edges, setEdges }: WorkflowCanvasProps) {
  const [internalNodes, setInternalNodes, onNodesChange] = useNodesState(nodes)
  const [internalEdges, setInternalEdges, onEdgesChange] = useEdgesState(edges)

  useEffect(() => {
    setInternalNodes(nodes)
  }, [nodes, setInternalNodes])

  useEffect(() => {
    setInternalEdges(edges)
  }, [edges, setInternalEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, internalEdges)
      setInternalEdges(newEdges)
      setEdges(newEdges)
    },
    [internalEdges, setInternalEdges, setEdges],
  )

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes)
      setNodes(internalNodes)
    },
    [onNodesChange, setNodes, internalNodes],
  )

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes)
      setEdges(internalEdges)
    },
    [onEdgesChange, setEdges, internalEdges],
  )

  return (
    <div className="h-full w-full bg-background">
      <ReactFlow
        nodes={internalNodes}
        edges={internalEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Background className="bg-background" color="#333" gap={16} />
        <Controls className="bg-card border-border" />
        <MiniMap className="bg-card border-border" nodeColor="#4f46e5" maskColor="rgba(0, 0, 0, 0.6)" />
      </ReactFlow>
    </div>
  )
}

