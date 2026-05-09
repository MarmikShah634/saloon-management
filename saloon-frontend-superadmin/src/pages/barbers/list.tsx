import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { barberApi, type Barber } from '@/lib/api/endpoints'
import { DataTable } from '@/components/ui/data-table'
import { Input, Pagination } from '@/components/ui/index'
import { shortId, pct } from '@/lib/utils'

export function BarbersListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['barbers-admin', q, page],
    queryFn: () => barberApi.list({ q: q || undefined, page, size: 25 }),
  })

  const columns: ColumnDef<Barber, unknown>[] = [
    { id: 'name', header: 'Name', cell: ({ row }) => <button onClick={() => navigate(`/barbers/${row.original.id}`)} className="font-medium text-slate-900 hover:underline">{row.original.user.name}</button> },
    { id: 'email', header: 'Email', cell: ({ row }) => row.original.user.email },
    { id: 'saloon', header: 'Saloon', cell: ({ row }) => row.original.saloon ? <button onClick={e => { e.stopPropagation(); navigate(`/saloons/${row.original.saloon!.id}`) }} className="text-blue-600 hover:underline">{row.original.saloon.name}</button> : '—' },
    { id: 'active', header: 'Active', cell: ({ row }) => <span className={row.original.is_active ? 'text-emerald-600' : 'text-slate-400'}>{row.original.is_active ? 'Yes' : 'No'}</span> },
    { id: 'bookings', header: 'Bookings', cell: ({ row }) => row.original.bookings_count ?? '—' },
    { id: 'cancel_rate', header: 'Cancel rate', cell: ({ row }) => row.original.cancel_rate != null ? pct(row.original.cancel_rate) : '—' },
    { id: 'id', header: 'ID', cell: ({ row }) => <code className="font-mono text-xs text-slate-400">{shortId(row.original.id)}</code> },
    { id: 'created', header: 'Created', cell: ({ row }) => <span className="text-xs text-slate-500">{format(new Date(row.original.user.created_at ?? row.original.id), 'd MMM yyyy')}</span> },
  ]

  return (
    <div className="space-y-4 max-w-screen-xl">
      <h1 className="text-xl font-bold text-slate-900">Barbers</h1>
      <div className="flex gap-2">
        <Input placeholder="Search name, email…" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} className="w-56" />
      </div>
      <DataTable data={data?.items ?? []} columns={columns} storageKey="barbers" loading={isLoading} onRowClick={row => navigate(`/barbers/${row.id}`)} />
      <Pagination page={page} total={data?.total ?? 0} size={25} hasNext={data?.has_next ?? false} onPage={setPage} />
    </div>
  )
}
