import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Scissors, Users, CalendarDays, BarChart2,
  Settings, Bell, LogOut, Menu, X, TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth.store'
import { authApi } from '@/lib/api/endpoints'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/bookings', icon: CalendarDays, label: 'Bookings', exact: false },
  { to: '/services', icon: Scissors, label: 'Services', exact: false },
  { to: '/barbers', icon: Users, label: 'Barbers', exact: false },
  { to: '/analytics', icon: BarChart2, label: 'Analytics', exact: false },
  { to: '/saloon', icon: Settings, label: 'My Saloon', exact: false },
  { to: '/notifications', icon: Bell, label: 'Notifications', exact: false },
]

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    logout(); navigate('/auth/login')
  }

  return (
    <aside className="w-60 h-full bg-white border-r border-brand-100/60 flex flex-col py-5 px-3">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-sm">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Owner<span className="text-brand-600">·</span>Hub</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5">
        {nav.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
            onClick={onClose}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4 w-4', isActive ? 'text-brand-600' : 'text-gray-400')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 pt-4 border-t border-gray-100 px-2">
        {user && (
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-brand-700">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 flex flex-col w-60">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-40 glass border-b border-brand-100/50 px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-brand-50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-gradient flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Owner<span className="text-brand-600">·</span>Hub</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
