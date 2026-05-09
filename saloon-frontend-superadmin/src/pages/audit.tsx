import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { auditApi, type AuditEntry } from '@/lib/api/endpoints'
import { DataTable } from '@/components/ui/data-table'
import { Input, Pagination, RoleBadge, Modal, JsonBlock } from '@/components/ui/index'
import { shortId } from '@/lib/utils'

export function AuditPage() {
  const [page, setPage] = useState(1)
  const [actorId, setActorId] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [diffEntry, setDiffEntry] = useState<AuditEntry | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', actorId, action, entityType, entityId, dateFrom, dateTo, page],
    queryFn: () => auditApi.list({
      actor_id: actorId || undefined, action: action || undefined,
      entity_type: entityType || undefined, entity_id: entityId || undefined,
      date_from: dateFrom || undefined, date_to: dateTo || undefined, page, size: 30,
    }),
  })

  const ENTITY_TYPES = ['', 'user', 'saloon', 'barber', 'service', 'booking', 'working_hours']

  const columns: ColumnDef<AuditEntry, unknown>[] = [
    { id: 'time', header: 'Time', cell: ({ row }) => <span className="font-mono text-xs text-slate-600">{format(new Date(row.original.created_at), 'd MMM HH:mm:ss')}</span> },
    {
      id: 'actor', header: 'Actor', cell: ({ row }) => row.original.actor
        ? <div className="flex items-center gap-1.5"><span className="text-xs">{row.original.actor.name}</span><RoleBadge role={row.original.actor.role} /></div>
        : <span className="text-slate-400 text-xs">System</span>,
    },
    { accessorKey: 'action', header: 'Action', cell: ({ row }) => <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{row.original.action}</code> },
    { accessorKey: 'entity_type', header: 'Entity type', cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.entity_type}</span> },
    { id: 'entity_id', header: 'Entity ID', cell: ({ row }) => row.original.entity_id ? <code className="text-xs font-mono text-slate-400">{shortId(row.original.entity_id)}</code> : '—' },
    {
      id: 'diff', header: 'Diff', enableSorting: false,
      cell: ({ row }) => (row.original.before || row.original.after)
        ? <button onClick={() => setDiffEntry(row.original)} className="text-xs text-blue-600 hover:underline">View diff</button>
        : <span className="text-slate-300 text-xs">—</span>,
    },
  ]

  return (
    <div className="space-y-4 max-w-screen-xl">
      <h1 className="text-xl font-bold text-slate-900">Audit Log</h1>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Actor ID" value={actorId} onChange={e => { setActorId(e.target.value); setPage(1) }} className="w-44" />
        <Input placeholder="Action (e.g. booking.cancel)" value={action} onChange={e => { setAction(e.target.value); setPage(1) }} className="w-52" />
        <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300">
          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t || 'All entities'}</option>)}
        </select>
        <Input placeholder="Entity ID" value={entityId} onChange={e => { setEntityId(e.target.value); setPage(1) }} className="w-44" />
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          <span className="text-slate-400 text-xs">—</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
      </div>

      <DataTable data={data?.items ?? []} columns={columns} storageKey="audit" loading={isLoading} />
      <Pagination page={page} total={data?.total ?? 0} size={30} hasNext={data?.has_next ?? false} onPage={setPage} />

      <Modal open={!!diffEntry} onClose={() => setDiffEntry(null)} title={`Diff — ${diffEntry?.action}`} size="lg">
        {diffEntry && (
          <div>
            <div className="flex gap-2 text-xs text-slate-500 mb-3">
              <span className="font-mono">{diffEntry.entity_type}/{diffEntry.entity_id ? shortId(diffEntry.entity_id) : '—'}</span>
              <span>·</span>
              <span>{format(new Date(diffEntry.created_at), 'd MMM yyyy HH:mm:ss')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs font-medium text-slate-500 mb-1">Before</p><JsonBlock data={diffEntry.before} /></div>
              <div><p className="text-xs font-medium text-slate-500 mb-1">After</p><JsonBlock data={diffEntry.after} /></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
