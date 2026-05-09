import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bookingApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, StatusBadge, Skeleton, Modal, useToast } from '@/components/ui/index'
import { formatTime, formatPrice } from '@/lib/utils'
import type { Booking } from '@/lib/api/endpoints'
import { useState } from 'react'
import { Clock, User, Scissors } from 'lucide-react'

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

  return (
    <div className={`bg-white rounded-2xl border p-4 ${isInProgress ? 'border-brand-300 ring-1 ring-brand-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="font-bold text-lg text-gray-900">{formatTime(booking.start_at, tz)}</span>
            <span className="text-sm text-gray-500">→ {formatTime(booking.end_at, tz)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <User className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-medium text-sm text-gray-900">{booking.customer?.name ?? 'Customer'}</span>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {booking.items.map(item => (
          <span key={item.id} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
            {item.service_name_snapshot}
          </span>
        ))}
      </div>

      {booking.customer_notes && (
        <p className="text-xs text-gray-500 bg-yellow-50 rounded-lg px-3 py-2 mb-3 italic">
          "{booking.customer_notes}"
        </p>
      )}

      <div className="flex gap-2">
        {isConfirmed && (
          <Button size="sm" onClick={() => statusMutation.mutate('in_progress')} loading={statusMutation.isPending}>
            Start
          </Button>
        )}
        {isInProgress && (
          <Button size="sm" onClick={() => statusMutation.mutate('completed')} loading={statusMutation.isPending}>
            Complete
          </Button>
        )}
        {isConfirmed && (
          <Button size="sm" variant="ghost" onClick={() => setShowActions(true)}>
            No-show / Cancel
          </Button>
        )}
      </div>

      <Modal open={showActions} onClose={() => setShowActions(false)} title="Update booking">
        <div className="space-y-2 mt-4">
          <Button variant="warning" className="w-full" onClick={() => statusMutation.mutate('no_show')}>
            Mark as no-show
          </Button>
          <Button variant="destructive" className="w-full" onClick={() => statusMutation.mutate('cancelled')}>
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

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Today</h1>
          <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, d MMMM')}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
          <p className="text-xs text-gray-500">bookings</p>
        </div>
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>}
      {isError && <div className="text-center py-8"><p className="text-gray-500 mb-2">Couldn't load bookings</p><Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button></div>}

      {!isLoading && bookings.length === 0 && (
        <div className="text-center py-16">
          <Scissors className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="font-medium text-gray-700">No bookings today</p>
          <p className="text-sm text-gray-400 mt-1">Enjoy the free time!</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-4">
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-2">In progress</p>
          <div className="space-y-3">{active.map(b => <BookingCard key={b.id} booking={b} />)}</div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Upcoming ({upcoming.length})</p>
          <div className="space-y-3">{upcoming.map(b => <BookingCard key={b.id} booking={b} />)}</div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Done ({done.length})</p>
          <div className="space-y-3">{done.map(b => <BookingCard key={b.id} booking={b} />)}</div>
        </section>
      )}
    </div>
  )
}
