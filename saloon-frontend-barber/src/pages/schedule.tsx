import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, addDays, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { bookingApi, type Booking } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { StatusBadge, Skeleton } from '@/components/ui/index'
import { formatTime } from '@/lib/utils'

export function SchedulePage() {
  const { barberId } = useAuthStore()
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const dateFrom = format(weekStart, 'yyyy-MM-dd')
  const dateTo = format(addDays(weekStart, 6), 'yyyy-MM-dd')

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', barberId, dateFrom, dateTo],
    queryFn: () => bookingApi.list({ barber_id: barberId!, date_from: dateFrom, date_to: dateTo, size: 100 }),
    enabled: !!barberId,
  })

  const bookingsByDate = (data?.items ?? []).reduce((acc, b) => {
    const d = b.date
    if (!acc[d]) acc[d] = []
    acc[d].push(b)
    return acc
  }, {} as Record<string, Booking[]>)

  const dayBookings = bookingsByDate[selectedDate] ?? []

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-4">
      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Previous week">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-medium text-gray-700">
          {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}
        </p>
        <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Next week">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Date strip */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {weekDates.map(d => {
          const iso = format(d, 'yyyy-MM-dd')
          const count = bookingsByDate[iso]?.length ?? 0
          const isSelected = iso === selectedDate
          return (
            <button key={iso} onClick={() => setSelectedDate(iso)}
              className={`flex-shrink-0 flex flex-col items-center w-12 py-2 rounded-xl text-xs font-medium transition-colors ${
                isSelected ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
              }`}>
              <span className="text-[10px] uppercase">{format(d, 'EEE')}</span>
              <span className="text-base font-semibold">{format(d, 'd')}</span>
              {count > 0 && <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-600'}`} />}
            </button>
          )
        })}
      </div>

      {/* Day bookings */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : dayBookings.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-12">No bookings on this day</p>
      ) : (
        <div className="space-y-3">
          {dayBookings.sort((a, b) => a.start_at.localeCompare(b.start_at)).map(booking => (
            <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900">{formatTime(booking.start_at, booking.saloon?.timezone)}</span>
                  <span className="text-gray-400 mx-1">–</span>
                  <span className="text-gray-600 text-sm">{formatTime(booking.end_at, booking.saloon?.timezone)}</span>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <p className="text-sm text-gray-700 mt-1">{booking.customer?.name ?? 'Customer'}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {booking.items.map(item => (
                  <span key={item.id} className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                    {item.service_name_snapshot}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
