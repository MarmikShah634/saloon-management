import { create } from 'zustand'
import { clearTokens, setTokens } from '@/lib/api/client'
import type { User } from '@/lib/api/endpoints'

interface AuthState {
  user: User | null; isLoading: boolean; saloonId: string | null
  setUser: (user: User | null) => void; setLoading: (v: boolean) => void; setSaloonId: (id: string | null) => void
  updateUser: (user: User) => void
  login: (user: User, access: string, refresh: string) => void; logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, isLoading: true, saloonId: null,
  setUser: (user) => set({ user }), setLoading: (isLoading) => set({ isLoading }), setSaloonId: (saloonId) => set({ saloonId }),
  updateUser: (user) => set({ user }),
  login: (user, access, refresh) => { setTokens(access, refresh); set({ user }) },
  logout: () => { clearTokens(); set({ user: null, saloonId: null }) },
}))
