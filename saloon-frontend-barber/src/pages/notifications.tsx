import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/lib/api/endpoints'
import { Button, Skeleton } from '@/components/ui/index'
import { format } from 'date-fns'
import { Bell } from 'lucide-react'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam = 1 }) => notificationApi.list({ page: pageParam as number, size: 20 }),
    getNextPageParam: last => last.has_next ? last.page + 1 : undefined,
    initialPageParam: 1,
  })
  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const items = data?.pages.flatMap(p => p.items) ?? []

  return (
    <div className="max-w-screen-sm mx-auto">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        {items.some(n => !n.is_read) && (
          <button className="text-sm text-brand-600 font-medium" onClick={() => markAll.mutate()}>Mark all read</button>
        )}
      </div>
      {isLoading && <div className="space-y-1 mt-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 mx-4 rounded-xl" />)}</div>}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-16"><Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">No notifications</p></div>
      )}
      <div className="divide-y divide-gray-50">
        {items.map(n => (
          <button key={n.id} onClick={() => !n.is_read && markRead.mutate(n.id)}
            className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 ${!n.is_read ? 'bg-white' : 'bg-gray-50/50'}`}>
            <Bell className="h-4 w-4 text-brand-500 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{format(new Date(n.created_at), 'd MMM · h:mm a')}</p>
            </div>
            {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-600 mt-2 flex-shrink-0" />}
          </button>
        ))}
      </div>
      {hasNextPage && (
        <div className="px-4 py-4">
          <Button variant="outline" className="w-full" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>Load more</Button>
        </div>
      )}
    </div>
  )
}
