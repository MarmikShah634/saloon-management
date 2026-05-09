import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, User, Bell, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { authApi } from '@/lib/api/endpoints'

const menuItems = [
  { to: '/account/bookings', icon: CalendarDays, label: 'My bookings' },
  { to: '/account/profile', icon: User, label: 'Profile' },
  { to: '/account/notifications', icon: Bell, label: 'Notifications' },
]

export function AccountHomePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    navigate('/')
  }

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-6">
      {user && (
        <div className="mb-6">
          <p className="text-2xl font-bold text-gray-900">Hi, {user.name.split(' ')[0]}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {menuItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <Icon className="h-5 w-5 text-gray-500" />
            <span className="flex-1 font-medium text-gray-800">{label}</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-4 hover:bg-red-50 transition-colors w-full text-left"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span className="flex-1 font-medium text-red-600">Sign out</span>
        </button>
      </div>
    </div>
  )
}
