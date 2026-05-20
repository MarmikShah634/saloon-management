import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { analyticsApi, saloonApi } from '@/lib/api/endpoints'
import { StatCard, Button, ConfirmModal, useToast, Skeleton } from '@/components/ui/index'
import { formatPrice, shortId } from '@/lib/utils'

type Range = '7d' | '30d' | '90d'

export function OverviewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [range, setRange] = useState<Range>('30d')
  const [actionTarget, setActionTarget] = useState<{ id: string; name: string; action: 'approve' | 'reject' } | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const dateFrom = range === '7d' ? format(subDays(new Date(), 7), 'yyyy-MM-dd')
    : range === '30d' ? format(subDays(new Date(), 30), 'yyyy-MM-dd')
    : format(subDays(new Date(), 90), 'yyyy-MM-dd')

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-overview', dateFrom, today],
    queryFn: () => analyticsApi.overview({ date_from: dateFrom, date_to: today }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => saloonApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] })
      setActionTarget(null)
      toast({ type: 'success', title: 'Saloon status updated' })
    },
    onError: () => toast({ type: 'error', title: 'Failed to update status' }),
  })

  const stats = data?.stats
  const statCards = [
    { label: 'Total saloons', value: stats?.total_saloons ?? 0, sub: `${stats?.active_saloons ?? 0} active · ${stats?.pending_saloons ?? 0} pending` },
    { label: 'Owners', value: stats?.total_owners ?? 0 },
    { label: 'Barbers', value: stats?.total_barbers ?? 0 },
    { label: 'Customers', value: stats?.total_customers ?? 0 },
    { label: 'Bookings today', value: stats?.bookings_today ?? 0 },
    { label: 'Bookings this month', value: stats?.bookings_this_month ?? 0 },
    { label: 'GMV today', value: stats ? formatPrice(stats.gmv_today) : '—' },
    { label: 'GMV this month', value: stats ? formatPrice(stats.gmv_this_month) : '—' },
  ]

  const ranges: { label: string; value: Range }[] = [{ label: '7d', value: '7d' }, { label: '30d', value: '30d' }, { label: '90d', value: '90d' }]

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Platform Overview</h1>
        <div className="flex gap-1">
          {ranges.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === r.value ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {statCards.map(({ label, value, sub }) => (
          <StatCard key={label} label={label} value={value} sub={sub} loading={isLoading} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-700 mb-3">Bookings per day</p>
          {isLoading ? <Skeleton className="h-40" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data?.bookings_per_day ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} width={32} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="#334155" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-700 mb-3">New signups per day</p>
          {isLoading ? <Skeleton className="h-40" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data?.signups_per_day ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} width={32} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="customers" stackId="a" fill="#64748b" />
                <Bar dataKey="barbers" stackId="a" fill="#94a3b8" />
                <Bar dataKey="owners" stackId="a" fill="#cbd5e1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top by GMV */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-700 mb-3">Top saloons by GMV</p>
          {isLoading ? <Skeleton className="h-32" /> : (
            <table className="w-full text-xs">
              <tbody>
                {(data?.top_saloons_by_gmv ?? []).map((s, i) => (
                  <tr key={s.saloon_id} className="border-t border-slate-50 first:border-0">
                    <td className="py-1.5 text-slate-400 w-5">{i + 1}</td>
                    <td className="py-1.5"><button onClick={() => navigate(`/saloons/${s.saloon_id}`)} className="text-slate-800 hover:underline font-medium">{s.name}</button></td>
                    <td className="py-1.5 text-right font-mono text-slate-600">{formatPrice(s.gmv)}</td>
                  </tr>
                ))}
                {!data?.top_saloons_by_gmv?.length && <tr><td colSpan={3} className="text-slate-400 py-4 text-center">No data</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        {/* Top by volume */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-700 mb-3">Top by booking volume</p>
          {isLoading ? <Skeleton className="h-32" /> : (
            <table className="w-full text-xs">
              <tbody>
                {(data?.top_saloons_by_volume ?? []).map((s, i) => (
                  <tr key={s.saloon_id} className="border-t border-slate-50 first:border-0">
                    <td className="py-1.5 text-slate-400 w-5">{i + 1}</td>
                    <td className="py-1.5"><button onClick={() => navigate(`/saloons/${s.saloon_id}`)} className="text-slate-800 hover:underline font-medium">{s.name}</button></td>
                    <td className="py-1.5 text-right font-mono text-slate-600">{s.bookings}</td>
                  </tr>
                ))}
                {!data?.top_saloons_by_volume?.length && <tr><td colSpan={3} className="text-slate-400 py-4 text-center">No data</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        {/* High cancel rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-700 mb-3">High cancellation rate</p>
          {isLoading ? <Skeleton className="h-32" /> : (
            <table className="w-full text-xs">
              <tbody>
                {(data?.high_cancel_rate ?? []).map((s) => (
                  <tr key={s.saloon_id} className="border-t border-slate-50 first:border-0">
                    <td className="py-1.5"><button onClick={() => navigate(`/saloons/${s.saloon_id}`)} className="text-slate-800 hover:underline font-medium">{s.name}</button></td>
                    <td className="py-1.5 text-right font-mono text-red-600">{(s.cancel_rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                {!data?.high_cancel_rate?.length && <tr><td colSpan={2} className="text-slate-400 py-4 text-center">No concerns</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pending saloons */}
      {(data?.pending_saloons?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-700 mb-3">Awaiting approval ({data!.pending_saloons.length})</p>
          <div className="space-y-2">
            {data!.pending_saloons.map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <button onClick={() => navigate(`/saloons/${s.id}`)} className="text-sm font-medium text-slate-900 hover:underline">{s.name}</button>
                  <p className="text-xs text-slate-500">{s.city} · {shortId(s.id)}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setActionTarget({ id: s.id, name: s.name, action: 'approve' })}>Approve</Button>
                <Button size="sm" variant="ghost" onClick={() => setActionTarget({ id: s.id, name: s.name, action: 'reject' })}>Reject</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={() => actionTarget && statusMutation.mutate({ id: actionTarget.id, status: actionTarget.action === 'approve' ? 'active' : 'rejected' })}
        title={actionTarget?.action === 'approve' ? 'Approve saloon?' : 'Reject saloon?'}
        description={`This will ${actionTarget?.action === 'approve' ? 'activate' : 'reject'} "${actionTarget?.name}". The owner will be notified.`}
        confirmLabel={actionTarget?.action === 'approve' ? 'Approve' : 'Reject'}
        loading={statusMutation.isPending}
        destructive={actionTarget?.action === 'reject'}
      />
    </div>
  )
}
