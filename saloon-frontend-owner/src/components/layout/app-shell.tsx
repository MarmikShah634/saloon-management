import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Scissors, Users, CalendarDays, BarChart2, Settings, Bell, LogOut, Menu, X } from 'lucide-react'
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
    <aside className="w-56 h-full bg-white border-r border-gray-100 flex flex-col py-4 px-3">
      <div className="flex items-center justify-between mb-6 px-2">
        <span className="font-bold text-gray-900">Saloon<span className="text-brand-600">·</span>Owner</span>
        {onClose && <button onClick={onClose} className="lg:hidden"><X className="h-5 w-5" /></button>}
      </div>
      <nav className="flex-1 space-y-1">
        {nav.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) => cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors', isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50')}
            onClick={onClose}>
            <Icon className="h-4 w-4" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 pt-4 border-t border-gray-100 px-2">
        {user && <p className="text-xs text-gray-500 truncate mb-2">{user.name}</p>}
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium">
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>
    </aside>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 flex flex-col w-56">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="font-bold text-gray-900">Saloon<span className="text-brand-600">·</span>Owner</span>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
