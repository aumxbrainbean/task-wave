import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  fetchUser: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  fetchUser: async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        set({ user: profile, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      set({ user: null, loading: false })
    }
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
