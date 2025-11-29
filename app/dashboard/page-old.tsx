'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useTaskStore } from '@/lib/stores/taskStore'
import { supabase } from '@/lib/supabase/client'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { 
  Loader2, 
  Plus, 
  CheckCircle2, 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Task, Priority, TaskStatus } from '@/types'

const PRIORITY_OPTIONS: Priority[] = ['Low', 'Medium', 'High', 'Critical']
const STATUS_OPTIONS: TaskStatus[] = ['Yet To Start', 'In Progress', 'On Hold', 'Client Review Pending', 'Completed']

// Helper function to format date without timezone issues
const formatDateForDB = (date: Date | undefined): string | undefined => {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'Yet To Start': return '#f7f7f7'
    case 'In Progress': return '#fff6e5'
    case 'On Hold': return '#fdecec'
    case 'Client Review Pending': return '#e8f3ff'
    case 'Completed': return '#e9f9ec'
    default: return '#ffffff'
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, fetchUser, signOut } = useAuthStore()
  const {
    tasks,
    projects,
    departments,
    teamMembers,
    stakeholders,
    selectedProjectId,
    loading,
    autoSaving,
    lastSaved,
    setSelectedProjectId,
    fetchProjects,
    fetchDepartments,
    fetchTeamMembers,
    fetchStakeholders,
    fetchTasks,
    updateTask,
    addTask,
  } = useTaskStore()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchUser()
      await fetchProjects()
      await fetchDepartments()
      await fetchTeamMembers()
    }
    init()
  }, [router])

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId)
      fetchStakeholders(selectedProjectId)
    }
  }, [selectedProjectId])

  // Auto-save debouncer
  const [updateQueue, setUpdateQueue] = useState<Map<string, Partial<Task>>>(new Map())

  useEffect(() => {
    if (updateQueue.size === 0) return

    const timer = setTimeout(() => {
      updateQueue.forEach((updates, taskId) => {
        updateTask(taskId, updates)
      })
      setUpdateQueue(new Map())
    }, 500)

    return () => clearTimeout(timer)
  }, [updateQueue])

  const handleCellUpdate = useCallback((taskId: string, field: keyof Task, value: any) => {
    const newQueue = new Map(updateQueue)
    const existing = newQueue.get(taskId) || {}
    newQueue.set(taskId, { ...existing, [field]: value })
    setUpdateQueue(newQueue)
  }, [updateQueue])

  const handleAddTask = async () => {
    if (!selectedProjectId || !user) return
    
    await addTask({
      project_id: selectedProjectId,
      task_description: '',
      status: 'Yet To Start',
      assigned_by_pm: false,
      require_qa: false,
      department_ids: [],
      assigned_to_ids: [],
      created_by: user.id,
    })
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      if (departmentFilter !== 'all' && !task.department_ids.includes(departmentFilter)) return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter, departmentFilter])

  const columns: ColumnDef<Task>[] = useMemo(() => [
    {
      accessorKey: 'task_description',
      header: 'Task Description',
      cell: ({ row }) => (
        <Input
          value={row.original.task_description}
          onChange={(e) => handleCellUpdate(row.original.id, 'task_description', e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0"
        />
      ),
    },
    {
      accessorKey: 'assigned_by_stakeholder_id',
      header: 'Assigned By',
      cell: ({ row }) => (
        <Select
          value={row.original.assigned_by_stakeholder_id || ''}
          onValueChange={(value) => handleCellUpdate(row.original.id, 'assigned_by_stakeholder_id', value || null)}
        >
          <SelectTrigger className="border-0 bg-transparent">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {stakeholders.map(sh => (
              <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Select
          value={row.original.priority || ''}
          onValueChange={(value) => handleCellUpdate(row.original.id, 'priority', value)}
        >
          <SelectTrigger className="border-0 bg-transparent">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: 'assigned_date',
      header: 'Assigned Date',
      cell: ({ row }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-left font-normal border-0">
              {row.original.assigned_date ? format(new Date(row.original.assigned_date), 'EEEE, MMMM d, yyyy') : 'Pick date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={row.original.assigned_date ? new Date(row.original.assigned_date) : undefined}
              onSelect={(date) => handleCellUpdate(row.original.id, 'assigned_date', formatDateForDB(date))}
            />
          </PopoverContent>
        </Popover>
      ),
    },
    {
      accessorKey: 'eta_date',
      header: 'ETA',
      cell: ({ row }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-left font-normal border-0">
              {row.original.eta_date ? format(new Date(row.original.eta_date), 'EEEE, MMMM d, yyyy') : 'Pick date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={row.original.eta_date ? new Date(row.original.eta_date) : undefined}
              onSelect={(date) => handleCellUpdate(row.original.id, 'eta_date', formatDateForDB(date))}
            />
          </PopoverContent>
        </Popover>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Select
          value={row.original.status}
          onValueChange={(value: TaskStatus) => handleCellUpdate(row.original.id, 'status', value)}
        >
          <SelectTrigger className="border-0 bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: 'completed_date',
      header: 'Completed',
      cell: ({ row }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-left font-normal border-0">
              {row.original.completed_date ? format(new Date(row.original.completed_date), 'MMM d, yyyy') : '-'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={row.original.completed_date ? new Date(row.original.completed_date) : undefined}
              onSelect={(date) => handleCellUpdate(row.original.id, 'completed_date', formatDateForDB(date))}
            />
          </PopoverContent>
        </Popover>
      ),
    },
    {
      accessorKey: 'performance',
      header: 'Performance',
      cell: ({ row }) => {
        const perf = row.original.performance
        if (!perf) return <span className="text-muted-foreground">-</span>
        const color = perf === 'Before Time' ? 'bg-green-100 text-green-800' : 
                     perf === 'On Time' ? 'bg-blue-100 text-blue-800' : 
                     'bg-red-100 text-red-800'
        return <Badge className={color}>{perf}</Badge>
      },
    },
  ], [stakeholders, handleCellUpdate])

  const table = useReactTable({
    data: filteredTasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r flex flex-col transition-all duration-300",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg">TMS</h2>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/projects')}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Projects
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/departments')}>
            <Users className="mr-2 h-4 w-4" />
            Departments
          </Button>
          {user.role === 'admin' && (
            <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/settings')}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Button>
          )}
        </nav>
        <div className="p-4 border-t space-y-2">
          <div className="text-sm">
            <p className="font-medium">{user.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-bold">Task Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {autoSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Auto Saved
              </div>
            )}
          </div>
        </header>

        {/* Filters */}
        <div className="bg-muted/30 p-4 border-b flex items-center gap-4 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
            setStatusFilter('all')
            setPriorityFilter('all')
            setDepartmentFilter('all')
          }}>
            Clear Filters
          </Button>
          <Button onClick={handleAddTask} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Task Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg bg-card">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="p-2 text-left text-sm font-medium border-b">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id}
                      style={{ backgroundColor: getStatusColor(row.original.status) }}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Project Tabs (Bottom) */}
        {projects.length > 0 && (
          <div className="bg-card border-t p-2 overflow-x-auto">
            <Tabs value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
              <TabsList className="h-auto">
                {projects.map(project => (
                  <TabsTrigger key={project.id} value={project.id} className="px-4 py-2">
                    {project.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}
