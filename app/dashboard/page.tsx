'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
import { format, parseISO } from 'date-fns'
import { 
  Loader2, 
  Plus, 
  CheckCircle2,
  Trash2,
  Filter,
  X,
  CalendarIcon,
  Download,
  Sparkles,
  Clock,
  TrendingUp,
  Users2,
  LayoutGrid,
  Search,
  SlidersHorizontal
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/app-sidebar'
import { EditableTextarea } from '@/components/editable-textarea'
import { useResizableColumns } from '@/hooks/useResizableColumns'
import type { Task, Priority, TaskStatus, Department, TeamMember } from '@/types'

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
    case 'Yet To Start': return 'bg-purple-50/40 dark:bg-purple-950/20 border-l-4 border-purple-300'
    case 'In Progress': return 'bg-sky-50/40 dark:bg-sky-950/20 border-l-4 border-sky-300'
    case 'On Hold': return 'bg-amber-50/40 dark:bg-amber-950/20 border-l-4 border-amber-300'
    case 'Client Review Pending': return 'bg-cyan-50/40 dark:bg-cyan-950/20 border-l-4 border-cyan-300'
    case 'Completed': return 'bg-emerald-50/40 dark:bg-emerald-950/20 border-l-4 border-emerald-300'
    default: return 'bg-white dark:bg-gray-950'
  }
}

