import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { userApi, saloonApi, auditApi, type Saloon, type AuditEntry } from '@/lib/api/endpoints'
import { type ColumnDef } from '@tanstack/react-table'
import { Button, StatusBadge, ConfirmModal, DangerZone, useToast, Skeleton, RoleBadge } from '@/components/ui/index'
import { DataTable } from '@/components/ui/data-table'
import { shortId } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export function OwnerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [confirmSuspend, setConfirmSuspend] = useState(false)
  const [confirmReactivate, setConfirmReactivate] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.get(id!),
    enabled: !!id,
  })

  const { data: saloons } = useQuery({
    queryKey: ['owner-saloons', id],
    queryFn: () => saloonApi.list({ q: id, size: 10 }),
    enabled: !!id,
  })

  const { data: auditLog } = useQuery({
    queryKey: ['owner-audit', id],
    queryFn: () => auditApi.list({ actor_id: id!, size: 20 }),
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => userApi.updateStatus(id!, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['user', id] }); setConfirmSuspend(false); setConfirmReactivate(false); toast({ type: 'success', title: 'Status updated' }) },
    onError: () => toast({ type: 'error', title: 'Failed to update status' }),
  })

  const resetMutation = useMutation({
    mutationFn: () => userApi.resetPassword(id!),
    onSuccess: () => toast({ type: 'success', title: 'Password reset email sent' }),
    onError: () => toast({ type: 'error', title: 'Failed to send reset email' }),
  })

  const resendMutation = useMutation({
    mutationFn: () => userApi.resendInvite(id!),
    onSuccess: () => toast({ type: 'success', title: 'Invite resent' }),
    onError: () => toast({ type: 'error', title: 'Failed to resend invite' }),
  })

  const saloonColumns: ColumnDef<Saloon, unknown>[] = [
    { accessorKey: 'name', header: 'Saloon', cell: ({ row }) => <button onClick={() => navigate(`/saloons/${row.original.id}`)} className="font-medium text-blue-600 hover:underline">{row.original.name}</button> },
    { accessorKey: 'city', header: 'City' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: 'id', header: 'ID', cell: ({ row }) => <code className="font-mono text-xs text-slate-400">{shortId(row.original.id)}</code> },
  ]

  const auditColumns: ColumnDef<AuditEntry, unknown>[] = [
    { id: 'time', header: 'Time', cell: ({ row }) => <span className="text-xs font-mono">{format(new Date(row.original.created_at), 'd MMM HH:mm')}</span> },
    { accessorKey: 'action', header: 'Action', cell: ({ row }) => <code className="text-xs bg-slate-100 px-1 rounded">{row.original.action}</code> },
    { accessorKey: 'entity_type', header: 'Entity' },
    { id: 'entity_id', header: 'Entity ID', cell: ({ row }) => row.original.entity_id ? <code className="text-xs font-mono text-slate-400">{shortId(row.original.entity_id)}</code> : '—' },
  ]

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-40 rounded-xl" /></div>
  if (!user) return <p className="text-slate-500">User not found.</p>

  return (
    <div className="space-y-4 max-w-screen-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/owners')} className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /></button>
        <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
        <StatusBadge status={user.status} />
        <RoleBadge role={user.role} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Profile</p>
          {[
            { label: 'Name', value: user.name },
            { label: 'Email', value: user.email },
            { label: 'Phone', value: user.phone ?? '—' },
            { label: 'Status', value: <StatusBadge status={user.status} /> },
            { label: 'Role', value: <RoleBadge role={user.role} /> },
            { label: 'ID', value: <code className="font-mono text-xs">{user.id}</code> },
            { label: 'Joined', value: format(new Date(user.created_at), 'd MMM yyyy') },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-2 items-center">
              <span className="text-xs text-slate-400 w-16 flex-shrink-0">{label}</span>
              <span className="text-sm text-slate-800">{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Saloons</p>
          <DataTable data={saloons?.items ?? []} columns={saloonColumns} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent activity</p>
        <DataTable data={auditLog?.items ?? []} columns={auditColumns} storageKey="owner-detail-audit" />
      </div>

      <DangerZone>
        {user.status === 'active' && <Button variant="destructive" size="sm" onClick={() => setConfirmSuspend(true)}>Suspend user</Button>}
        {user.status === 'suspended' && <Button size="sm" onClick={() => setConfirmReactivate(true)}>Reactivate user</Button>}
        <Button variant="outline" size="sm" loading={resetMutation.isPending} onClick={() => resetMutation.mutate()}>Send password reset</Button>
        {user.status === 'pending' && <Button variant="outline" size="sm" loading={resendMutation.isPending} onClick={() => resendMutation.mutate()}>Resend invite</Button>}
      </DangerZone>

      <ConfirmModal open={confirmSuspend} onClose={() => setConfirmSuspend(false)} onConfirm={() => statusMutation.mutate('suspended')}
        title="Suspend owner?" description={`This will prevent ${user.name} from accessing their account. Their saloon(s) will remain visible.`}
        confirmLabel="Suspend" loading={statusMutation.isPending} destructive />

      <ConfirmModal open={confirmReactivate} onClose={() => setConfirmReactivate(false)} onConfirm={() => statusMutation.mutate('active')}
        title="Reactivate owner?" description={`This will restore ${user.name}'s access.`}
        confirmLabel="Reactivate" loading={statusMutation.isPending} />
    </div>
  )
}
