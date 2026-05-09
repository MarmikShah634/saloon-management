import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, Star, X, Scissors, SprayCan, Brush, Wind } from 'lucide-react'
import { saloonApi } from '@/lib/api/endpoints'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/utils'
import type { Saloon } from '@/lib/api/types'

const serviceCategories = [
  { label: 'Haircut', icon: Scissors, slug: 'haircut' },
  { label: 'Beard', icon: SprayCan, slug: 'beard' },
  { label: 'Hair Color', icon: Brush, slug: 'color' },
  { label: 'Spa', icon: Wind, slug: 'spa' },
]

function SaloonCard({ saloon }: { saloon: Saloon }) {
  const navigate = useNavigate()
  return (
    <div
      className="flex-shrink-0 w-64 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/saloons/${saloon.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/saloons/${saloon.slug}`)}
      aria-label={`View ${saloon.name}`}
    >
      <div className="h-36 bg-gray-100 relative overflow-hidden">
        {saloon.photos?.[0] ? (
          <img src={saloon.photos[0]} alt={saloon.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 truncate">{saloon.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{saloon.city}</p>
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [city, setCity] = useState<string>('')
  const [geoError, setGeoError] = useState(false)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setCity('Mumbai'),  // In prod, reverse-geocode to city
        () => setGeoError(true),
        { timeout: 5000 },
      )
    } else {
      setGeoError(true)
    }
  }, [])

  const { data: nearbyData, isLoading, isError, refetch } = useQuery({
    queryKey: ['saloons', 'popular', city],
    queryFn: () => saloonApi.list({ city: city || undefined, page: 1, size: 10 }),
    enabled: true,
  })

  return (
    <div className="max-w-screen-lg mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 text-white px-4 py-20 mx-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-brand-900/80 to-gray-900 opacity-90" />
        <div className="relative z-10 max-w-lg mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
            Skip the wait.<br />Book your chair.
          </h1>
          <p className="text-gray-300 mb-8">
            Find the best saloons near you and book in seconds.
          </p>

          {geoError ? (
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <select
                className="h-12 rounded-xl px-3 text-gray-900 text-sm"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Select city"
              >
                <option value="">Select a city</option>
                {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Button
                size="lg"
                onClick={() => navigate(`/saloons${city ? `?city=${city}` : ''}`)}
                className="w-full"
              >
                <MapPin className="h-4 w-4" />
                Find saloons
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button
                size="lg"
                onClick={() => navigate(`/saloons${city ? `?city=${city}` : ''}`)}
                className="w-full"
                loading={!city && !geoError}
              >
                <MapPin className="h-4 w-4" />
                {city ? `Saloons near ${city}` : 'Detecting location...'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => navigate('/saloons')}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                Browse all saloons
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Popular rail */}
      <section className="px-4 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Popular near you</h2>
          <button
            className="text-sm text-brand-600 font-medium"
            onClick={() => navigate('/saloons')}
          >
            See all
          </button>
        </div>

        {isLoading && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64">
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-4 w-32 mt-2" />
                <Skeleton className="h-3 w-20 mt-1.5" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-3">Couldn't load saloons</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
          </div>
        )}

        {nearbyData && nearbyData.items.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-3">We're not in your city yet</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/saloons')}>
              Browse all saloons
            </Button>
          </div>
        )}

        {nearbyData && nearbyData.items.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {nearbyData.items.map(saloon => (
              <SaloonCard key={saloon.id} saloon={saloon} />
            ))}
          </div>
        )}
      </section>

      {/* Service categories */}
      <section className="px-4 pt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by service</h2>
        <div className="grid grid-cols-4 gap-3">
          {serviceCategories.map(({ label, icon: Icon, slug }) => (
            <button
              key={slug}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors"
              onClick={() => navigate(`/saloons?service=${slug}`)}
            >
              <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-4 pt-8 pb-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Star, label: 'Confirmed bookings' },
              { icon: Clock, label: 'No more waits' },
              { icon: X, label: 'Cancel up to 2h before' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1.5">
                <Icon className="h-5 w-5 text-brand-600" />
                <p className="text-xs text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
