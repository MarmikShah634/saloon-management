import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import { bookingApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Skeleton, StatusBadge, Modal, useToast } from '@/components/ui/index'
import { formatPrice, formatDateTime } from '@/lib/utils'
import type { Booking } from '@/lib/api/endpoints'

export function BookingsPage() {
  const { saloonId } = useAuthStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['bookings-owner', saloonId, statusFilter, page],
    queryFn: () => bookingApi.list({ saloon_id: saloonId!, status: statusFilter || undefined, page, size: 20 }),
    enabled: !!saloonId,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingApi.cancel(id, 'Cancelled by owner'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bookings-owner'] }); setCancelTarget(null); toast({ type: 'success', title: 'Booking cancelled' }) },
  })

  const statuses = ['', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']
  const statusLabels: Record<string, string> = { '': 'All', confirmed: 'Confirmed', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' }

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Bookings</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {data?.items.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-12">No bookings found</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">{['Date & time', 'Customer', 'Barber', 'Services', 'Amount', 'Status', ''].map(h => <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">{h}</th>)}</tr></thead>
                <tbody>
                  {data?.items.map(b => (
                    <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3"><p className="font-medium text-gray-900">{format(new Date(b.start_at), 'EEE, d MMM')}</p><p className="text-xs text-gray-500">{format(new Date(b.start_at), 'h:mm a')}</p></td>
                      <td className="px-4 py-3 text-gray-700">{b.customer?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{b.barber?.user.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{b.items.map(i => i.service_name_snapshot).join(', ')}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(b.total_price)}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3">
                        {b.status === 'confirmed' && (
                          <button onClick={() => setCancelTarget(b)} className="text-xs text-red-600 hover:underline">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {data && data.total > 20 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">{data.total} total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!data.has_next}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel booking?">
        <p className="text-sm text-gray-500 mb-4">Are you sure you want to cancel this booking for {cancelTarget?.customer?.name}?</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setCancelTarget(null)}>Keep it</Button>
          <Button variant="destructive" className="flex-1" loading={cancelMutation.isPending} onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}>Cancel booking</Button>
        </div>
      </Modal>
    </div>
  )
}
