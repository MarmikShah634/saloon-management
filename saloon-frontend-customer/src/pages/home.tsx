import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, Star, X, Scissors, SprayCan, Brush, Wind, ArrowRight, Sparkles } from 'lucide-react'
import { saloonApi } from '@/lib/api/endpoints'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { Saloon } from '@/lib/api/types'

const serviceCategories = [
  { label: 'Haircut', icon: Scissors, slug: 'haircut', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { label: 'Beard', icon: SprayCan, slug: 'beard', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  { label: 'Color', icon: Brush, slug: 'color', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
  { label: 'Spa', icon: Wind, slug: 'spa', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
]

const trustItems = [
  { icon: Star, label: 'Verified saloons', sub: 'Every listing reviewed' },
  { icon: Clock, label: 'Instant booking', sub: 'No phone calls needed' },
  { icon: X, label: 'Free cancellation', sub: 'Cancel up to 2h before' },
]

function SaloonCard({ saloon }: { saloon: Saloon }) {
  const navigate = useNavigate()
  return (
    <div
      className="flex-shrink-0 w-60 bg-white rounded-2xl overflow-hidden card-glow card-glow-hover cursor-pointer"
      onClick={() => navigate(`/saloons/${saloon.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/saloons/${saloon.slug}`)}
      aria-label={`View ${saloon.name}`}
    >
      <div className="h-36 bg-gradient-to-br from-brand-100 to-brand-200 relative overflow-hidden">
        {saloon.photos?.[0] ? (
          <img src={saloon.photos[0]} alt={saloon.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors className="h-10 w-10 text-brand-300" />
          </div>
        )}
        {saloon.status === 'active' && (
          <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Open
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 truncate text-sm">{saloon.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3 text-gray-400" />
          <p className="text-xs text-gray-500 truncate">{saloon.city}</p>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [city, setCity] = useState<string>('')
  const [geoError, setGeoError] = useState(false)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setCity('Mumbai'),
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

  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="max-w-screen-lg mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient px-4 py-20 lg:py-28">
        <div className="absolute top-[-40%] right-[-10%] w-96 h-96 rounded-full bg-brand-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-5%] w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto text-center">
          {user && (
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5 text-sm text-brand-100">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome back, {firstName}!
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 text-white tracking-tight">
            Skip the wait.<br />
            <span className="text-brand-300">Book your chair.</span>
          </h1>
          <p className="text-brand-200 mb-8 text-lg">
            Discover the best saloons near you and book in seconds.
          </p>

          {geoError ? (
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <select
                className="h-12 rounded-2xl px-4 text-gray-900 text-sm bg-white shadow-sm"
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
                className="w-full bg-white !text-brand-700 hover:bg-brand-50 shadow-sm"
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
                className="w-full bg-white !text-brand-700 hover:bg-brand-50 shadow-sm font-semibold"
                loading={!city && !geoError}
              >
                <MapPin className="h-4 w-4" />
                {city ? `Saloons near ${city}` : 'Detecting location...'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => navigate('/saloons')}
                className="!text-brand-200 hover:!text-white hover:bg-white/10"
              >
                Browse all saloons
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Popular rail */}
      <section className="px-4 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Popular near you</h2>
            {city && <p className="text-xs text-gray-400 mt-0.5">in {city}</p>}
          </div>
          <button
            className="flex items-center gap-1 text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            onClick={() => navigate('/saloons')}
          >
            See all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {isLoading && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-60">
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-4 w-32 mt-2" />
                <Skeleton className="h-3 w-20 mt-1.5" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-500 mb-3">Couldn't load saloons</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
          </div>
        )}

        {nearbyData && nearbyData.items.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
            <Scissors className="h-8 w-8 text-brand-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">We're not in your city yet</p>
            <p className="text-sm text-gray-400 mb-4 mt-1">Check back soon or browse all cities</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/saloons')}>Browse all</Button>
          </div>
        )}

        {nearbyData && nearbyData.items.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {nearbyData.items.map(saloon => (
              <div key={saloon.id} className="snap-start">
                <SaloonCard saloon={saloon} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Service categories */}
      <section className="px-4 pt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Browse by service</h2>
        <div className="grid grid-cols-4 gap-3">
          {serviceCategories.map(({ label, icon: Icon, slug, color, bg, border }) => (
            <button
              key={slug}
              className={`flex flex-col items-center gap-2 p-3.5 bg-white rounded-2xl border ${border} hover:scale-[1.03] hover:shadow-card transition-all active:scale-[0.97]`}
              onClick={() => navigate(`/saloons?service=${slug}`)}
            >
              <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className="text-xs font-semibold text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-4 pt-8 pb-8">
        <div className="bg-white rounded-3xl border border-brand-100/60 p-5 card-glow">
          <p className="text-center text-xs font-semibold text-brand-600 uppercase tracking-widest mb-4">Why Saloon?</p>
          <div className="grid grid-cols-3 gap-3">
            {trustItems.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1.5">
                <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <p className="text-xs font-semibold text-gray-800">{label}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
