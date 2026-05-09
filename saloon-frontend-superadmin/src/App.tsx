import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { authApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ToastProvider } from '@/components/ui/index'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/auth/login'
import { ForgotPage } from '@/pages/auth/forgot'
import { ResetPage } from '@/pages/auth/reset'
import { OverviewPage } from '@/pages/overview'
import { SaloonsListPage } from '@/pages/saloons/list'
import { SaloonDetailPage } from '@/pages/saloons/detail'
import { NewSaloonPage } from '@/pages/saloons/new'
import { OwnersListPage } from '@/pages/owners/list'
import { OwnerDetailPage } from '@/pages/owners/detail'
import { NewOwnerPage } from '@/pages/owners/new'
import { BarbersListPage } from '@/pages/barbers/list'
import { BarberDetailPage } from '@/pages/barbers/detail'
import { CustomersListPage } from '@/pages/customers/list'
import { CustomerDetailPage } from '@/pages/customers/detail'
import { BookingsListPage } from '@/pages/bookings/list'
import { BookingDetailPage } from '@/pages/bookings/detail'
import { AuditPage } from '@/pages/audit'
import { AnalyticsPage } from '@/pages/analytics'
import { NotificationsPage } from '@/pages/notifications'
import { ProfilePage } from '@/pages/profile'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { login, logout, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('sa_access_token')
    const refresh = localStorage.getItem('sa_refresh_token') ?? ''
    if (!token) { setLoading(false); return }
    setLoading(true)
    authApi.me()
      .then(user => {
        if (user.role !== 'super_admin') logout()
        else login(user, token, refresh)
      })
      .catch(logout)
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
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
              <Route path="/auth/forgot" element={<ForgotPage />} />
              <Route path="/auth/reset" element={<ResetPage />} />
              <Route path="/*" element={
                <RequireAuth>
                  <AppShell>
                    <Routes>
                      <Route index element={<OverviewPage />} />
                      <Route path="saloons" element={<SaloonsListPage />} />
                      <Route path="saloons/new" element={<NewSaloonPage />} />
                      <Route path="saloons/:id" element={<SaloonDetailPage />} />
                      <Route path="owners" element={<OwnersListPage />} />
                      <Route path="owners/new" element={<NewOwnerPage />} />
                      <Route path="owners/:id" element={<OwnerDetailPage />} />
                      <Route path="barbers" element={<BarbersListPage />} />
                      <Route path="barbers/:id" element={<BarberDetailPage />} />
                      <Route path="customers" element={<CustomersListPage />} />
                      <Route path="customers/:id" element={<CustomerDetailPage />} />
                      <Route path="bookings" element={<BookingsListPage />} />
                      <Route path="bookings/:id" element={<BookingDetailPage />} />
                      <Route path="audit" element={<AuditPage />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="profile" element={<ProfilePage />} />
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
