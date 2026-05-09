import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, MoreHorizontal } from 'lucide-react'
import { saloonApi, type Saloon } from '@/lib/api/endpoints'
import { DataTable } from '@/components/ui/data-table'
import { Button, StatusBadge, ConfirmModal, SelectInput, Input, Pagination, useToast } from '@/components/ui/index'
import { formatPrice, shortId } from '@/lib/utils'
import { format } from 'date-fns'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function SaloonsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('created_at')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ id: string; name: string; action: 'approve' | 'suspend' | 'reactivate' } | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['saloons-admin', q, status, sort, page],
    queryFn: () => saloonApi.list({ q: q || undefined, status: status || undefined, sort, page, size: 25 }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) => saloonApi.updateStatus(id, newStatus),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['saloons-admin'] }); setConfirm(null); toast({ type: 'success', title: 'Saloon updated' }) },
    onError: () => toast({ type: 'error', title: 'Failed to update saloon' }),
  })

  const bulkApproveMutation = useMutation({
    mutationFn: () => Promise.all([...selected].map(id => saloonApi.updateStatus(id, 'active'))),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['saloons-admin'] }); setSelected(new Set()); setBulkConfirm(false); toast({ type: 'success', title: `${selected.size} saloons approved` }) },
  })

  const columns: ColumnDef<Saloon, unknown>[] = [
    {
      id: 'select', header: () => (
        <input type="checkbox" checked={selected.size === (data?.items.length ?? 0) && selected.size > 0}
          onChange={e => setSelected(e.target.checked ? new Set(data?.items.map(s => s.id) ?? []) : new Set())} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" checked={selected.has(row.original.id)}
          onChange={e => { const s = new Set(selected); e.target.checked ? s.add(row.original.id) : s.delete(row.original.id); setSelected(s) }}
          onClick={e => e.stopPropagation()} />
      ),
      enableSorting: false,
    },
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
    { id: 'owner', header: 'Owner', cell: ({ row }) => <span className="text-slate-500">{row.original.owner?.email ?? '—'}</span> },
    { accessorKey: 'city', header: 'City' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: 'id', header: 'ID', cell: ({ row }) => <span className="font-mono text-xs text-slate-400">{shortId(row.original.id)}</span> },
    { id: 'gmv', header: 'GMV', cell: ({ row }) => <span className="font-mono text-xs">{row.original.gmv ? formatPrice(row.original.gmv) : '—'}</span> },
    {
      id: 'created', header: 'Created',
      cell: ({ row }) => <span className="text-xs text-slate-500">{format(new Date(row.original.created_at), 'd MMM yyyy')}</span>,
    },
    {
      id: 'actions', header: '', enableSorting: false,
      cell: ({ row }) => {
        const s = row.original
        return (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild onClick={e => e.stopPropagation()}>
              <button className="p-1 rounded hover:bg-slate-100"><MoreHorizontal className="h-4 w-4 text-slate-400" /></button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-1 min-w-[160px]">
                <DropdownMenu.Item onSelect={() => navigate(`/saloons/${s.id}`)} className="px-3 py-1.5 text-sm rounded hover:bg-slate-50 cursor-pointer outline-none">View</DropdownMenu.Item>
                {s.status === 'pending_approval' && <DropdownMenu.Item onSelect={() => setConfirm({ id: s.id, name: s.name, action: 'approve' })} className="px-3 py-1.5 text-sm rounded hover:bg-slate-50 cursor-pointer outline-none text-emerald-700">Approve</DropdownMenu.Item>}
                {s.status === 'active' && <DropdownMenu.Item onSelect={() => setConfirm({ id: s.id, name: s.name, action: 'suspend' })} className="px-3 py-1.5 text-sm rounded hover:bg-slate-50 cursor-pointer outline-none text-red-600">Suspend</DropdownMenu.Item>}
                {(s.status === 'inactive' || s.status === 'suspended') && <DropdownMenu.Item onSelect={() => setConfirm({ id: s.id, name: s.name, action: 'reactivate' })} className="px-3 py-1.5 text-sm rounded hover:bg-slate-50 cursor-pointer outline-none text-blue-600">Reactivate</DropdownMenu.Item>}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )
      },
    },
  ]

  const actionMap = { approve: 'active', suspend: 'suspended', reactivate: 'active' }

  return (
    <div className="space-y-4 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Saloons</h1>
        <Button size="sm" onClick={() => navigate('/saloons/new')}><Plus className="h-4 w-4" />New saloon</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search name, city…" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} className="w-56" />
        <SelectInput value={status} onValueChange={v => { setStatus(v); setPage(1) }} options={[
          { value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'pending_approval', label: 'Pending' },
          { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' },
        ]} />
        <SelectInput value={sort} onValueChange={setSort} label="" options={[
          { value: 'created_at', label: 'Sort: Created' }, { value: 'name', label: 'Sort: Name' },
          { value: 'gmv', label: 'Sort: GMV' }, { value: 'last_booking_at', label: 'Sort: Last booking' },
        ]} />
        {selected.size > 0 && (
          <Button size="sm" variant="secondary" onClick={() => setBulkConfirm(true)}>Approve {selected.size} selected</Button>
        )}
      </div>

      <DataTable
        data={data?.items ?? []}
        columns={columns}
        storageKey="saloons"
        loading={isLoading}
        onRowClick={row => navigate(`/saloons/${row.id}`)}
      />
      <Pagination page={page} total={data?.total ?? 0} size={25} hasNext={data?.has_next ?? false} onPage={setPage} />

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && statusMutation.mutate({ id: confirm.id, newStatus: actionMap[confirm.action] })}
        title={`${confirm?.action === 'approve' ? 'Approve' : confirm?.action === 'suspend' ? 'Suspend' : 'Reactivate'} saloon`}
        description={`This will ${confirm?.action} "${confirm?.name}". The owner will be notified.`}
        confirmLabel={confirm?.action === 'approve' ? 'Approve' : confirm?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
        loading={statusMutation.isPending}
        destructive={confirm?.action === 'suspend'}
      />
      <ConfirmModal
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={() => bulkApproveMutation.mutate()}
        title={`Approve ${selected.size} saloons?`}
        description={`This will activate ${selected.size} saloons. Their owners will be notified.`}
        confirmLabel="Approve all"
        loading={bulkApproveMutation.isPending}
      />
    </div>
  )
}
