import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { saloonApi, bookingApi, auditApi, type Booking, type Service, type Barber, type AuditEntry } from '@/lib/api/endpoints'
import {
  Button, StatusBadge, ConfirmModal, Modal, Input, DangerZone, useToast,
  TabsRoot, TabsList, TabsTrigger, TabsContent, Skeleton, RoleBadge, JsonBlock,
} from '@/components/ui/index'
import { DataTable } from '@/components/ui/data-table'
import { formatPrice, shortId } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export function SaloonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [confirmAction, setConfirmAction] = useState<{ action: 'suspend' | 'reactivate' | 'approve' } | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferOwnerId, setTransferOwnerId] = useState('')
  const [diffEntry, setDiffEntry] = useState<AuditEntry | null>(null)

  const { data: saloon, isLoading } = useQuery({
    queryKey: ['saloon', id],
    queryFn: () => saloonApi.get(id!),
    enabled: !!id,
  })

  const { data: services } = useQuery({
    queryKey: ['saloon-services', id],
    queryFn: () => saloonApi.services(id!),
    enabled: !!id,
  })

  const { data: barbers } = useQuery({
    queryKey: ['saloon-barbers', id],
    queryFn: () => saloonApi.barbers(id!),
    enabled: !!id,
  })

  const { data: bookings } = useQuery({
    queryKey: ['saloon-bookings', id],
    queryFn: () => bookingApi.list({ saloon_id: id!, size: 20 }),
    enabled: !!id,
  })

  const { data: auditLog } = useQuery({
    queryKey: ['saloon-audit', id],
    queryFn: () => auditApi.list({ entity_id: id!, size: 30 }),
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => saloonApi.updateStatus(id!, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['saloon', id] }); setConfirmAction(null); toast({ type: 'success', title: 'Status updated' }) },
    onError: () => toast({ type: 'error', title: 'Failed to update status' }),
  })

  const transferMutation = useMutation({
    mutationFn: () => saloonApi.transferOwner(id!, transferOwnerId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['saloon', id] }); setTransferOpen(false); toast({ type: 'success', title: 'Ownership transferred' }) },
    onError: () => toast({ type: 'error', title: 'Failed to transfer ownership' }),
  })

  const serviceColumns: ColumnDef<Service, unknown>[] = [
    { accessorKey: 'name', header: 'Service' },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => row.original.category ?? '—' },
    { accessorKey: 'duration_mins', header: 'Duration', cell: ({ row }) => `${row.original.duration_mins} min` },
    { accessorKey: 'price', header: 'Price', cell: ({ row }) => formatPrice(row.original.price) },
    { accessorKey: 'is_active', header: 'Active', cell: ({ row }) => row.original.is_active ? '✓' : '—' },
  ]

  const barberColumns: ColumnDef<Barber, unknown>[] = [
    { id: 'name', header: 'Name', cell: ({ row }) => <button onClick={() => navigate(`/barbers/${row.original.id}`)} className="font-medium text-slate-900 hover:underline">{row.original.user.name}</button> },
    { id: 'email', header: 'Email', cell: ({ row }) => row.original.user.email },
    { id: 'active', header: 'Active', cell: ({ row }) => row.original.is_active ? '✓' : '—' },
    { id: 'services', header: 'Services', cell: ({ row }) => row.original.barber_services.length },
  ]

  const bookingColumns: ColumnDef<Booking, unknown>[] = [
    { id: 'id', header: 'ID', cell: ({ row }) => <button onClick={() => navigate(`/bookings/${row.original.id}`)} className="font-mono text-xs text-blue-600 hover:underline">{shortId(row.original.id)}</button> },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer?.name ?? '—' },
    { id: 'barber', header: 'Barber', cell: ({ row }) => row.original.barber?.user.name ?? '—' },
    { id: 'date', header: 'Date', cell: ({ row }) => format(new Date(row.original.start_at), 'd MMM yy, h:mm a') },
    { accessorKey: 'total_price', header: 'Total', cell: ({ row }) => formatPrice(row.original.total_price) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ]

  const auditColumns: ColumnDef<AuditEntry, unknown>[] = [
    { id: 'time', header: 'Time', cell: ({ row }) => <span className="text-xs font-mono">{format(new Date(row.original.created_at), 'd MMM HH:mm')}</span> },
    { id: 'actor', header: 'Actor', cell: ({ row }) => row.original.actor ? <><span className="text-xs">{row.original.actor.name}</span> <RoleBadge role={row.original.actor.role} /></> : <span className="text-slate-400">System</span> },
    { accessorKey: 'action', header: 'Action', cell: ({ row }) => <code className="text-xs bg-slate-100 px-1 rounded">{row.original.action}</code> },
    { id: 'diff', header: '', enableSorting: false, cell: ({ row }) => (row.original.before || row.original.after) ? <button onClick={() => setDiffEntry(row.original)} className="text-xs text-blue-600 hover:underline">Diff</button> : null },
  ]

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-40 rounded-xl" /></div>
  if (!saloon) return <p className="text-slate-500">Saloon not found.</p>

  const actionMap: Record<string, string> = { suspend: 'suspended', reactivate: 'active', approve: 'active' }

  return (
    <div className="space-y-4 max-w-screen-xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/saloons')} className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /></button>
        <h1 className="text-xl font-bold text-slate-900 flex-1">{saloon.name}</h1>
        <StatusBadge status={saloon.status} />
        <span className="font-mono text-xs text-slate-400">{shortId(saloon.id)}</span>
      </div>

      <TabsRoot defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="barbers">Barbers</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Identity</p>
              {[
                { label: 'Name', value: saloon.name },
                { label: 'Slug', value: saloon.slug },
                { label: 'Address', value: saloon.address },
                { label: 'City', value: saloon.city },
                { label: 'Timezone', value: saloon.timezone },
                { label: 'Phone', value: saloon.phone ?? '—' },
                { label: 'ID', value: <code className="font-mono text-xs">{saloon.id}</code> },
                { label: 'Created', value: format(new Date(saloon.created_at), 'd MMM yyyy, HH:mm') },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-xs text-slate-400 w-20 flex-shrink-0">{label}</span>
                  <span className="text-sm text-slate-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Owner</p>
              {saloon.owner ? (
                <div className="space-y-2">
                  <div className="flex gap-2"><span className="text-xs text-slate-400 w-16">Name</span><button onClick={() => navigate(`/owners/${saloon.owner_id}`)} className="text-sm font-medium text-blue-600 hover:underline">{saloon.owner.name}</button></div>
                  <div className="flex gap-2"><span className="text-xs text-slate-400 w-16">Email</span><span className="text-sm">{saloon.owner.email}</span></div>
                  <div className="flex gap-2"><span className="text-xs text-slate-400 w-16">ID</span><code className="text-xs font-mono text-slate-500">{shortId(saloon.owner_id)}</code></div>
                </div>
              ) : <p className="text-sm text-slate-400">No owner assigned</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <DataTable data={services?.items ?? []} columns={serviceColumns} storageKey="saloon-detail-services" />
        </TabsContent>

        <TabsContent value="barbers">
          <DataTable data={barbers?.items ?? []} columns={barberColumns} storageKey="saloon-detail-barbers" />
        </TabsContent>

        <TabsContent value="bookings">
          <DataTable data={bookings?.items ?? []} columns={bookingColumns} storageKey="saloon-detail-bookings" />
        </TabsContent>

        <TabsContent value="audit">
          <DataTable data={auditLog?.items ?? []} columns={auditColumns} storageKey="saloon-detail-audit" />
        </TabsContent>

        <TabsContent value="danger">
          <DangerZone>
            {saloon.status === 'pending_approval' && <Button size="sm" onClick={() => setConfirmAction({ action: 'approve' })}>Approve saloon</Button>}
            {saloon.status === 'active' && <Button variant="destructive" size="sm" onClick={() => setConfirmAction({ action: 'suspend' })}>Suspend saloon</Button>}
            {(saloon.status === 'suspended' || saloon.status === 'inactive') && <Button size="sm" onClick={() => setConfirmAction({ action: 'reactivate' })}>Reactivate saloon</Button>}
            <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>Transfer ownership</Button>
          </DangerZone>
        </TabsContent>
      </TabsRoot>

      {/* Confirm status */}
      <ConfirmModal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && statusMutation.mutate(actionMap[confirmAction.action])}
        title={`${confirmAction?.action?.charAt(0).toUpperCase()}${confirmAction?.action?.slice(1)} "${saloon.name}"?`}
        description={`This will change the saloon status to ${confirmAction ? actionMap[confirmAction.action] : ''}. The owner will be notified.`}
        confirmLabel={confirmAction?.action}
        loading={statusMutation.isPending}
        destructive={confirmAction?.action === 'suspend'}
      />

      {/* Transfer ownership */}
      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer ownership">
        <p className="text-sm text-slate-500 mb-4">Enter the new owner's user ID. They must already exist in the system as an owner.</p>
        <div className="space-y-3">
          <Input label="New owner ID" value={transferOwnerId} onChange={e => setTransferOwnerId(e.target.value)} placeholder="uuid…" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button size="sm" loading={transferMutation.isPending} disabled={!transferOwnerId} onClick={() => transferMutation.mutate()}>Transfer</Button>
          </div>
        </div>
      </Modal>

      {/* Audit diff */}
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
