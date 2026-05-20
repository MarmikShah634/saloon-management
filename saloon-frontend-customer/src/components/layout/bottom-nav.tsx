import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '@/lib/api/endpoints'

const navItems = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/account/bookings', label: 'Bookings', icon: CalendarDays, exact: false },
  { to: '/account/notifications', label: 'Alerts', icon: Bell, exact: false },
  { to: '/account', label: 'Account', icon: User, exact: true },
]

export function BottomNav() {
  const { user } = useAuthStore()

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.list({ unread_only: true, size: 1 }),
    enabled: !!user,
    refetchInterval: 60_000,
  })

  const unreadCount = notifData?.total ?? 0

  if (!user) return null

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-brand-100/50 safe-bottom shadow-nav">
      <div className="flex">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 pt-2.5 pb-3 text-[10px] font-semibold transition-colors',
                isActive ? 'text-brand-600' : 'text-gray-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'relative flex items-center justify-center h-8 w-8 rounded-xl transition-all',
                  isActive ? 'bg-brand-100' : '',
                )}>
                  <Icon className={cn('h-5 w-5', isActive ? 'text-brand-600' : 'text-gray-400')} />
                  {label === 'Alerts' && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-brand-600 text-white text-[8px] flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9' : unreadCount}
                    </span>
                  )}
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
