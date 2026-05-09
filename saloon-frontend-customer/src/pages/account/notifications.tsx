import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/lib/api/endpoints'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/utils'
import type { Notification } from '@/lib/api/types'
import { Bell, CheckCheck } from 'lucide-react'

function NotificationItem({
  notif, onRead,
}: { notif: Notification; onRead: (id: string) => void }) {
  return (
    <button
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        !notif.is_read ? 'bg-white' : 'bg-gray-50/50'
      }`}
      onClick={() => !notif.is_read && onRead(notif.id)}
    >
      <div className="relative mt-1 flex-shrink-0">
        <Bell className="h-4 w-4 text-brand-500" />
        {!notif.is_read && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-brand-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
      </div>
    </button>
  )
}

export function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['notifications', 'all'],
      queryFn: ({ pageParam = 1 }) =>
        notificationApi.list({ page: pageParam as number, size: 20 }),
      getNextPageParam: (last) => last.has_next ? last.page + 1 : undefined,
      initialPageParam: 1,
    })

  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const items = data?.pages.flatMap(p => p.items) ?? []
  const hasUnread = items.some(n => !n.is_read)

  return (
    <div className="max-w-screen-sm mx-auto">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        {hasUnread && (
          <button
            className="flex items-center gap-1.5 text-sm text-brand-600 font-medium"
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-1 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-3">Couldn't load notifications</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-16">
          <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No notifications yet</p>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {items.map(notif => (
          <NotificationItem
            key={notif.id}
            notif={notif}
            onRead={(id) => markRead.mutate(id)}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="px-4 py-4">
          <Button variant="outline" className="w-full" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
