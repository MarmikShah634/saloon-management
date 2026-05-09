import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronRight } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { bookingApi } from '@/lib/api/endpoints'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/badge'
import { formatBookingDate } from '@/lib/utils'
import type { Booking } from '@/lib/api/types'

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Link
      to={`/account/bookings/${booking.id}`}
      className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3 hover:shadow-sm transition-shadow"
    >
      <CalendarDays className="h-8 w-8 text-brand-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{formatBookingDate(booking.start_at)}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{booking.saloon?.name ?? 'Saloon'}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {booking.items.slice(0, 2).map(item => (
            <span key={item.id} className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {item.service_name_snapshot}
            </span>
          ))}
          {booking.items.length > 2 && (
            <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              +{booking.items.length - 2}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <StatusBadge status={booking.status} />
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </Link>
  )
}

function BookingListContent({ statusFilter }: { statusFilter: 'upcoming' | 'past' }) {
  const navigate = useNavigate()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['bookings-me', statusFilter],
      queryFn: ({ pageParam = 1 }) =>
        bookingApi.listMine({ status: statusFilter, page: pageParam as number, size: 15 }),
      getNextPageParam: (last) => last.has_next ? last.page + 1 : undefined,
      initialPageParam: 1,
    })

  const items = data?.pages.flatMap(p => p.items) ?? []

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white border border-gray-100 overflow-hidden">
            <Skeleton className="h-full w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-3">Couldn't load bookings</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        {statusFilter === 'upcoming' ? (
          <>
            <p className="font-medium text-gray-800">No upcoming bookings</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">Find a saloon and book your spot</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/saloons')}>
              Find a saloon
            </Button>
          </>
        ) : (
          <p className="text-sm text-gray-500">Your past bookings will show up here.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 mt-4">
      {items.map(booking => <BookingCard key={booking.id} booking={booking} />)}
      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          loading={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          Load more
        </Button>
      )}
    </div>
  )
}

export function BookingsListPage() {
  return (
    <div className="max-w-screen-sm mx-auto px-4 py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">My bookings</h1>
      <Tabs.Root defaultValue="upcoming">
        <Tabs.List className="flex gap-2 mb-2">
          {['upcoming', 'past'].map(tab => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="px-4 py-2 text-sm font-medium rounded-xl capitalize text-gray-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 transition-colors"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="upcoming">
          <BookingListContent statusFilter="upcoming" />
        </Tabs.Content>
        <Tabs.Content value="past">
          <BookingListContent statusFilter="past" />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
