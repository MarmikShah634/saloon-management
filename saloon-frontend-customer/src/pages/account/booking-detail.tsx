import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Calendar, Download } from 'lucide-react'
import { format, parseISO, differenceInHours } from 'date-fns'
import { bookingApi } from '@/lib/api/endpoints'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatPrice } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api/client'

function generateICS(booking: { start_at: string; end_at: string; saloon?: { name?: string; address?: string } | null }) {
  const start = format(parseISO(booking.start_at), "yyyyMMdd'T'HHmmss'Z'")
  const end = format(parseISO(booking.end_at), "yyyyMMdd'T'HHmmss'Z'")
  const name = booking.saloon?.name ?? 'Saloon appointment'
  const location = booking.saloon?.address ?? ''
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${name}`,
    `LOCATION:${location}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'booking.ics'
  a.click()
  URL.revokeObjectURL(url)
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showCancel, setShowCancel] = useState(false)
  const justBooked = searchParams.get('just_booked') === 'true'
  const [showBanner, setShowBanner] = useState(justBooked)

  useEffect(() => {
    if (justBooked) {
      const t = setTimeout(() => setShowBanner(false), 8000)
      return () => clearTimeout(t)
    }
  }, [justBooked])

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.get(id!),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => bookingApi.cancel(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings-me'] })
      setShowCancel(false)
      toast({ type: 'success', title: 'Booking cancelled' })
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Cancellation failed'
      toast({ type: 'error', title: msg })
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-screen-sm mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Booking not found</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate('/account/bookings')}>
          My bookings
        </Button>
      </div>
    )
  }

  const canCancel =
    booking.status === 'confirmed' &&
    differenceInHours(parseISO(booking.start_at), new Date()) >= 2

  const totalPrice = parseFloat(booking.total_price)
  const depositAmount = parseFloat(booking.deposit_amount)

  return (
    <div className="max-w-screen-sm mx-auto pb-12">
      {/* Success banner */}
      {showBanner && (
        <div className="bg-emerald-500 text-white px-4 py-3 text-sm font-medium text-center animate-fade-in">
          You're booked! We've sent the details to your email.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <p className="font-semibold text-gray-900">{booking.saloon?.name ?? 'Booking'}</p>
          <StatusBadge status={booking.status} />
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Date & time */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">
                {format(parseISO(booking.start_at), 'EEEE, d MMMM yyyy')}
              </p>
              <p className="text-sm text-gray-600">
                {format(parseISO(booking.start_at), 'h:mm a')} – {format(parseISO(booking.end_at), 'h:mm a')}
              </p>
            </div>
            <button
              onClick={() => generateICS(booking)}
              className="ml-auto p-2 rounded-lg hover:bg-gray-50"
              aria-label="Add to calendar"
            >
              <Download className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Address */}
        {booking.saloon?.address && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{booking.saloon.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{booking.saloon.address}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(booking.saloon.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 mt-1 inline-block"
                >
                  Get directions
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Services & prices */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Services</h3>
          <div className="space-y-2">
            {booking.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.service_name_snapshot}</span>
                <span className="text-gray-900 font-medium">{formatPrice(item.price_snapshot)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Deposit</span>
              <span>{formatPrice(depositAmount)} (coming soon)</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {booking.customer_notes && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your note</p>
            <p className="text-sm text-gray-700">{booking.customer_notes}</p>
          </div>
        )}

        {/* Cancel action */}
        {canCancel ? (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowCancel(true)}
          >
            Cancel booking
          </Button>
        ) : booking.status === 'confirmed' ? (
          <p className="text-xs text-gray-400 text-center">Cancellation window has passed.</p>
        ) : null}
      </div>

      {/* Cancel confirmation modal */}
      <Modal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel booking?"
        description="This cannot be undone. Are you sure you want to cancel?"
      >
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setShowCancel(false)}>
            Keep it
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            loading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate('Customer requested cancellation')}
          >
            Yes, cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}
