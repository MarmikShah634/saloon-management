import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { authApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ToastProvider } from '@/components/ui/index'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/auth/login'
import { DashboardPage } from '@/pages/dashboard'
import { BookingsPage } from '@/pages/bookings'
import { ServicesPage } from '@/pages/services'
import { BarbersPage } from '@/pages/barbers'
import { AnalyticsPage } from '@/pages/analytics'
import { SaloonPage } from '@/pages/saloon'
import { ProfilePage } from '@/pages/profile'
import { NotificationsPage } from '@/pages/notifications'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { login, logout, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token') ?? ''
    if (!token) { setLoading(false); return }
    setLoading(true)
    authApi.me()
      .then(user => {
        if (user.role !== 'owner') logout()
        else login(user, token, refresh)
      })
      .catch(logout)
      .finally(() => setLoading(false))
  }, [])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
    </div>
  )
  return <>{children}</>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth/login" replace />
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
              <Route path="/*" element={
                <RequireAuth>
                  <AppShell>
                    <Routes>
                      <Route index element={<DashboardPage />} />
                      <Route path="bookings" element={<BookingsPage />} />
                      <Route path="services" element={<ServicesPage />} />
                      <Route path="barbers" element={<BarbersPage />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="saloon" element={<SaloonPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AppShell>
                </RequireAuth>
              } />
            </Routes>
          </AuthBootstrap>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
