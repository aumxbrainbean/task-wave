'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppSidebar } from '@/components/app-sidebar'
import { ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, fetchUser } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchUser()
    }
    init()
  }, [router])

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Access denied. Admin only.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto w-full p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">System configuration</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>Supabase connection is active</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Project URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                <p><strong>Status:</strong> <span className="text-green-600">Connected</span></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {user.full_name || 'Not set'}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> <span className="capitalize">{user.role.replace('_', ' ')}</span></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Access management pages</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline" onClick={() => router.push('/projects')}>
                Manage Projects
              </Button>
              <Button variant="outline" onClick={() => router.push('/departments')}>
                Manage Departments
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Task Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
    </div>
  )
}
