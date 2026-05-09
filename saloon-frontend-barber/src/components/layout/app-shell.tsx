import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, CalendarDays, List, Settings, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth.store'

const nav = [
  { to: '/', label: 'Today', icon: Home, exact: true },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays, exact: false },
  { to: '/bookings', label: 'Bookings', icon: List, exact: false },
  { to: '/notifications', label: 'Alerts', icon: Bell, exact: false },
  { to: '/profile', label: 'Profile', icon: Settings, exact: false },
]

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-gray-900 text-lg">Saloon<span className="text-brand-600">·</span>Barber</span>
      </header>

      <main className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100">
        <div className="flex">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) => cn(
                'flex flex-1 flex-col items-center gap-0.5 pt-2 pb-3 text-[10px] font-medium',
                isActive ? 'text-brand-600' : 'text-gray-400',
              )}>
              {({ isActive }) => (<><Icon className={cn('h-5 w-5', isActive && 'fill-current')} />{label}</>)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
