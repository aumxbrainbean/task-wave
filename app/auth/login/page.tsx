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
    <div className="min-h-screen bg-gradient-to-br from-purple-50/80 via-white to-emerald-50/60 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Floating Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-[400px] h-[400px] bg-purple-200/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-[10%] w-[500px] h-[500px] bg-emerald-200/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-sky-200/8 rounded-full blur-[80px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col space-y-6 animate-fade-in">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 bg-white/70 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-md border border-purple-100/50">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-lg">
                  <Waves className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  <Sparkles className="w-2 h-2 text-white" strokeWidth={3} />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">Task Wave</h1>
                <p className="text-[10px] font-semibold text-purple-500/70 uppercase tracking-wide">Modern Task Management</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              Welcome back to your
              <span className="block bg-gradient-to-r from-purple-500 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                productivity hub
              </span>
            </h2>
            <p className="text-base text-gray-600 leading-relaxed">
              Manage tasks, collaborate with teams, and ride the wave of peak productivity.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {[
              { icon: Check, text: 'Real-time collaboration', color: 'text-purple-400' },
              { icon: Check, text: 'Intuitive task management', color: 'text-emerald-400' },
              { icon: Check, text: 'Smart auto-save', color: 'text-sky-400' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 animate-slide-in" style={{animationDelay: `${i * 100}ms`}}>
                <div className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-100">
                  <feature.icon className={`h-3.5 w-3.5 ${feature.color}`} strokeWidth={2.5} />
                </div>
                <span className="text-sm text-gray-700 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form - MORE COMPACT */}
        <Card className="p-6 shadow-xl border border-white/80 bg-white/90 backdrop-blur-xl animate-scale-in">
          <div className="space-y-6">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-lg">
                  <Waves className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                  <Sparkles className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>

            <div className="text-center lg:text-left space-y-1">
              <h3 className="text-2xl font-bold text-gray-900">Sign in</h3>
              <p className="text-sm text-gray-600">Enter your credentials to access your workspace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-fade-in border">
                  <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-gray-900">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="modern-input pl-10 h-11 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-gray-900">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="modern-input pl-10 h-11 text-sm"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-sm modern-button bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-gray-600">
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
