import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bookingApi, auditApi, type AuditEntry } from '@/lib/api/endpoints'
import { type ColumnDef } from '@tanstack/react-table'
import { Button, StatusBadge, ConfirmModal, Modal, SelectInput, DangerZone, useToast, Skeleton, RoleBadge, JsonBlock } from '@/components/ui/index'
import { DataTable } from '@/components/ui/data-table'
import { formatPrice, shortId } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

const ALL_STATUSES = [
  { value: 'confirmed', label: 'Confirmed' }, { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'no_show', label: 'No-show' },
]

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [forceStatusOpen, setForceStatusOpen] = useState(false)
  const [forceStatus, setForceStatus] = useState('')
  const [diffEntry, setDiffEntry] = useState<AuditEntry | null>(null)

  const { data: booking, isLoading } = useQuery({ queryKey: ['booking', id], queryFn: () => bookingApi.get(id!), enabled: !!id })
  const { data: auditLog } = useQuery({ queryKey: ['booking-audit', id], queryFn: () => auditApi.list({ entity_id: id!, size: 20 }), enabled: !!id })

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancel(id!, 'Cancelled by admin'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['booking', id] }); setConfirmCancel(false); toast({ type: 'success', title: 'Booking cancelled' }) },
    onError: () => toast({ type: 'error', title: 'Failed to cancel' }),
  })

  const forceStatusMutation = useMutation({
    mutationFn: () => bookingApi.updateStatus(id!, forceStatus, 'Forced by admin'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['booking', id] }); setForceStatusOpen(false); toast({ type: 'success', title: 'Status updated' }) },
    onError: () => toast({ type: 'error', title: 'Failed to update status' }),
  })

  const auditColumns: ColumnDef<AuditEntry, unknown>[] = [
    { id: 'time', header: 'Time', cell: ({ row }) => <span className="text-xs font-mono">{format(new Date(row.original.created_at), 'd MMM HH:mm')}</span> },
    { id: 'actor', header: 'Actor', cell: ({ row }) => row.original.actor ? <><span className="text-xs mr-1">{row.original.actor.name}</span><RoleBadge role={row.original.actor.role} /></> : <span className="text-slate-400">System</span> },
    { accessorKey: 'action', header: 'Action', cell: ({ row }) => <code className="text-xs bg-slate-100 px-1 rounded">{row.original.action}</code> },
    { id: 'diff', header: '', enableSorting: false, cell: ({ row }) => (row.original.before || row.original.after) ? <button onClick={() => setDiffEntry(row.original)} className="text-xs text-blue-600 hover:underline">Diff</button> : null },
  ]

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-40 rounded-xl" /></div>
  if (!booking) return <p className="text-slate-500">Booking not found.</p>

  return (
    <div className="space-y-4 max-w-screen-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/bookings')} className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /></button>
        <h1 className="text-xl font-bold text-slate-900">Booking</h1>
        <code className="font-mono text-sm text-slate-500">{shortId(booking.id)}</code>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Details</p>
          {[
            { label: 'Date', value: format(new Date(booking.start_at), 'EEE d MMM yyyy, h:mm a') },
            { label: 'End', value: format(new Date(booking.end_at), 'h:mm a') },
            { label: 'Total', value: <span className="font-mono font-semibold">{formatPrice(booking.total_price)}</span> },
            { label: 'Saloon', value: booking.saloon ? <button onClick={() => navigate(`/saloons/${booking.saloon_id}`)} className="text-blue-600 hover:underline">{booking.saloon.name}</button> : '—' },
            { label: 'Barber', value: booking.barber ? <button onClick={() => navigate(`/barbers/${booking.barber_id}`)} className="text-blue-600 hover:underline">{booking.barber.user.name}</button> : '—' },
            { label: 'Customer', value: booking.customer ? <button onClick={() => navigate(`/customers/${booking.customer_id}`)} className="text-blue-600 hover:underline">{booking.customer.name}</button> : '—' },
            { label: 'Notes', value: booking.customer_notes ?? '—' },
            { label: 'ID', value: <code className="font-mono text-xs">{booking.id}</code> },
            { label: 'Created', value: format(new Date(booking.created_at), 'd MMM yyyy, HH:mm') },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-2 items-start">
              <span className="text-xs text-slate-400 w-20 flex-shrink-0 pt-0.5">{label}</span>
              <span className="text-sm text-slate-800">{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Services</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {booking.items.map(item => (
                <tr key={item.id}>
                  <td className="py-2 text-slate-800">{item.service_name_snapshot}</td>
                  <td className="py-2 text-right text-slate-500">{item.duration_snapshot} min</td>
                  <td className="py-2 text-right font-mono text-slate-700">{formatPrice(item.price_snapshot)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Audit history</p>
        <DataTable data={auditLog?.items ?? []} columns={auditColumns} storageKey="booking-detail-audit" />
      </div>

      <DangerZone>
        {booking.status !== 'cancelled' && <Button variant="destructive" size="sm" onClick={() => setConfirmCancel(true)}>Force cancel</Button>}
        <Button variant="outline" size="sm" onClick={() => { setForceStatus(booking.status); setForceStatusOpen(true) }}>Force status change</Button>
      </DangerZone>

      <ConfirmModal open={confirmCancel} onClose={() => setConfirmCancel(false)} onConfirm={() => cancelMutation.mutate()}
        title="Force cancel booking?" description="This will immediately cancel the booking. Both the customer and barber will be notified."
        confirmLabel="Cancel booking" loading={cancelMutation.isPending} destructive />

      <Modal open={forceStatusOpen} onClose={() => setForceStatusOpen(false)} title="Force status change" size="sm">
        <p className="text-sm text-slate-500 mb-4">This bypasses all business logic. The audit log will record the change as an admin action.</p>
        <div className="space-y-3">
          <SelectInput value={forceStatus} onValueChange={setForceStatus} options={ALL_STATUSES} label="New status" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setForceStatusOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" loading={forceStatusMutation.isPending} disabled={!forceStatus || forceStatus === booking.status} onClick={() => forceStatusMutation.mutate()}>Apply</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!diffEntry} onClose={() => setDiffEntry(null)} title="Change diff" size="lg">
        {diffEntry && (
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs font-medium text-slate-500 mb-1">Before</p><JsonBlock data={diffEntry.before} /></div>
            <div><p className="text-xs font-medium text-slate-500 mb-1">After</p><JsonBlock data={diffEntry.after} /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
