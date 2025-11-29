import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import type { Task, Project, Department, TeamMember, Stakeholder } from '@/types'

interface TaskState {
  tasks: Task[]
  projects: Project[]
  departments: Department[]
  teamMembers: TeamMember[]
  stakeholders: Stakeholder[]
  selectedProjectId: string | null
  loading: boolean
  autoSaving: boolean
  lastSaved: Date | null
  
  setTasks: (tasks: Task[]) => void
  setProjects: (projects: Project[]) => void
  setDepartments: (departments: Department[]) => void
  setTeamMembers: (teamMembers: TeamMember[]) => void
  setStakeholders: (stakeholders: Stakeholder[]) => void
  setSelectedProjectId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setAutoSaving: (saving: boolean) => void
  setLastSaved: (date: Date) => void
  
  fetchProjects: () => Promise<void>
  fetchDepartments: () => Promise<void>
  fetchTeamMembers: () => Promise<void>
  fetchStakeholders: (projectId: string) => Promise<void>
  fetchTasks: (projectId: string) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  addTask: (task: Partial<Task>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  projects: [],
  departments: [],
  teamMembers: [],
  stakeholders: [],
  selectedProjectId: null,
  loading: false,
  autoSaving: false,
  lastSaved: null,
  
  setTasks: (tasks) => set({ tasks }),
  setProjects: (projects) => set({ projects }),
  setDepartments: (departments) => set({ departments }),
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  setStakeholders: (stakeholders) => set({ stakeholders }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setLoading: (loading) => set({ loading }),
  setAutoSaving: (saving) => set({ autoSaving: saving }),
  setLastSaved: (date) => set({ lastSaved: date }),
  
  fetchProjects: async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Get user role
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (userError) throw userError
      
      let query = supabase
        .from('tms_projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      // If PM, only show assigned projects on dashboard
      if (userData?.role === 'project_manager') {
        query = query.eq('assigned_pm_id', user.id)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      set({ projects: data || [] })
      
      // Auto-select first project if none selected
      const currentState = get()
      if (data && data.length > 0 && !currentState.selectedProjectId) {
        set({ selectedProjectId: data[0].id })
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  },
  
  fetchDepartments: async () => {
    try {
      const { data, error } = await supabase
        .from('tms_departments')
        .select('*')
        .order('name')
      
      if (error) throw error
      set({ departments: data || [] })
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  },
  
  fetchTeamMembers: async () => {
    try {
      const { data, error } = await supabase
        .from('tms_team_members')
        .select('*')
        .order('name')
      
      if (error) throw error
      set({ teamMembers: data || [] })
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  },
  
  fetchStakeholders: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('tms_stakeholders')
        .select('*')
        .eq('project_id', projectId)
        .order('name')
      
      if (error) throw error
      set({ stakeholders: data || [] })
    } catch (error) {
      console.error('Error fetching stakeholders:', error)
    }
  },
  
  fetchTasks: async (projectId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('tms_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      set({ tasks: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching tasks:', error)
      set({ loading: false })
    }
  },
  
  updateTask: async (taskId: string, updates: Partial<Task>) => {
    set({ autoSaving: true })
    try {
      const { error } = await supabase
        .from('tms_tasks')
        .update(updates)
        .eq('id', taskId)
      
      if (error) throw error
      
      const tasks = get().tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
      set({ tasks, lastSaved: new Date() })
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      set({ autoSaving: false })
    }
  },
  
  addTask: async (task: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tms_tasks')
        .insert([task])
        .select()
        .single()
      
      if (error) throw error
      if (data) {
        set({ tasks: [data, ...get().tasks] })
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  },
  
  deleteTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tms_tasks')
        .delete()
        .eq('id', taskId)
      
      if (error) throw error
      
      set({ tasks: get().tasks.filter(task => task.id !== taskId) })
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  },
}))
