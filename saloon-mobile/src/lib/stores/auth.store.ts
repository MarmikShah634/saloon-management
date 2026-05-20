import { create } from 'zustand'
import { clearTokens } from '@/lib/api/client'
import type { User } from '@/lib/api/endpoints'

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    await clearTokens()
    set({ user: null })
  },
}))
