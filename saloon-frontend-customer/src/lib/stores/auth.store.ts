import { create } from 'zustand'
import { clearTokens, setTokens } from '@/lib/api/client'
import type { User } from '@/lib/api/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (v: boolean) => void
  login: (user: User, access: string, refresh: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  login: (user, access, refresh) => {
    setTokens(access, refresh)
    set({ user })
  },
  logout: () => {
    clearTokens()
    set({ user: null })
  },
}))
