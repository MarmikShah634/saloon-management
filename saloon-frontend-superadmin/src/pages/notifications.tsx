import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Bell } from 'lucide-react'
import { notificationApi } from '@/lib/api/endpoints'
import { Button, Skeleton } from '@/components/ui/index'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['notifications-admin'],
    queryFn: ({ pageParam = 1 }) => notificationApi.list({ page: pageParam as number, size: 20 }),
    getNextPageParam: last => last.has_next ? last.page + 1 : undefined,
    initialPageParam: 1,
  })

  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-admin'] }),
  })

  const items = data?.pages.flatMap(p => p.items) ?? []

  return (
    <div className="max-w-screen-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        {items.some(n => !n.is_read) && (
          <Button size="sm" variant="ghost" onClick={() => markAll.mutate()} loading={markAll.isPending}>Mark all read</Button>
        )}
      </div>

      {isLoading && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-16">
          <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No notifications</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {items.map((n, i) => (
            <div key={n.id} className={`flex gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-50' : ''} ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
              <Bell className={`h-4 w-4 mt-0.5 flex-shrink-0 ${n.is_read ? 'text-slate-300' : 'text-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{format(new Date(n.created_at), 'd MMM · HH:mm')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasNextPage && (
        <Button variant="outline" className="w-full" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>Load more</Button>
      )}
    </div>
  )
}
