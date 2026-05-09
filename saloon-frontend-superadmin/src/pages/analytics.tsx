import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import { analyticsApi } from '@/lib/api/endpoints'
import { StatCard, TabsRoot, TabsList, TabsTrigger, TabsContent, Skeleton } from '@/components/ui/index'
import { formatPrice } from '@/lib/utils'

type Range = '7d' | '30d' | '90d'

export function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d')
  const today = format(new Date(), 'yyyy-MM-dd')
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
  const dateFrom = format(subDays(new Date(), daysMap[range]), 'yyyy-MM-dd')

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-overview-full', dateFrom, today],
    queryFn: () => analyticsApi.overview({ date_from: dateFrom, date_to: today }),
  })

  const stats = data?.stats
  const ranges: { label: string; value: Range }[] = [{ label: '7d', value: '7d' }, { label: '30d', value: '30d' }, { label: '90d', value: '90d' }]

  return (
    <div className="space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        <div className="flex gap-1">
          {ranges.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === r.value ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total saloons" value={stats?.total_saloons ?? 0} sub={`${stats?.active_saloons ?? 0} active`} loading={isLoading} />
        <StatCard label="Total customers" value={stats?.total_customers ?? 0} loading={isLoading} />
        <StatCard label="Bookings this month" value={stats?.bookings_this_month ?? 0} loading={isLoading} />
        <StatCard label="GMV this month" value={stats ? formatPrice(stats.gmv_this_month) : '—'} loading={isLoading} />
      </div>

      <TabsRoot defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="saloons">Saloons</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-700 mb-4">Bookings per day</p>
            {isLoading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data?.bookings_per_day ?? []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} width={36} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={2} dot={false} name="Bookings" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-700 mb-4">GMV per day</p>
            {isLoading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={(data?.gmv_per_day ?? []).map(d => ({ ...d, value: parseFloat(d.value) }))} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'GMV']} />
                  <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} name="GMV" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        <TabsContent value="growth">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-700 mb-4">New signups per day</p>
            {isLoading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.signups_per_day ?? []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} width={36} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="customers" stackId="a" fill="#64748b" name="Customers" />
                  <Bar dataKey="barbers" stackId="a" fill="#94a3b8" name="Barbers" />
                  <Bar dataKey="owners" stackId="a" fill="#cbd5e1" name="Owners" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saloons">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Active" value={stats?.active_saloons ?? 0} loading={isLoading} />
            <StatCard label="Pending approval" value={stats?.pending_saloons ?? 0} loading={isLoading} />
            <StatCard label="Inactive/Suspended" value={stats?.inactive_saloons ?? 0} loading={isLoading} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
            <p className="text-xs font-semibold text-slate-700 mb-3">Top saloons by GMV</p>
            {isLoading ? <Skeleton className="h-32" /> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100"><th className="text-left text-xs text-slate-500 pb-2">#</th><th className="text-left text-xs text-slate-500 pb-2">Saloon</th><th className="text-right text-xs text-slate-500 pb-2">GMV</th></tr></thead>
                <tbody>
                  {(data?.top_saloons_by_gmv ?? []).map((s, i) => (
                    <tr key={s.saloon_id} className="border-t border-slate-50">
                      <td className="py-2 text-xs text-slate-400">{i + 1}</td>
                      <td className="py-2 text-sm font-medium">{s.name}</td>
                      <td className="py-2 text-right font-mono text-sm">{formatPrice(s.gmv)}</td>
                    </tr>
                  ))}
                  {!data?.top_saloons_by_gmv?.length && <tr><td colSpan={3} className="text-center text-slate-400 py-6 text-sm">No data for this period</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </TabsRoot>
    </div>
  )
}
