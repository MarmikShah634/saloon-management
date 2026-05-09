import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { bookingApi, type Booking } from '@/lib/api/endpoints'
import { DataTable } from '@/components/ui/data-table'
import { Input, StatusBadge, Pagination, SelectInput } from '@/components/ui/index'
import { formatPrice, shortId } from '@/lib/utils'

export function BookingsListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['bookings-admin', q, status, dateFrom, dateTo, page],
    queryFn: () => bookingApi.list({ q: q || undefined, status: status || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined, page, size: 25 }),
  })

  const columns: ColumnDef<Booking, unknown>[] = [
    { id: 'id', header: 'ID', cell: ({ row }) => <button onClick={() => navigate(`/bookings/${row.original.id}`)} className="font-mono text-xs text-blue-600 hover:underline">{shortId(row.original.id)}</button> },
    { id: 'saloon', header: 'Saloon', cell: ({ row }) => row.original.saloon?.name ?? '—' },
    { id: 'barber', header: 'Barber', cell: ({ row }) => row.original.barber?.user.name ?? '—' },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer?.name ?? '—' },
    { id: 'date', header: 'Date', cell: ({ row }) => format(new Date(row.original.start_at), 'd MMM yy, h:mm a') },
    { id: 'items', header: 'Services', cell: ({ row }) => row.original.items.length },
    { accessorKey: 'total_price', header: 'Total', cell: ({ row }) => formatPrice(row.original.total_price) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ]

  return (
    <div className="space-y-4 max-w-screen-xl">
      <h1 className="text-xl font-bold text-slate-900">Bookings</h1>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search customer, saloon…" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} className="w-52" />
        <SelectInput value={status} onValueChange={v => { setStatus(v); setPage(1) }} options={[
          { value: '', label: 'All statuses' },
          { value: 'confirmed', label: 'Confirmed' }, { value: 'in_progress', label: 'In progress' },
          { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'no_show', label: 'No-show' },
        ]} />
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          <span className="text-slate-400">—</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
      </div>
      <DataTable data={data?.items ?? []} columns={columns} storageKey="bookings-admin" loading={isLoading} onRowClick={row => navigate(`/bookings/${row.id}`)} />
      <Pagination page={page} total={data?.total ?? 0} size={25} hasNext={data?.has_next ?? false} onPage={setPage} />
    </div>
  )
}
