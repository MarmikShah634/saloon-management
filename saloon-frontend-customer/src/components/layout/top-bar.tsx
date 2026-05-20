import { Link, useNavigate } from 'react-router-dom'
import { Bell, User, Scissors } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '@/lib/api/endpoints'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function TopBar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.list({ unread_only: true, size: 1 }),
    enabled: !!user,
    refetchInterval: 60_000,
  })

  const unreadCount = notifications?.total ?? 0

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-brand-100/50">
      <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow">
            <Scissors className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">Saloon<span className="text-brand-600">.</span></span>
        </Link>

        {/* Desktop search */}
        <div className="hidden lg:block flex-1 mx-8 max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
              if (q.trim()) navigate(`/saloons?q=${encodeURIComponent(q.trim())}`)
            }}
          >
            <input
              name="q"
              type="search"
              placeholder="Search saloons, cities..."
              className="w-full h-9 rounded-xl border border-brand-100 bg-brand-50/60 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition-colors placeholder:text-gray-400"
            />
          </form>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              <Link
                to="/account/notifications"
                className="relative p-2 rounded-xl hover:bg-brand-50 text-gray-500 hover:text-brand-600 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-brand-600 text-white text-[9px] flex items-center justify-center font-bold shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="hidden lg:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-brand-50 transition-colors" aria-label="Account menu">
                    <div className="h-7 w-7 rounded-lg bg-brand-gradient flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[200px] rounded-2xl border border-brand-100/60 bg-white shadow-card-hover p-1.5 animate-slide-up"
                    sideOffset={8}
                    align="end"
                  >
                    <div className="px-3 py-2 mb-1 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    {[
                      { label: 'My Bookings', to: '/account/bookings' },
                      { label: 'Profile', to: '/account/profile' },
                      { label: 'Notifications', to: '/account/notifications' },
                    ].map(({ label, to }) => (
                      <DropdownMenu.Item key={to} asChild>
                        <Link
                          to={to}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 cursor-pointer outline-none transition-colors"
                        >
                          {label}
                        </Link>
                      </DropdownMenu.Item>
                    ))}
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
                    <DropdownMenu.Item
                      className="flex items-center px-3 py-2 text-sm text-red-600 rounded-xl hover:bg-red-50 cursor-pointer outline-none transition-colors"
                      onClick={handleLogout}
                    >
                      Sign out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-brand-700 px-3 py-1.5 rounded-xl hover:bg-brand-50 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                className="hidden lg:flex text-sm font-medium bg-brand-gradient text-white px-4 py-1.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
