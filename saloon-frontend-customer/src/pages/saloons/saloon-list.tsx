import { useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X, Scissors } from 'lucide-react'
import { saloonApi } from '@/lib/api/endpoints'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomSheet } from '@/components/ui/modal'
import type { Saloon } from '@/lib/api/types'

function SaloonListCard({ saloon }: { saloon: Saloon }) {
  const navigate = useNavigate()
  return (
    <article
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/saloons/${saloon.slug}`)}
    >
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {saloon.photos?.[0] ? (
          <img
            src={saloon.photos[0]}
            alt={saloon.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors className="h-10 w-10 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{saloon.name}</p>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {saloon.city}{saloon.neighborhood ? `, ${saloon.neighborhood}` : ''}
            </p>
          </div>
          {saloon.is_open_now !== undefined && (
            <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
              saloon.is_open_now ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {saloon.is_open_now ? 'Open' : 'Closed'}
            </span>
          )}
        </div>
        {saloon.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-1">{saloon.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">Services available</p>
          <button
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
            aria-label={`Book at ${saloon.name}`}
          >
            Book →
          </button>
        </div>
      </div>
    </article>
  )
}

function SaloonListSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-full mt-2" />
      </div>
    </div>
  )
}

export function SaloonListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [showFilters, setShowFilters] = useState(false)

  const params = {
    q: searchParams.get('q') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    size: 12,
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['saloons', 'list', params],
      queryFn: ({ pageParam = 1 }) =>
        saloonApi.list({ ...params, page: pageParam as number }),
      getNextPageParam: (last) =>
        last.has_next ? last.page + 1 : undefined,
      initialPageParam: 1,
    })

  const observer = useRef<IntersectionObserver | null>(null)
  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage()
      })
      if (node) observer.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  )

  const allItems = data?.pages.flatMap(p => p.items) ?? []

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (q.trim()) next.set('q', q.trim())
    else next.delete('q')
    setSearchParams(next)
  }

  const activeFilters = ['city', 'service'].filter(k => searchParams.has(k))
  function removeFilter(key: string) {
    const next = new URLSearchParams(searchParams)
    next.delete(key)
    setSearchParams(next)
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-4">
      {/* Search + filter bar */}
      <div className="sticky top-14 z-30 bg-gray-50 pb-3 pt-2 -mx-4 px-4 border-b border-gray-100">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search saloons..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4 text-gray-600" />
          </button>
        </form>

        {activeFilters.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {activeFilters.map(key => (
              <button
                key={key}
                onClick={() => removeFilter(key)}
                className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
              >
                {searchParams.get(key)}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {data && (
        <p className="text-sm text-gray-500 mt-4 mb-3">
          {data.pages[0].total} saloon{data.pages[0].total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SaloonListSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-3">Couldn't load saloons</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      )}

      {!isLoading && !isError && allItems.length === 0 && (
        <div className="text-center py-16">
          <p className="font-medium text-gray-800">No saloons match your filters</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">Try removing some filters</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setSearchParams(new URLSearchParams()); setQ('') }}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {allItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allItems.map((saloon, idx) => {
              const isLast = idx === allItems.length - 1
              return (
                <div key={saloon.id} ref={isLast ? lastCardRef : null}>
                  <SaloonListCard saloon={saloon} />
                </div>
              )
            })}
          </div>

          {isFetchingNextPage && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <SaloonListSkeleton key={i} />)}
            </div>
          )}

          {!hasNextPage && allItems.length > 0 && (
            <p className="text-center text-sm text-gray-400 mt-8">All saloons loaded</p>
          )}
        </>
      )}

      {/* Filter bottom sheet */}
      <BottomSheet open={showFilters} onClose={() => setShowFilters(false)} title="Filters">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">City</label>
            <select
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm"
              value={searchParams.get('city') ?? ''}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams)
                if (e.target.value) next.set('city', e.target.value)
                else next.delete('city')
                setSearchParams(next)
              }}
            >
              <option value="">All cities</option>
              {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Button className="w-full" onClick={() => setShowFilters(false)}>Apply</Button>
        </div>
      </BottomSheet>
    </div>
  )
}
