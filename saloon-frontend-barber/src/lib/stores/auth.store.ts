import { create } from 'zustand'
import { clearTokens, setTokens } from '@/lib/api/client'
import type { User } from '@/lib/api/endpoints'

interface AuthState {
  user: User | null
  isLoading: boolean
  barberId: string | null
  setUser: (user: User | null) => void
  setLoading: (v: boolean) => void
  setBarberId: (id: string | null) => void
  login: (user: User, access: string, refresh: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  barberId: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setBarberId: (barberId) => set({ barberId }),
  login: (user, access, refresh) => { setTokens(access, refresh); set({ user }) },
  logout: () => { clearTokens(); set({ user: null, barberId: null }) },
}))
