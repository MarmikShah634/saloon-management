import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuthStore } from '@/lib/stores/auth.store'
import { analyticsApi, bookingApi } from '@/lib/api/endpoints'
import { Skeleton, StatusBadge } from '@/components/ui/index'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { TrendingUp, CalendarCheck, XCircle, DollarSign, ArrowUpRight } from 'lucide-react'

const statConfig = [
  {
    key: 'total_bookings',
    label: 'Total bookings',
    icon: CalendarCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    key: 'completed_bookings',
    label: 'Completed',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    key: 'cancelled_bookings',
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    gradient: 'from-red-400 to-red-500',
  },
  {
    key: 'revenue',
    label: 'Revenue (30d)',
    icon: DollarSign,
    color: 'text-brand-600',
    bg: 'bg-brand-50',
    border: 'border-brand-100',
    gradient: 'from-brand-500 to-brand-600',
    format: (v: string | number) => formatPrice(String(v)),
  },
]

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

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Last 30 days • {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statConfig.map(({ key, label, icon: Icon, color, bg, border, gradient, format: fmt }) => {
          const raw = summary?.[key as keyof typeof summary]
          const value = fmt ? fmt(raw ?? 0) : (raw ?? 0)

          return (
            <div key={key} className={`bg-white rounded-2xl border ${border} p-4 card-glow hover:shadow-card-hover transition-shadow`}>
              {summaryLoading ? (
                <>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center`}>
                      <Icon className={`h-4.5 w-4.5 ${color}`} style={{ height: '1.125rem', width: '1.125rem' }} />
                    </div>
                    <div className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${gradient} opacity-60`} />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Chart placeholder — replace with real daily data when available */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 card-glow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Booking trend</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">Last 7 days</span>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={[
                  { day: 'Mon', bookings: 4 }, { day: 'Tue', bookings: 7 },
                  { day: 'Wed', bookings: 5 }, { day: 'Thu', bookings: 9 },
                  { day: 'Fri', bookings: 12 }, { day: 'Sat', bookings: 14 },
                  { day: 'Sun', bookings: 6 },
                ]}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }}
                  cursor={{ fill: 'rgba(37,99,235,0.05)' }}
                />
                <Bar dataKey="bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 card-glow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent bookings</h2>
            <button className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:text-brand-700">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          {!recentBookings ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : recentBookings.items.length === 0 ? (
            <div className="text-center py-8">
              <CalendarCheck className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentBookings.items.map(b => (
                <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.customer?.name ?? 'Customer'}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(b.start_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(b.total_price)}</p>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
