import { Link, useNavigate } from 'react-router-dom'
import { Bell, User } from 'lucide-react'
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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="text-lg font-bold text-gray-900 tracking-tight">
          Saloon<span className="text-brand-600">.</span>
        </Link>

        {/* Desktop center search */}
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
              placeholder="Search saloons..."
              className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </form>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/account/notifications"
                className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700"
                    aria-label="Account menu"
                  >
                    <User className="h-4 w-4" />
                    {user.name.split(' ')[0]}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[180px] rounded-xl border border-gray-100 bg-white shadow-lg p-1 animate-slide-up"
                    sideOffset={8}
                    align="end"
                  >
                    {[
                      { label: 'My Bookings', to: '/account/bookings' },
                      { label: 'Profile', to: '/account/profile' },
                      { label: 'Notifications', to: '/account/notifications' },
                    ].map(({ label, to }) => (
                      <DropdownMenu.Item key={to} asChild>
                        <Link
                          to={to}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer outline-none focus:bg-gray-50"
                        >
                          {label}
                        </Link>
                      </DropdownMenu.Item>
                    ))}
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
                    <DropdownMenu.Item
                      className="flex items-center px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 cursor-pointer outline-none"
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
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                className="hidden lg:flex text-sm font-medium bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
