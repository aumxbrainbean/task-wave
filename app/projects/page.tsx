'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, Users, FolderKanban, Sparkles } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { AppSidebar } from '@/components/app-sidebar'
import type { Project, Stakeholder } from '@/types'

export default function ProjectsPage() {
  const router = useRouter()
  const { user, fetchUser } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [pms, setPMs] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [stakeholderDialogOpen, setStakeholderDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null)
  
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [stakeholderForm, setStakeholderForm] = useState({
    name: '', email: '', phone: '', designation: ''
  })

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchUser()
      await fetchPMs()
      await fetchProjects()
    }
    init()
  }, [router])

  const fetchPMs = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .order('full_name', { ascending: true })
    
    if (!error && data) setPMs(data)
  }

  const fetchProjects = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tms_projects')
      .select(`
        *,
        assigned_pm:user_profiles!assigned_pm_id(id, email, full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (!error && data) setProjects(data)
    setLoading(false)
  }

  const handleAssignPM = async (projectId: string, pmId: string | null) => {
    // Find the project to check current assignment
    const project = projects.find(p => p.id === projectId)
    
    // If PM role: can only assign themselves to unassigned projects or unassign their own projects
    if (user?.role === 'project_manager') {
      if (project?.assigned_pm_id && project.assigned_pm_id !== user.id) {
        alert('You cannot unassign projects assigned to other PMs')
        return
      }
      if (pmId && pmId !== user.id) {
        alert('You can only assign projects to yourself')
        return
      }
    }
    
    const { error } = await supabase
      .from('tms_projects')
      .update({ assigned_pm_id: pmId })
      .eq('id', projectId)
    
    if (!error) await fetchProjects()
  }

  const fetchStakeholders = async (projectId: string) => {
    const { data, error } = await supabase
      .from('tms_stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .order('name')
    
    if (!error && data) setStakeholders(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingProject) {
      // Update existing project
      const { error } = await supabase
        .from('tms_projects')
        .update(formData)
        .eq('id', editingProject.id)
      
      if (!error) {
        setDialogOpen(false)
        setFormData({ name: '', description: '' })
        setEditingProject(null)
        await fetchProjects()
      }
    } else {
      // Create new project
      const { error } = await supabase
        .from('tms_projects')
        .insert([{ ...formData, created_by: user?.id }])
      
      if (!error) {
        setDialogOpen(false)
        setFormData({ name: '', description: '' })
        await fetchProjects()
      }
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({ name: project.name, description: project.description || '' })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? All tasks will be deleted.')) return
    
    const { error } = await supabase
      .from('tms_projects')
      .delete()
      .eq('id', id)
    
    if (!error) await fetchProjects()
  }

  const handleAddStakeholder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    
    if (editingStakeholder) {
      // Update existing stakeholder
      const { error } = await supabase
        .from('tms_stakeholders')
        .update(stakeholderForm)
        .eq('id', editingStakeholder.id)
      
      if (!error) {
        setStakeholderDialogOpen(false)
        setStakeholderForm({ name: '', email: '', phone: '', designation: '' })
        setEditingStakeholder(null)
        await fetchStakeholders(selectedProject.id)
      }
    } else {
      // Create new stakeholder
      const { error } = await supabase
        .from('tms_stakeholders')
        .insert([{ ...stakeholderForm, project_id: selectedProject.id }])
      
      if (!error) {
        setStakeholderDialogOpen(false)
        setStakeholderForm({ name: '', email: '', phone: '', designation: '' })
        await fetchStakeholders(selectedProject.id)
      }
    }
  }

  const handleEditStakeholder = (stakeholder: Stakeholder) => {
    setEditingStakeholder(stakeholder)
    setStakeholderForm({
      name: stakeholder.name,
      email: stakeholder.email || '',
      phone: stakeholder.phone || '',
      designation: stakeholder.designation || ''
    })
    setStakeholderDialogOpen(true)
  }

  const handleDeleteStakeholder = async (id: string) => {
    const { error } = await supabase
      .from('tms_stakeholders')
      .delete()
      .eq('id', id)
    
    if (!error && selectedProject) {
      await fetchStakeholders(selectedProject.id)
    }
  }

  const handleViewStakeholders = (project: Project) => {
    setSelectedProject(project)
    fetchStakeholders(project.id)
  }

  if (!user) return null

  const canManage = user.role === 'admin' || user.role === 'project_manager'

  return (
    <div className="h-screen flex bg-gradient-to-br from-purple-50/50 via-white to-emerald-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <AppSidebar />
      <main className="flex-1 overflow-auto w-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push('/dashboard')}
              className="h-9 w-9 rounded-lg border hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
            >
              <ArrowLeft className="h-4 w-4 text-sky-600 dark:text-sky-400" strokeWidth={2} />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center shadow-md">
                <FolderKanban className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-sky-500 bg-clip-text text-transparent dark:from-sky-400 dark:to-sky-300">Projects</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Manage projects and stakeholders</p>
              </div>
            </div>
          </div>
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 px-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-md hover:shadow-lg transition-all text-sm font-semibold rounded-lg">
                  <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
                  <DialogDescription>{editingProject ? 'Update project details' : 'Add a new project to manage tasks'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editingProject ? 'Update Project' : 'Create Project'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {selectedProject ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedProject.name} - Stakeholders</CardTitle>
                  <CardDescription>Manage project stakeholders</CardDescription>
                </div>
                <div className="flex gap-2">
                  {canManage && (
                    <Dialog open={stakeholderDialogOpen} onOpenChange={setStakeholderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Stakeholder
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingStakeholder ? 'Edit Stakeholder' : 'Add Stakeholder'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddStakeholder}>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="sh-name">Name</Label>
                              <Input
                                id="sh-name"
                                value={stakeholderForm.name}
                                onChange={(e) => setStakeholderForm({ ...stakeholderForm, name: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sh-email">Email</Label>
                              <Input
                                id="sh-email"
                                type="email"
                                value={stakeholderForm.email}
                                onChange={(e) => setStakeholderForm({ ...stakeholderForm, email: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sh-phone">Phone</Label>
                              <Input
                                id="sh-phone"
                                value={stakeholderForm.phone}
                                onChange={(e) => setStakeholderForm({ ...stakeholderForm, phone: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sh-designation">Designation</Label>
                              <Input
                                id="sh-designation"
                                value={stakeholderForm.designation}
                                onChange={(e) => setStakeholderForm({ ...stakeholderForm, designation: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">{editingStakeholder ? 'Update Stakeholder' : 'Add Stakeholder'}</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button variant="outline" onClick={() => setSelectedProject(null)}>Back</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Designation</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stakeholders.map(sh => (
                    <TableRow key={sh.id}>
                      <TableCell className="font-medium">{sh.name}</TableCell>
                      <TableCell>{sh.email || '-'}</TableCell>
                      <TableCell>{sh.phone || '-'}</TableCell>
                      <TableCell>{sh.designation || '-'}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStakeholder(sh)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStakeholder(sh.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {stakeholders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={canManage ? 5 : 4} className="text-center text-muted-foreground">
                        No stakeholders yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center shadow-lg">
                  <Loader2 className="h-7 w-7 animate-spin text-white" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading projects...</p>
              </div>
            ) : (
              projects.map((project, index) => (
                <Card key={project.id} className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30 flex items-center justify-center flex-shrink-0">
                            <FolderKanban className="h-4 w-4 text-sky-600 dark:text-sky-400" strokeWidth={2} />
                          </div>
                          <CardTitle className="text-base font-bold text-gray-900 dark:text-white truncate">{project.name}</CardTitle>
                        </div>
                        <CardDescription className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{project.description || 'No description'}</CardDescription>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0">PM:</span>
                          <Select
                            value={project.assigned_pm_id || 'unassigned'}
                            onValueChange={(value) => handleAssignPM(project.id, value === 'unassigned' ? null : value)}
                            disabled={user?.role === 'project_manager' && project.assigned_pm_id && project.assigned_pm_id !== user.id}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs border-gray-300 dark:border-gray-600">
                              <SelectValue placeholder="Select PM" />
                            </SelectTrigger>
                            <SelectContent>
                              {(user?.role === 'admin' || !project.assigned_pm_id) && (
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                              )}
                              {user?.role === 'admin' ? (
                                pms.map(pm => (
                                  <SelectItem key={pm.id} value={pm.id}>
                                    {pm.full_name || pm.email}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value={user?.id || ''}>
                                  {user?.full_name || user?.email || 'Me'}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStakeholders(project)}
                          className="h-8 px-3 text-xs border-gray-300 dark:border-gray-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-300"
                        >
                          <Users className="mr-1.5 h-3.5 w-3.5 text-sky-600 dark:text-sky-400" strokeWidth={2} />
                          <span className="hidden sm:inline">Stakeholders</span>
                        </Button>
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(project)}
                              className="h-8 w-8 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                              <Pencil className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(project.id)}
                              className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
            {!loading && projects.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No projects yet. Create one to get started.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      </main>
    </div>
  )
}
