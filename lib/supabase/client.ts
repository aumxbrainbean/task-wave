import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'project_manager'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'project_manager'
        }
        Update: {
          full_name?: string | null
          role?: 'admin' | 'project_manager'
        }
      }
      tms_projects: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string | null
          assigned_pm_id: string | null
          created_at: string
          updated_at: string
        }
      }
      tms_stakeholders: {
        Row: {
          id: string
          project_id: string
          name: string
          email: string | null
          phone: string | null
          designation: string | null
          created_at: string
          updated_at: string
        }
      }
      tms_departments: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
      }
      tms_team_members: {
        Row: {
          id: string
          department_id: string
          name: string
          email: string
          role: string | null
          designation: string | null
          created_at: string
          updated_at: string
        }
      }
      tms_tasks: {
        Row: {
          id: string
          project_id: string
          task_description: string
          assigned_by_stakeholder_id: string | null
          priority: 'Low' | 'Medium' | 'High' | 'Critical' | null
          assigned_date: string | null
          eta_date: string | null
          department_ids: string[]
          assigned_to_ids: string[]
          assigned_by_pm: boolean
          status: 'Yet To Start' | 'In Progress' | 'On Hold' | 'Client Review Pending' | 'Completed'
          require_qa: boolean
          completed_date: string | null
          performance: 'Before Time' | 'On Time' | 'Delayed' | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
