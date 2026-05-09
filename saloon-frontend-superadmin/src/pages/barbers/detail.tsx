import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { barberApi, bookingApi, type Booking } from '@/lib/api/endpoints'
import { DataTable } from '@/components/ui/data-table'
import { Button, StatusBadge, ConfirmModal, DangerZone, useToast, Skeleton } from '@/components/ui/index'
import { formatPrice, shortId } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export function BarberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [confirmToggle, setConfirmToggle] = useState(false)

  const { data: barber, isLoading } = useQuery({
    queryKey: ['barber', id],
    queryFn: () => barberApi.get(id!),
    enabled: !!id,
  })

  const { data: bookings } = useQuery({
    queryKey: ['barber-bookings', id],
    queryFn: () => bookingApi.list({ barber_id: id!, size: 20 }),
    enabled: !!id,
  })

  const toggleMutation = useMutation({
    mutationFn: () => barberApi.update(id!, { is_active: !barber?.is_active }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['barber', id] }); setConfirmToggle(false); toast({ type: 'success', title: 'Barber updated' }) },
    onError: () => toast({ type: 'error', title: 'Failed to update barber' }),
  })

  const bookingColumns: ColumnDef<Booking, unknown>[] = [
    { id: 'id', header: 'ID', cell: ({ row }) => <button onClick={() => navigate(`/bookings/${row.original.id}`)} className="font-mono text-xs text-blue-600 hover:underline">{shortId(row.original.id)}</button> },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer?.name ?? '—' },
    { id: 'date', header: 'Date', cell: ({ row }) => format(new Date(row.original.start_at), 'd MMM yy, h:mm a') },
    { accessorKey: 'total_price', header: 'Total', cell: ({ row }) => formatPrice(row.original.total_price) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ]

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-40 rounded-xl" /></div>
  if (!barber) return <p className="text-slate-500">Barber not found.</p>

  return (
    <div className="space-y-4 max-w-screen-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/barbers')} className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /></button>
        <h1 className="text-xl font-bold text-slate-900">{barber.user.name}</h1>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${barber.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{barber.is_active ? 'Active' : 'Inactive'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Profile</p>
          {[
            { label: 'Name', value: barber.user.name },
            { label: 'Email', value: barber.user.email },
            { label: 'Phone', value: barber.user.phone ?? '—' },
            { label: 'Saloon', value: barber.saloon ? <button onClick={() => navigate(`/saloons/${barber.saloon!.id}`)} className="text-blue-600 hover:underline">{barber.saloon.name}</button> : '—' },
            { label: 'Buffer', value: `${barber.buffer_mins} min` },
            { label: 'Services', value: barber.barber_services.length },
            { label: 'ID', value: <code className="font-mono text-xs">{shortId(barber.id)}</code> },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-2 items-center">
              <span className="text-xs text-slate-400 w-16 flex-shrink-0">{label}</span>
              <span className="text-sm text-slate-800">{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bio</p>
          <p className="text-sm text-slate-600">{barber.bio ?? 'No bio provided.'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent bookings</p>
        <DataTable data={bookings?.items ?? []} columns={bookingColumns} storageKey="barber-detail-bookings" />
      </div>

      <DangerZone>
        <Button variant={barber.is_active ? 'destructive' : 'secondary'} size="sm" onClick={() => setConfirmToggle(true)}>
          {barber.is_active ? 'Suspend barber' : 'Reactivate barber'}
        </Button>
      </DangerZone>

      <ConfirmModal
        open={confirmToggle}
        onClose={() => setConfirmToggle(false)}
        onConfirm={() => toggleMutation.mutate()}
        title={barber.is_active ? 'Suspend barber?' : 'Reactivate barber?'}
        description={barber.is_active ? `${barber.user.name} will no longer appear in booking flows.` : `${barber.user.name} will be available for new bookings.`}
        confirmLabel={barber.is_active ? 'Suspend' : 'Reactivate'}
        loading={toggleMutation.isPending}
        destructive={barber.is_active}
      />
    </div>
  )
}
