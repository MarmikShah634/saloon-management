import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, CalendarDays, List, Settings, Bell, Scissors, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth.store'
import { authApi } from '@/lib/api/endpoints'

const nav = [
  { to: '/', label: 'Today', icon: Home, exact: true },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays, exact: false },
  { to: '/bookings', label: 'Bookings', icon: List, exact: false },
  { to: '/notifications', label: 'Alerts', icon: Bell, exact: false },
  { to: '/profile', label: 'Profile', icon: Settings, exact: false },
]

export function AppShell() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass border-b border-brand-100/50">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-sm">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Barber<span className="text-brand-600">·</span>Pro</span>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <div className="h-7 w-7 rounded-lg bg-brand-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-brand-700">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-medium">{user.name.split(' ')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Premium bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-brand-100/50 safe-bottom">
        <div className="flex">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) => cn(
                'flex flex-1 flex-col items-center gap-0.5 pt-2.5 pb-3 text-[10px] font-semibold transition-colors',
                isActive ? 'text-brand-600' : 'text-gray-400',
              )}>
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-xl transition-all',
                    isActive ? 'bg-brand-100' : '',
                  )}>
                    <Icon className={cn('h-5 w-5', isActive && 'text-brand-600')} />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
