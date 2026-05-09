import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { authApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ToastProvider } from '@/components/ui/toast'
import { MainLayout } from '@/components/layout/main-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { ProtectedRoute } from '@/components/layout/protected-route'

// Pages
import { HomePage } from '@/pages/home'
import { SaloonListPage } from '@/pages/saloons/saloon-list'
import { SaloonDetailPage } from '@/pages/saloons/saloon-detail'
import { BookingFlowPage } from '@/pages/saloons/booking-flow'
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { ForgotPasswordPage } from '@/pages/auth/forgot'
import { ResetPasswordPage } from '@/pages/auth/reset'
import { AccountHomePage } from '@/pages/account/account-home'
import { BookingsListPage } from '@/pages/account/bookings-list'
import { BookingDetailPage } from '@/pages/account/booking-detail'
import { ProfilePage } from '@/pages/account/profile'
import { NotificationsPage } from '@/pages/account/notifications'
import { LegalPage } from '@/pages/legal'
import { NotFoundPage } from '@/pages/not-found'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then((user) => { setUser(user); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [setUser, setLoading])

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthBootstrap>
            <Routes>
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
                <Route path="/auth/reset" element={<ResetPasswordPage />} />
              </Route>

              {/* Main app */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/saloons" element={<SaloonListPage />} />
                <Route path="/saloons/:slug" element={<SaloonDetailPage />} />
                <Route
                  path="/saloons/:slug/book"
                  element={
                    <ProtectedRoute>
                      <BookingFlowPage />
                    </ProtectedRoute>
                  }
                />

                {/* Account routes (protected) */}
                <Route
                  path="/account"
                  element={<ProtectedRoute><AccountHomePage /></ProtectedRoute>}
                />
                <Route
                  path="/account/bookings"
                  element={<ProtectedRoute><BookingsListPage /></ProtectedRoute>}
                />
                <Route
                  path="/account/bookings/:id"
                  element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>}
                />
                <Route
                  path="/account/profile"
                  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
                />
                <Route
                  path="/account/notifications"
                  element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
                />

                {/* Legal */}
                <Route path="/legal/terms" element={<LegalPage type="terms" />} />
                <Route path="/legal/privacy" element={<LegalPage type="privacy" />} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AuthBootstrap>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
