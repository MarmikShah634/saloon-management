import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { authApi, barberApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ToastProvider } from '@/components/ui/index'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/auth/login'
import { TodayPage } from '@/pages/today'
import { SchedulePage } from '@/pages/schedule'
import { WorkingHoursPage } from '@/pages/working-hours'
import { ProfilePage } from '@/pages/profile'
import { NotificationsPage } from '@/pages/notifications'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })

function Guard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" /></div>
  if (!user) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setBarberId } = useAuthStore()
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    authApi.me()
      .then(async user => {
        setUser(user); setLoading(false)
        try { const b = await barberApi.getMe(); setBarberId(b.id) } catch { /* ignore */ }
      })
      .catch(() => setLoading(false))
  }, [setUser, setLoading, setBarberId])
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthBootstrap>
            <Routes>
              <Route path="/auth/login" element={<LoginPage />} />
              <Route element={<Guard><AppShell /></Guard>}>
                <Route path="/" element={<TodayPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/working-hours" element={<WorkingHoursPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </AuthBootstrap>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
