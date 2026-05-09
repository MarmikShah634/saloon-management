import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/lib/api/endpoints'
import { Button, Skeleton } from '@/components/ui/index'
import { format } from 'date-fns'
import { Bell } from 'lucide-react'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam = 1 }) => notificationApi.list({ page: pageParam as number }),
    getNextPageParam: last => last.has_next ? last.page + 1 : undefined,
    initialPageParam: 1,
  })
  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const items = data?.pages.flatMap(p => p.items) ?? []
  return (
    <div className="p-4 lg:p-6 max-w-screen-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {items.some(n => !n.is_read) && (
          <button className="text-sm text-brand-600 font-medium" onClick={() => markAll.mutate()}>Mark all read</button>
        )}
      </div>
      {isLoading && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>}
      {!isLoading && items.length === 0 && <div className="text-center py-16"><Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">No notifications</p></div>}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {items.map((n, i) => (
          <div key={n.id} className={`flex gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''} ${!n.is_read ? 'bg-brand-50/30' : ''}`}>
            <Bell className="h-4 w-4 text-brand-500 mt-1 flex-shrink-0" />
            <div className="flex-1"><p className={`text-sm ${!n.is_read ? 'font-semibold' : 'font-medium'} text-gray-900`}>{n.title}</p><p className="text-xs text-gray-500">{n.body}</p><p className="text-[10px] text-gray-400 mt-0.5">{format(new Date(n.created_at), 'd MMM · h:mm a')}</p></div>
          </div>
        ))}
      </div>
      {hasNextPage && <div className="mt-4"><Button variant="outline" className="w-full" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>Load more</Button></div>}
    </div>
  )
}
