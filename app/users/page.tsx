'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { AppSidebar } from '@/components/app-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil, Trash2, Users as UsersIcon } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface Project {
  id: string
  name: string
  assigned_pm_id: string | null
}

export default function UsersPage() {
  const router = useRouter()
  const { user, fetchUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectAssignments, setProjectAssignments] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ full_name: '', email: '' })

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchUser()
      await fetchUsers()
      await fetchProjects()
    }
    init()
  }, [router])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setUsers(data)
      await fetchProjectAssignments(data)
    }
    setLoading(false)
  }

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('tms_projects')
      .select('id, name, assigned_pm_id')
      .order('name', { ascending: true })
    
    if (!error && data) setProjects(data)
  }

  const fetchProjectAssignments = async (usersList: User[]) => {
    const assignments: Record<string, string[]> = {}
    
    for (const u of usersList) {
      const { data, error } = await supabase
        .from('tms_projects')
        .select('name')
        .eq('assigned_pm_id', u.id)
      
      if (!error && data) {
        assignments[u.id] = data.map(p => p.name)
      }
    }
    
    setProjectAssignments(assignments)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({ full_name: user.full_name || '', email: user.email })
    setDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: formData.full_name })
      .eq('id', editingUser.id)

    if (!error) {
      setDialogOpen(false)
      setEditingUser(null)
      setFormData({ full_name: '', email: '' })
      await fetchUsers()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)

    if (!error) await fetchUsers()
  }

  const handleAssignProject = async (projectId: string) => {
    if (!selectedUserId) return

    const { error } = await supabase
      .from('tms_projects')
      .update({ assigned_pm_id: selectedUserId })
      .eq('id', projectId)

    if (!error) {
      await fetchProjects()
      await fetchUsers()
    }
  }

  const handleUnassignProject = async (projectId: string) => {
    const { error } = await supabase
      .from('tms_projects')
      .update({ assigned_pm_id: null })
      .eq('id', projectId)

    if (!error) {
      await fetchProjects()
      await fetchUsers()
    }
  }

  const openAssignDialog = (userId: string) => {
    setSelectedUserId(userId)
    setAssignDialogOpen(true)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-auto w-full p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Users Management
              </h1>
              <p className="text-muted-foreground mt-1">Manage Project Managers and their assignments</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Project Managers</CardTitle>
                <CardDescription>All registered PMs and their assigned projects</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Projects</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || 'N/A'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                            {u.role === 'admin' ? 'Admin' : 'PM'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {projectAssignments[u.id]?.length > 0 ? (
                              projectAssignments[u.id].map((projectName, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {projectName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No projects assigned</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAssignDialog(u.id)}
                              title="Assign Projects"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(u)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {u.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(u.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {users.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Projects Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign/Unassign Projects</DialogTitle>
            <DialogDescription>Manage project assignments for this PM</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {projects.map((project) => {
              const isAssigned = project.assigned_pm_id === selectedUserId
              const assignedToOther = project.assigned_pm_id && project.assigned_pm_id !== selectedUserId
              const assignedUser = users.find(u => u.id === project.assigned_pm_id)

              return (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    {assignedToOther && (
                      <p className="text-xs text-muted-foreground">
                        Currently assigned to: {assignedUser?.full_name || assignedUser?.email}
                      </p>
                    )}
                  </div>
                  <div>
                    {isAssigned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignProject(project.id)}
                      >
                        Unassign
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAssignProject(project.id)}
                        disabled={assignedToOther}
                      >
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
