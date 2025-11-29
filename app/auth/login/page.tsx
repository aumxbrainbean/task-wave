'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Waves, Sparkles, Mail, Lock, ArrowRight, Check } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-pastel flex items-center justify-center p-6 relative overflow-hidden">
      {/* Floating Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-[500px] h-[500px] bg-purple-300/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-[10%] w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-300/15 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col space-y-8 animate-fade-in">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-xl">
                  <Waves className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">Task Wave</h1>
                <p className="text-sm font-medium text-purple-600/70">Modern Task Management</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Welcome back to your
              <span className="block bg-gradient-to-r from-purple-600 via-purple-500 to-emerald-500 bg-clip-text text-transparent">
                productivity hub
              </span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Manage tasks, collaborate with teams, and ride the wave of peak productivity.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            {[
              { icon: Check, text: 'Real-time collaboration', color: 'text-purple-500' },
              { icon: Check, text: 'Intuitive task management', color: 'text-emerald-500' },
              { icon: Check, text: 'Smart auto-save', color: 'text-sky-500' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 animate-slide-in" style={{animationDelay: `${i * 100}ms`}}>
                <div className="h-8 w-8 rounded-lg bg-white shadow-md flex items-center justify-center">
                  <feature.icon className={`h-4 w-4 ${feature.color}`} strokeWidth={2.5} />
                </div>
                <span className="text-gray-700 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="p-8 lg:p-10 shadow-2xl border-2 border-white/50 bg-white/80 backdrop-blur-xl animate-scale-in">
          <div className="space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-xl">
                  <Waves className="w-9 h-9 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>

            <div className="text-center lg:text-left space-y-2">
              <h3 className="text-3xl font-bold text-gray-900">Sign in</h3>
              <p className="text-gray-600">Enter your credentials to access your workspace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="animate-fade-in border-2">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-gray-900">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="modern-input pl-12 h-14 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-gray-900">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="modern-input pl-12 h-14 text-base"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-base modern-button bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-bold hover:underline transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
