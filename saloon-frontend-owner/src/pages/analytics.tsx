import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfMonth } from 'date-fns'
import { analyticsApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Skeleton } from '@/components/ui/index'
import { formatPrice } from '@/lib/utils'

type Range = '7d' | '30d' | 'mtd'
const ranges: { label: string; value: Range }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: 'This month', value: 'mtd' },
]

export function AnalyticsPage() {
  const { saloonId } = useAuthStore()
  const [range, setRange] = useState<Range>('30d')
  const today = format(new Date(), 'yyyy-MM-dd')
  const dateFrom = range === '7d' ? format(subDays(new Date(), 7), 'yyyy-MM-dd')
    : range === '30d' ? format(subDays(new Date(), 30), 'yyyy-MM-dd')
    : format(startOfMonth(new Date()), 'yyyy-MM-dd')

  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics', saloonId, dateFrom, today],
    queryFn: () => analyticsApi.summary(saloonId!, { date_from: dateFrom, date_to: today }),
    enabled: !!saloonId,
  })

  const statCards = [
    { label: 'Total bookings', value: summary?.total_bookings ?? 0 },
    { label: 'Completed', value: summary?.completed_bookings ?? 0 },
    { label: 'Cancelled', value: summary?.cancelled_bookings ?? 0 },
    { label: 'Revenue', value: summary ? formatPrice(summary.revenue) : '—' },
    { label: 'Avg. booking value', value: summary ? formatPrice(summary.avg_booking_value) : '—' },
  ]

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-1">
          {ranges.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium ${range === r.value ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            {isLoading ? <><Skeleton className="h-7 w-16 mb-1" /><Skeleton className="h-3 w-20" /></> : (
              <><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500 mt-0.5">{label}</p></>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="font-semibold text-gray-800 mb-4 text-sm">Booking summary</p>
        <p className="text-sm text-gray-400 text-center py-8">
          Detailed charts coming in Phase 2 — basic stats available above.
        </p>
      </div>
    </div>
  )
}
