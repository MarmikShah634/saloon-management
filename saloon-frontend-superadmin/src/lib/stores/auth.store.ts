import { create } from 'zustand'
import { clearTokens, setTokens } from '@/lib/api/client'
import type { User } from '@/lib/api/endpoints'

interface AuthState {
  user: User | null
  isLoading: boolean
  updateUser: (user: User) => void
  setLoading: (v: boolean) => void
  login: (user: User, access: string, refresh: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  updateUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  login: (user, access, refresh) => { setTokens(access, refresh); set({ user }) },
  logout: () => { clearTokens(); set({ user: null }) },
}))
