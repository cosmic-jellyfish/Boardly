export type Task = {
  id: string
  title: string // maps to project.name
  name?: string // Added for compatibility with existing code
  description: string
  status: string
  priority: string
  tags: string[]
  parent_id: string | null // For hierarchical relationships
  assignees: string[] // Changed to array of strings
  start_date: string | null
  end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  order: number
  archived: boolean
  committed: boolean
  dependencies: string // Comma-separated string of task IDs this task depends on
  created_at?: string
  updated_at?: string
}

// For backward compatibility
export type Project = Task

export type Column = {
  id: string
  title: string
  order: number
}

export type Comment = {
  id: string
  project_id?: string  // Changed from task_id to match DB structure
  task_id?: string     // Added for compatibility with local store
  user_id: string     // This must be set to auth.user().id when creating comments
  content: string
  created_at: string
  updated_at?: string // Added to match DB schema
  users?: User  // Add user relation for easier access to user data
}

export type Attachment = {
  id: string
  task_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  created_by: string  // This should be the user's ID
  created_at: string
}

export type User = {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at?: string  // Added to match DB schema
  updated_at?: string  // Added to match DB schema
}

export type ActivityLog = {
  id: string
  project_id?: string
  user_id: string     // Changed to required field - must be set to auth.user().id
  event_type: string
  changes: any
  created_at: string
  status_change?: string     // Added to match DB schema
  priority_change?: string   // Added to match DB schema
  assignment_change?: string // Added to match DB schema
  task_id: string           // Made required to match local store usage
  task_name?: string        // Added to match local store usage
  users?: User
  projects?: {
    name: string
  }
}
