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
import { Loader2, Plus, Trash2, ArrowLeft, Users, Pencil, Building2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { AppSidebar } from '@/components/app-sidebar'
import type { Department, TeamMember } from '@/types'

export default function DepartmentsPage() {
  const router = useRouter()
  const { user, fetchUser } = useAuthStore()
  const [departments, setDepartments] = useState<Department[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [memberForm, setMemberForm] = useState({
    name: '', email: '', role: '', designation: ''
  })

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchUser()
      await fetchDepartments()
    }
    init()
  }, [router])

  const fetchDepartments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tms_departments')
      .select('*')
      .order('name')
    
    if (!error && data) setDepartments(data)
    setLoading(false)
  }

  const fetchTeamMembers = async (departmentId: string) => {
    const { data, error } = await supabase
      .from('tms_team_members')
      .select('*')
      .eq('department_id', departmentId)
      .order('name')
    
    if (!error && data) setTeamMembers(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingDepartment) {
      // Update existing department
      const { error } = await supabase
        .from('tms_departments')
        .update(formData)
        .eq('id', editingDepartment.id)
      
      if (!error) {
        setDialogOpen(false)
        setFormData({ name: '', description: '' })
        setEditingDepartment(null)
        await fetchDepartments()
      }
    } else {
      // Create new department
      const { error } = await supabase
        .from('tms_departments')
        .insert([formData])
      
      if (!error) {
        setDialogOpen(false)
        setFormData({ name: '', description: '' })
        await fetchDepartments()
      }
    }
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setFormData({ name: department.name, description: department.description || '' })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department? All team members will be removed.')) return
    
    const { error } = await supabase
      .from('tms_departments')
      .delete()
      .eq('id', id)
    
    if (!error) await fetchDepartments()
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDepartment) return
    
    if (editingMember) {
      // Update existing member
      const { error } = await supabase
        .from('tms_team_members')
        .update(memberForm)
        .eq('id', editingMember.id)
      
      if (!error) {
        setMemberDialogOpen(false)
        setMemberForm({ name: '', email: '', role: '', designation: '' })
        setEditingMember(null)
        await fetchTeamMembers(selectedDepartment.id)
      }
    } else {
      // Create new member
      const { error } = await supabase
        .from('tms_team_members')
        .insert([{ ...memberForm, department_id: selectedDepartment.id }])
      
      if (!error) {
        setMemberDialogOpen(false)
        setMemberForm({ name: '', email: '', role: '', designation: '' })
        await fetchTeamMembers(selectedDepartment.id)
      }
    }
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setMemberForm({
      name: member.name,
      email: member.email || '',
      role: member.role || '',
      designation: member.designation || ''
    })
    setMemberDialogOpen(true)
  }

  const handleDeleteMember = async (id: string) => {
    const { error } = await supabase
      .from('tms_team_members')
      .delete()
      .eq('id', id)
    
    if (!error && selectedDepartment) {
      await fetchTeamMembers(selectedDepartment.id)
    }
  }

  const handleViewMembers = (department: Department) => {
    setSelectedDepartment(department)
    fetchTeamMembers(department.id)
  }

  if (!user) return null

  const canManage = true  // Both admin and PM can manage departments
  const canDelete = true  // Both admin and PM can delete

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
              className="h-9 w-9 rounded-lg border hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md">
                <Building2 className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-emerald-300">Departments</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Manage departments and teams</p>
              </div>
            </div>
          </div>
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all text-sm font-semibold rounded-lg">
                  <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                  New Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDepartment ? 'Edit Department' : 'Create New Department'}</DialogTitle>
                  <DialogDescription>{editingDepartment ? 'Update department details' : 'Add a new department'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Department Name</Label>
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
                    <Button type="submit">{editingDepartment ? 'Update Department' : 'Create Department'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {selectedDepartment ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedDepartment.name} - Team Members</CardTitle>
                  <CardDescription>Manage department team members</CardDescription>
                </div>
                <div className="flex gap-2">
                  {canManage && (
                    <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddMember}>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="tm-name">Name</Label>
                              <Input
                                id="tm-name"
                                value={memberForm.name}
                                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tm-email">Email</Label>
                              <Input
                                id="tm-email"
                                type="email"
                                value={memberForm.email}
                                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tm-role">Role</Label>
                              <Input
                                id="tm-role"
                                value={memberForm.role}
                                onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tm-designation">Designation</Label>
                              <Input
                                id="tm-designation"
                                value={memberForm.designation}
                                onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">{editingMember ? 'Update Member' : 'Add Member'}</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button variant="outline" onClick={() => setSelectedDepartment(null)}>Back</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Designation</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.role || '-'}</TableCell>
                      <TableCell>{member.designation || '-'}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditMember(member)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {teamMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={canManage ? 5 : 4} className="text-center text-muted-foreground">
                        No team members yet
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
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Loader2 className="h-7 w-7 animate-spin text-white" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading departments...</p>
              </div>
            ) : (
              departments.map((department, index) => (
                <Card key={department.id} className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                          </div>
                          <CardTitle className="text-base font-bold text-gray-900 dark:text-white truncate">{department.name}</CardTitle>
                        </div>
                        <CardDescription className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{department.description || 'No description'}</CardDescription>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMembers(department)}
                          className="h-8 px-3 text-xs border-gray-300 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300"
                        >
                          <Users className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                          <span className="hidden sm:inline">Members</span>
                        </Button>
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(department)}
                              className="h-8 w-8 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                              <Pencil className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(department.id)}
                                className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" strokeWidth={2} />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
            {!loading && departments.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No departments yet. Create one to get started.
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
