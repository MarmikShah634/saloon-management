import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bookingApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, StatusBadge, Skeleton, Modal, useToast } from '@/components/ui/index'
import { formatTime, formatPrice } from '@/lib/utils'
import type { Booking } from '@/lib/api/endpoints'
import { useState } from 'react'
import { Clock, User, Scissors, CheckCircle, AlertCircle, Play, CalendarCheck } from 'lucide-react'

function BookingCard({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showActions, setShowActions] = useState(false)

  const statusMutation = useMutation({
    mutationFn: (status: string) => bookingApi.updateStatus(booking.id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['today-bookings'] }); setShowActions(false) },
    onError: () => toast({ type: 'error', title: 'Status update failed' }),
  })

  const tz = booking.saloon?.timezone
  const isConfirmed = booking.status === 'confirmed'
  const isInProgress = booking.status === 'in_progress'
  const isDone = ['completed', 'cancelled', 'no_show'].includes(booking.status)

  return (
    <div className={`bg-white rounded-2xl border p-4 transition-all ${
      isInProgress
        ? 'border-brand-300 shadow-card ring-1 ring-brand-200'
        : isDone
          ? 'border-gray-100 opacity-75'
          : 'border-gray-100 shadow-card'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="font-bold text-lg text-gray-900">{formatTime(booking.start_at, tz)}</span>
            <span className="text-sm text-gray-400">→ {formatTime(booking.end_at, tz)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <User className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold text-sm text-gray-900">{booking.customer?.name ?? 'Customer'}</span>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Services */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {booking.items.map((item, i) => (
          <span key={i} className="text-xs bg-brand-50 text-brand-700 rounded-full px-2.5 py-0.5 font-medium border border-brand-100">
            {item.service_name_snapshot}
          </span>
        ))}
      </div>

      {booking.customer_notes && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3 italic">
          "{booking.customer_notes}"
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">{formatPrice(booking.total_price)}</span>
        <div className="flex gap-2">
          {isConfirmed && (
            <Button size="sm" onClick={() => statusMutation.mutate('in_progress')} loading={statusMutation.isPending}>
              <Play className="h-3.5 w-3.5" />
              Start
            </Button>
          )}
          {isInProgress && (
            <Button size="sm" onClick={() => statusMutation.mutate('completed')} loading={statusMutation.isPending}>
              <CheckCircle className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
          {(isConfirmed || isInProgress) && (
            <Button size="sm" variant="ghost" onClick={() => setShowActions(true)}>
              <AlertCircle className="h-3.5 w-3.5" />
              More
            </Button>
          )}
        </div>
      </div>

      <Modal open={showActions} onClose={() => setShowActions(false)} title="Update booking status">
        <div className="space-y-2 mt-4">
          <Button className="w-full justify-center" style={{ background: '#f59e0b', color: 'white' }}
            onClick={() => statusMutation.mutate('no_show')} loading={statusMutation.isPending}>
            Mark as no-show
          </Button>
          <Button variant="destructive" className="w-full justify-center"
            onClick={() => statusMutation.mutate('cancelled')} loading={statusMutation.isPending}>
            Cancel booking
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export function TodayPage() {
  const { barberId } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['today-bookings', barberId, today],
    queryFn: () => bookingApi.list({ barber_id: barberId!, date_from: today, date_to: today, size: 50 }),
    enabled: !!barberId,
    refetchInterval: 60_000,
  })

  const bookings = data?.items ?? []
  const active = bookings.filter(b => b.status === 'in_progress')
  const upcoming = bookings.filter(b => b.status === 'confirmed')
  const done = bookings.filter(b => ['completed', 'cancelled', 'no_show'].includes(b.status))
  const total = bookings.length
  const revenue = done.filter(b => b.status === 'completed').reduce((sum, b) => sum + parseFloat(b.total_price), 0)

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Today</h1>
          <p className="text-sm text-gray-400">{format(new Date(), 'EEEE, d MMMM')}</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center bg-white rounded-2xl border border-gray-100 px-4 py-2 shadow-card">
            <p className="text-2xl font-extrabold text-gray-900">{total}</p>
            <p className="text-[10px] text-gray-400 font-medium">bookings</p>
          </div>
          {revenue > 0 && (
            <div className="text-center bg-brand-50 rounded-2xl border border-brand-100 px-4 py-2">
              <p className="text-xl font-extrabold text-brand-700">₹{revenue.toFixed(0)}</p>
              <p className="text-[10px] text-brand-500 font-medium">earned</p>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500 mb-3">Couldn't load bookings</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="h-7 w-7 text-brand-500" />
          </div>
          <p className="font-bold text-gray-700">No bookings today</p>
          <p className="text-sm text-gray-400 mt-1">Enjoy the free time!</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-4">
          <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            In progress
          </p>
          <div className="space-y-3">{active.map(b => <BookingCard key={b.id} booking={b} />)}</div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Upcoming · {upcoming.length}</p>
          <div className="space-y-3">{upcoming.map(b => <BookingCard key={b.id} booking={b} />)}</div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Done · {done.length}</p>
          <div className="space-y-3">{done.map(b => <BookingCard key={b.id} booking={b} />)}</div>
        </section>
      )}
    </div>
  )
}
