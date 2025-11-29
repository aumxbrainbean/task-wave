export type UserRole = 'admin' | 'project_manager'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Stakeholder {
  id: string
  project_id: string
  name: string
  email: string | null
  phone: string | null
  designation: string | null
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  department_id: string
  name: string
  email: string
  role: string | null
  designation: string | null
  created_at: string
  updated_at: string
}

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
export type TaskStatus = 'Yet To Start' | 'In Progress' | 'On Hold' | 'Client Review Pending' | 'Completed'
export type Performance = 'Before Time' | 'On Time' | 'Delayed'

export interface Task {
  id: string
  project_id: string
  task_description: string
  assigned_by_stakeholder_id: string | null
  priority: Priority | null
  assigned_date: string | null
  eta_date: string | null
  department_ids: string[]
  assigned_to_ids: string[]
  assigned_by_pm: boolean
  status: TaskStatus
  require_qa: boolean
  completed_date: string | null
  performance: Performance | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TaskWithRelations extends Task {
  stakeholder?: Stakeholder | null
  departments?: Department[]
  team_members?: TeamMember[]
}
