// src/types/entities.ts

export interface Project {
    id: string
    title: string
    description: string
    start_date: string // ISO date string
    due_date: string // ISO date string
  }
  
  export interface Sprint {
    id: string
    title: string
    project_id: string
    description: string
    start_date: string
    due_date: string
    project: Project // Optional relation
  }
  
  export interface Issue {
    id: string
    title: string
    description: string
    sprint_id: string
    status: "todo" | "in_progress" | "done" | "blocked"
    assignee: string // user_id
    sprint: Sprint
    user: User
  }
  
  export interface Organization {
    id: string
    name: string
  }
  
  export interface User {
    id: string
    name: string
    org_id: string
    project: string // project_id
    role: "admin" | "manager" | "developer" | "viewer"
    permission: string[]
    organization: Organization
  }
  
  export interface Session {
    id: string
    timestamp: string // ISO datetime string
    userMessage: string
    llmMessage: string
    user: User
  }
  