const getPriorityColor = (priority: Priority | null) => {
  switch (priority) {
    case 'Critical': return 'status-badge bg-red-100 text-red-700 border border-red-200'
    case 'High': return 'status-badge bg-orange-100 text-orange-700 border border-orange-200'
    case 'Medium': return 'status-badge bg-yellow-100 text-yellow-700 border border-yellow-200'
    case 'Low': return 'status-badge bg-emerald-100 text-emerald-700 border border-emerald-200'
    default: return 'status-badge bg-gray-100 text-gray-700 border border-gray-200'
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, fetchUser } = useAuthStore()
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
    deleteTask,
  } = useTaskStore()

  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<{ from?: Date; to?: Date }>({})
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Resizable columns hook with 350px minimum width
  const { columnWidths, handleMouseDown, isResizing } = useResizableColumns({
    task_description: 350,
    notes: 350
  })

  // One-time effect to enforce minimum widths in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tms-column-widths')
      if (saved) {
        try {
          const savedWidths = JSON.parse(saved)
          let needsUpdate = false
          const updated = { ...savedWidths }
          
          if (!savedWidths.task_description || savedWidths.task_description < 350) {
            updated.task_description = 350
            needsUpdate = true
          }
          if (!savedWidths.notes || savedWidths.notes < 350) {
            updated.notes = 350
            needsUpdate = true
          }
          
          if (needsUpdate) {
            localStorage.setItem('tms-column-widths', JSON.stringify(updated))
            window.location.reload() // Reload to apply new widths
          }
        } catch (e) {
          // If parsing fails, clear and use defaults
          localStorage.removeItem('tms-column-widths')
        }
      }
    }
  }, [])

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

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId, setSelectedProjectId])

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId)
      fetchStakeholders(selectedProjectId)
    }
  }, [selectedProjectId])

  // Auto-save queue
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
    
    // Special handling for completed_date - calculate performance AND set status
    if (field === 'completed_date' && value) {
      const task = tasks.find(t => t.id === taskId)
      
      // Automatically mark as Completed
      existing.status = 'Completed'
      
      // Calculate performance
      if (task?.eta_date) {
        const completedDate = new Date(value)
        const etaDate = new Date(task.eta_date)
        let performance: string
        if (completedDate < etaDate) {
          performance = 'Before Time'
        } else if (completedDate.toDateString() === etaDate.toDateString()) {
          performance = 'On Time'
        } else {
          performance = 'Delayed'
        }
        existing.performance = performance
      }
    }
    
    newQueue.set(taskId, { ...existing, [field]: value })
    setUpdateQueue(newQueue)
  }, [updateQueue, tasks])

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

  const handleDeleteTask = async () => {
    if (deleteTaskId) {
      await deleteTask(deleteTaskId)
      setDeleteTaskId(null)
    }
  }

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredTasks.map(task => {
      // Get stakeholder name
      const stakeholder = stakeholders.find(s => s.id === task.assigned_by_stakeholder_id)
      
      // Get department names
      const deptNames = task.department_ids
        .map(id => departments.find(d => d.id === id)?.name)
        .filter(Boolean)
        .join(', ')
      
      // Get team member names
      const memberNames = task.assigned_to_ids
        .map(id => teamMembers.find(tm => tm.id === id)?.name)
        .filter(Boolean)
        .join(', ')
      
      return {
        'Task Description': task.task_description,
        'Assigned By': stakeholder?.name || '',
        'Priority': task.priority || '',
        'Assigned Date': task.assigned_date ? format(new Date(task.assigned_date), 'EEEE, MMMM d, yyyy') : '',
        'ETA': task.eta_date ? format(new Date(task.eta_date), 'EEEE, MMMM d, yyyy') : '',
        'Department': deptNames,
        'Assigned To': memberNames,
        'Assigned by PM': task.assigned_by_pm ? 'Yes' : 'No',
        'Status': task.status,
        'Require QA': task.require_qa ? 'Yes' : 'No',
        'Completed Date': task.completed_date ? format(new Date(task.completed_date), 'MMM d, yyyy') : '',
        'Performance': task.performance || '',
        'Notes': task.notes || '',
      }
    })

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    
    // Set column widths
    const columnWidths = [
      { wch: 40 }, // Task Description
      { wch: 20 }, // Assigned By
      { wch: 12 }, // Priority
      { wch: 25 }, // Assigned Date
      { wch: 25 }, // ETA
      { wch: 20 }, // Department
      { wch: 25 }, // Assigned To
      { wch: 15 }, // Assigned by PM
      { wch: 20 }, // Status
      { wch: 12 }, // Require QA
      { wch: 20 }, // Completed Date
      { wch: 15 }, // Performance
      { wch: 40 }, // Notes
    ]
    worksheet['!cols'] = columnWidths

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const projectName = projects.find(p => p.id === selectedProjectId)?.name || 'Tasks'
    XLSX.utils.book_append_sheet(workbook, worksheet, projectName.substring(0, 31))

    // Generate filename with current date
    const filename = `${projectName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

    // Download file
    XLSX.writeFile(workbook, filename)
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      if (departmentFilter !== 'all' && !task.department_ids.includes(departmentFilter)) return false
      
      // Date range filter
      if (dateRangeFilter.from || dateRangeFilter.to) {
        const taskDate = task.assigned_date ? new Date(task.assigned_date) : null
        if (!taskDate) return false
        if (dateRangeFilter.from && taskDate < dateRangeFilter.from) return false
        if (dateRangeFilter.to && taskDate > dateRangeFilter.to) return false
      }
      
      return true
    })
  }, [tasks, statusFilter, priorityFilter, departmentFilter, dateRangeFilter])

  // Get filtered team members based on selected departments
  const getFilteredTeamMembers = useCallback((departmentIds: string[]) => {
    if (departmentIds.length === 0) return teamMembers
    return teamMembers.filter(member => departmentIds.includes(member.department_id))
  }, [teamMembers])

  const columns: ColumnDef<Task>[] = useMemo(() => [
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteTaskId(row.original.id)}
          data-testid={`delete-task-${row.original.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
      size: 50,
    },
    {
      accessorKey: 'task_description',
      header: () => (
        <div className="flex items-center justify-between relative group">
          <span>Task Description</span>
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown('task_description', e)}
          />
        </div>
      ),
      cell: ({ row }) => (
        <EditableTextarea
          value={row.original.task_description}
          onChange={() => {}} // No-op, component handles its own state
          onSave={(value) => handleCellUpdate(row.original.id, 'task_description', value)}
          placeholder="Enter task description..."
          className="border-0 bg-transparent focus-visible:ring-1 resize-none w-full"
          testId={`task-description-${row.original.id}`}
        />
      ),
      size: columnWidths.task_description,
      minSize: 350,
    },
    {
      accessorKey: 'assigned_by_stakeholder_id',
      header: 'Assigned By',
      cell: ({ row }) => (
        <Select
          value={row.original.assigned_by_stakeholder_id || ''}
          onValueChange={(value) => handleCellUpdate(row.original.id, 'assigned_by_stakeholder_id', value || null)}
        >
          <SelectTrigger className="border-0 bg-transparent" data-testid={`assigned-by-${row.original.id}`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {stakeholders.map(sh => (
              <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      size: 180,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Select
          value={row.original.priority || ''}
          onValueChange={(value) => handleCellUpdate(row.original.id, 'priority', value)}
        >
          <SelectTrigger className="border-0 bg-transparent" data-testid={`priority-${row.original.id}`}>
            {row.original.priority ? (
              <Badge className={cn('text-xs', getPriorityColor(row.original.priority))}>{row.original.priority}</Badge>
            ) : (
              <SelectValue placeholder="Select" />
            )}
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(p => (
              <SelectItem key={p} value={p}>
                <Badge className={cn('text-xs', getPriorityColor(p))}>{p}</Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      size: 130,
    },
    {
      accessorKey: 'assigned_date',
      header: 'Assigned',
      cell: ({ row }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-left font-normal border-0 text-xs h-8 px-2"
              data-testid={`assigned-date-${row.original.id}`}
            >
              {row.original.assigned_date ? format(new Date(row.original.assigned_date), 'MMM d, yyyy') : 'Set date'}
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
      size: 120,
    },
    {
      accessorKey: 'eta_date',
      header: 'ETA',
      cell: ({ row }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-left font-normal border-0 text-xs h-8 px-2"
              data-testid={`eta-date-${row.original.id}`}
            >
              {row.original.eta_date ? format(new Date(row.original.eta_date), 'MMM d, yyyy') : 'Set date'}
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
      size: 120,
    },
    {
      accessorKey: 'department_ids',
      header: 'Department',
      cell: ({ row }) => (
        <MultiSelect
          options={departments.map(d => ({ label: d.name, value: d.id }))}
          selected={row.original.department_ids}
          onChange={(values) => handleCellUpdate(row.original.id, 'department_ids', values)}
          placeholder="Select departments"
          className="border-0 bg-transparent"
        />
      ),
      size: 220,
    },
    {
      accessorKey: 'assigned_to_ids',
      header: 'Assigned To',
      cell: ({ row }) => {
        const filteredMembers = getFilteredTeamMembers(row.original.department_ids)
        return (
          <MultiSelect
            options={filteredMembers.map(tm => ({ label: tm.name, value: tm.id }))}
            selected={row.original.assigned_to_ids}
            onChange={(values) => handleCellUpdate(row.original.id, 'assigned_to_ids', values)}
            placeholder="Select team members"
            className="border-0 bg-transparent"
          />
        )
      },
      size: 220,
    },
    {
      accessorKey: 'assigned_by_pm',
      header: 'Assigned by PM',
      cell: ({ row }) => (
        <Select
          value={row.original.assigned_by_pm ? 'yes' : 'no'}
          onValueChange={(value) => handleCellUpdate(row.original.id, 'assigned_by_pm', value === 'yes')}
        >
          <SelectTrigger className="border-0 bg-transparent" data-testid={`assigned-by-pm-${row.original.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      ),
      size: 130,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Select
          value={row.original.status}
          onValueChange={(value: TaskStatus) => handleCellUpdate(row.original.id, 'status', value)}
        >
          <SelectTrigger className="border-0 bg-transparent" data-testid={`status-${row.original.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      size: 180,
    },
    {
      accessorKey: 'require_qa',
      header: 'Require QA',
      cell: ({ row }) => (
        <Select
          value={row.original.require_qa ? 'yes' : 'no'}
          onValueChange={(value) => handleCellUpdate(row.original.id, 'require_qa', value === 'yes')}
        >
          <SelectTrigger className="border-0 bg-transparent" data-testid={`require-qa-${row.original.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      ),
      size: 120,
    },
    {
      accessorKey: 'completed_date',
      header: 'Completed',
      cell: ({ row }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-left font-normal border-0"
              data-testid={`completed-date-${row.original.id}`}
            >
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
      size: 150,
    },
    {
      accessorKey: 'performance',
      header: 'Performance',
      cell: ({ row }) => {
        // Check if there's a pending update in the queue
        const pendingUpdate = updateQueue.get(row.original.id)
        const perf = pendingUpdate?.performance || row.original.performance
        
        if (!perf) return <span className="text-muted-foreground">-</span>
        const color = perf === 'Before Time' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                     perf === 'On Time' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
                     'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        return <Badge className={color} data-testid={`performance-${row.original.id}`}>{perf}</Badge>
      },
      size: 130,
    },
    {
      accessorKey: 'notes',
      header: () => (
        <div className="flex items-center justify-between relative group">
          <span>Notes</span>
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown('notes', e)}
          />
        </div>
      ),
      cell: ({ row }) => (
        <EditableTextarea
          value={row.original.notes || ''}
          onChange={() => {}} // No-op, component handles its own state
          onSave={(value) => handleCellUpdate(row.original.id, 'notes', value)}
          placeholder="Add notes..."
          className="border-0 bg-transparent focus-visible:ring-1 resize-none w-full"
          testId={`notes-${row.original.id}`}
        />
      ),
      size: columnWidths.notes,
      minSize: 350,
    },
  ], [stakeholders, departments, teamMembers, handleCellUpdate, getFilteredTeamMembers, columnWidths, handleMouseDown])

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
    <div className="h-screen flex bg-gradient-to-br from-purple-50/50 via-white to-emerald-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
      <AppSidebar />

      {/* Main Content - Fixed height container */}
      <main className="flex-1 flex flex-col h-screen w-full overflow-hidden">
        {/* Compact Header */}
        <header className="glass border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-md">
                <LayoutGrid className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">
                  Task Dashboard
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Workspace Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {autoSaving && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 shadow-sm animate-fade-in">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500 dark:text-purple-400" />
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Saving...</span>
              </div>
            )}
            {lastSaved && !autoSaving && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/30 shadow-sm animate-fade-in">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Saved</span>
              </div>
            )}
          </div>
        </header>

        {/* Compact Toolbar */}
        <div className="glass border-b border-gray-200/50 flex-shrink-0 z-20 backdrop-blur-xl shadow-sm">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 h-9 px-3 rounded-lg border hover:border-purple-300 bg-white hover:bg-purple-50 transition-all font-medium text-xs"
                  data-testid="toggle-filters"
                >
                  <SlidersHorizontal className="h-4 w-4 text-purple-500" strokeWidth={2} />
                  <span className="text-gray-700">{showFilters ? 'Hide Filters' : 'Filters'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToExcel}
                  className="gap-2 h-9 px-3 rounded-lg border hover:border-emerald-300 bg-white hover:bg-emerald-50 transition-all font-medium text-xs"
                  data-testid="export-excel-btn"
                >
                  <Download className="h-4 w-4 text-emerald-500" strokeWidth={2} />
                  <span className="text-gray-700">Export</span>
                </Button>
              </div>
              <Button 
                onClick={handleAddTask} 
                className="gap-2 h-9 px-4 modern-button bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg font-semibold text-xs" 
                data-testid="add-task-btn"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                <span>New Task</span>
              </Button>
            </div>

            {showFilters && (
              <div className="flex items-center gap-3 flex-wrap animate-fade-in">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48" data-testid="priority-filter">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48" data-testid="department-filter">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2" data-testid="date-range-filter">
                      <CalendarIcon className="h-4 w-4" />
                      {dateRangeFilter.from ? (
                        dateRangeFilter.to ? (
                          <>
                            {format(dateRangeFilter.from, 'MMM d')} - {format(dateRangeFilter.to, 'MMM d')}
                          </>
                        ) : (
                          format(dateRangeFilter.from, 'MMM d, yyyy')
                        )
                      ) : (
                        'Date Range'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRangeFilter.from, to: dateRangeFilter.to }}
                      onSelect={(range) => setDateRangeFilter({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all')
                    setPriorityFilter('all')
                    setDepartmentFilter('all')
                    setDateRangeFilter({})
                  }}
                  data-testid="clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Compact Task Table */}
        <div className="flex-1 overflow-hidden px-6 py-4 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 animate-fade-in">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white" strokeWidth={2.5} />
              </div>
              <p className="text-base font-bold text-gray-700">Loading tasks...</p>
              <p className="text-xs text-gray-500">Getting everything ready</p>
            </div>
          ) : (
            <div className="modern-card border border-gray-200 shadow-lg h-full flex flex-col overflow-hidden bg-white">
              {/* Table Container */}
              <div className="flex-1 overflow-auto" data-testid="tasks-table" style={{scrollbarGutter: 'stable'}}>
                <table className="w-full border-collapse min-w-max">
                  {/* Compact Headers */}
                  <thead className="sticky top-0 z-10 backdrop-blur-xl bg-gradient-to-r from-gray-50 to-purple-50/50 border-b-2 border-gray-200">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th 
                            key={header.id} 
                            className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-gray-700 whitespace-nowrap"
                            style={{ 
                              width: header.column.columnDef.size,
                              minWidth: header.column.columnDef.minSize,
                              maxWidth: header.column.columnDef.size
                            }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  {/* Compact Rows */}
                  <tbody>
                    {table.getRowModel().rows.map((row, index) => (
                      <tr 
                        key={row.id}
                        className={cn(
                          'group border-b border-gray-100 hover:shadow-md transition-all duration-200',
                          getStatusColor(row.original.status),
                          'animate-fade-in'
                        )}
                        style={{animationDelay: `${index * 20}ms`}}
                        data-testid={`task-row-${row.original.id}`}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td 
                            key={cell.id} 
                            className="px-3 py-2 text-sm"
                            style={{ 
                              width: cell.column.columnDef.size,
                              minWidth: cell.column.columnDef.minSize,
                              maxWidth: cell.column.columnDef.size 
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Compact Project Tabs */}
        {projects.length > 0 && (
          <div className="glass border-t border-gray-200/50 px-6 py-2.5 overflow-x-auto backdrop-blur-xl shadow-sm flex-shrink-0 z-20">
            <Tabs value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
              <TabsList className="h-auto inline-flex bg-gray-100/50 p-1 rounded-xl">
                {projects.map((project, index) => (
                  <TabsTrigger 
                    key={project.id} 
                    value={project.id} 
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-xs hover:bg-white/80 animate-slide-in"
                    data-testid={`project-tab-${project.id}`}
                    style={{animationDelay: `${index * 30}ms`}}
                  >
                    {project.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
