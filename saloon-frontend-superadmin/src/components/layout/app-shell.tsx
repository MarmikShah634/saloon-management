import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Store, Users, Scissors, UserCheck, CalendarDays,
  BarChart2, ClipboardList, Bell, LogOut, User, ChevronRight, Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth.store'
import { authApi } from '@/lib/api/endpoints'
import { CommandPalette, useCommandPalette } from '@/components/command-palette'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', exact: true },
  { to: '/saloons', icon: Store, label: 'Saloons', exact: false },
  { to: '/owners', icon: Users, label: 'Owners', exact: false },
  { to: '/barbers', icon: Scissors, label: 'Barbers', exact: false },
  { to: '/customers', icon: UserCheck, label: 'Customers', exact: false },
  { to: '/bookings', icon: CalendarDays, label: 'Bookings', exact: false },
  { to: '/analytics', icon: BarChart2, label: 'Analytics', exact: false },
  { to: '/audit', icon: ClipboardList, label: 'Audit Log', exact: false },
  { to: '/notifications', icon: Bell, label: 'Notifications', exact: false },
]

function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    logout(); navigate('/auth/login')
  }
  return (
    <aside className="w-52 min-h-screen bg-slate-900 flex flex-col py-4">
      <div className="px-4 mb-6">
        <span className="text-white font-bold text-sm tracking-tight">Saloon<span className="text-slate-400">·</span>Admin</span>
        {import.meta.env.VITE_ENV && (
          <span className="ml-2 text-xs text-slate-500 font-mono">{import.meta.env.VITE_ENV}</span>
        )}
      </div>
      <nav className="flex-1 px-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}>
            <Icon className="h-4 w-4 flex-shrink-0" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 px-4 pt-4 border-t border-slate-800">
        {user && (
          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 w-full text-left mb-3 group">
            <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 group-hover:bg-slate-600">
              {user.name[0].toUpperCase()}
            </div>
            <span className="text-xs truncate">{user.name}</span>
          </button>
        )}
        <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors">
          <LogOut className="h-3.5 w-3.5" />Sign out
        </button>
      </div>
    </aside>
  )
}

function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)
  return (
    <header className="h-12 border-b border-slate-200 bg-white flex items-center px-5 gap-3 flex-shrink-0">
      <nav className="flex items-center gap-1 text-sm text-slate-500 flex-1">
        <span className="text-slate-400 text-xs">Admin</span>
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className={cn('capitalize text-xs', i === parts.length - 1 ? 'text-slate-900 font-medium' : 'text-slate-500')}>
              {p.replace(/-/g, ' ')}
            </span>
          </span>
        ))}
      </nav>
      <button onClick={onOpenPalette} className="flex items-center gap-2 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 h-7 hover:bg-slate-50 transition-colors">
        <Search className="h-3.5 w-3.5" />
        <span>Search</span>
        <kbd className="font-mono text-[10px] text-slate-400">⌘K</kbd>
      </button>
      <NavLink to="/notifications" className="text-slate-500 hover:text-slate-900">
        <Bell className="h-4 w-4" />
      </NavLink>
      <NavLink to="/profile" className="text-slate-500 hover:text-slate-900">
        <User className="h-4 w-4" />
      </NavLink>
    </header>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette()
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenPalette={() => setOpen(true)} />
        <main className="flex-1 overflow-auto p-5">{children}</main>
      </div>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
