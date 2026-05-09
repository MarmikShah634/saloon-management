import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { userApi, type User } from '@/lib/api/endpoints'
import { DataTable } from '@/components/ui/data-table'
import { Input, StatusBadge, Pagination } from '@/components/ui/index'
import { shortId } from '@/lib/utils'

export function CustomersListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['customers', q, status, page],
    queryFn: () => userApi.list({ role: 'customer', q: q || undefined, status: status || undefined, page, size: 25 }),
  })

  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <button onClick={() => navigate(`/customers/${row.original.id}`)} className="font-medium text-slate-900 hover:underline">{row.original.name}</button> },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone', cell: ({ row }) => row.original.phone ?? '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: 'id', header: 'ID', cell: ({ row }) => <code className="font-mono text-xs text-slate-400">{shortId(row.original.id)}</code> },
    { id: 'created', header: 'Joined', cell: ({ row }) => <span className="text-xs text-slate-500">{format(new Date(row.original.created_at), 'd MMM yyyy')}</span> },
  ]

  return (
    <div className="space-y-4 max-w-screen-xl">
      <h1 className="text-xl font-bold text-slate-900">Customers</h1>
      <div className="flex gap-2">
        <Input placeholder="Search name, email…" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} className="w-56" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <DataTable data={data?.items ?? []} columns={columns} storageKey="customers" loading={isLoading} onRowClick={row => navigate(`/customers/${row.id}`)} />
      <Pagination page={page} total={data?.total ?? 0} size={25} hasNext={data?.has_next ?? false} onPage={setPage} />
    </div>
  )
}
