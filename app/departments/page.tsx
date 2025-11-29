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
import { Loader2, Plus, Trash2, ArrowLeft, Users, Pencil } from 'lucide-react'
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
    <div className="h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto w-full p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Departments</h1>
              <p className="text-muted-foreground">Manage departments and team members</p>
            </div>
          </div>
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
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
          <div className="grid gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              departments.map(department => (
                <Card key={department.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{department.name}</CardTitle>
                        <CardDescription>{department.description || 'No description'}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMembers(department)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Team Members
                        </Button>
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(department)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(department.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
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
