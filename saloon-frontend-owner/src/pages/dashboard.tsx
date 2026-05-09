import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '@/lib/stores/auth.store'
import { analyticsApi, bookingApi } from '@/lib/api/endpoints'
import { Skeleton, StatusBadge } from '@/components/ui/index'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { TrendingUp, CalendarCheck, XCircle, DollarSign } from 'lucide-react'

export function DashboardPage() {
  const { saloonId } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary', saloonId, thirtyDaysAgo, today],
    queryFn: () => analyticsApi.summary(saloonId!, { date_from: thirtyDaysAgo, date_to: today }),
    enabled: !!saloonId,
  })

  const { data: recentBookings } = useQuery({
    queryKey: ['bookings', saloonId, 'recent'],
    queryFn: () => bookingApi.list({ saloon_id: saloonId!, page: 1, size: 5 }),
    enabled: !!saloonId,
  })

  const stats = [
    { label: 'Total bookings', value: summary?.total_bookings ?? 0, icon: CalendarCheck, color: 'text-blue-600' },
    { label: 'Completed', value: summary?.completed_bookings ?? 0, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Cancelled', value: summary?.cancelled_bookings ?? 0, icon: XCircle, color: 'text-red-500' },
    { label: 'Revenue (30d)', value: summary ? formatPrice(summary.revenue) : '—', icon: DollarSign, color: 'text-brand-600' },
  ]

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Last 30 days overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            {summaryLoading ? (
              <><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-24" /></>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Recent bookings</h2>
        {!recentBookings ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : recentBookings.items.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No bookings yet</p>
        ) : (
          <div className="space-y-2">
            {recentBookings.items.map(b => (
              <div key={b.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{b.customer?.name ?? 'Customer'}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(b.start_at)}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">{formatPrice(b.total_price)}</p>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
