import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Phone, ChevronLeft, ChevronRight, Plus, Minus, Scissors } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { saloonApi } from '@/lib/api/endpoints'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomSheet } from '@/components/ui/modal'
import { formatPrice } from '@/lib/utils'
import { useBookingStore } from '@/lib/stores/booking.store'
import type { Service, Barber } from '@/lib/api/types'

function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const [idx, setIdx] = useState(0)
  if (!photos.length) {
    return (
      <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
        <Scissors className="h-12 w-12 text-gray-300" />
      </div>
    )
  }
  return (
    <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
      <img src={photos[idx]} alt={name} className="w-full h-full object-cover" />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIdx(i => Math.min(photos.length - 1, i + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center"
            aria-label="Next photo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ServiceRow({ service, selected, onToggle }: {
  service: Service; selected: boolean; onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{service.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{service.duration_mins} min · {formatPrice(service.price)}</p>
      </div>
      <button
        onClick={onToggle}
        className={`ml-3 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
          selected
            ? 'bg-brand-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-label={selected ? `Remove ${service.name}` : `Add ${service.name}`}
      >
        {selected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
    </div>
  )
}

function BarberCardItem({ barber, onBook }: { barber: Barber; onBook: (b: Barber) => void }) {
  return (
    <button
      className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:border-brand-200 transition-colors text-center"
      onClick={() => onBook(barber)}
    >
      <div className="h-14 w-14 rounded-full bg-gray-200 overflow-hidden">
        {barber.photo_url ? (
          <img src={barber.photo_url} alt={barber.user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
            {barber.user.name[0]}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{barber.user.name}</p>
        <p className="text-xs text-gray-500">{barber.barber_services.length} services</p>
      </div>
    </button>
  )
}

export function SaloonDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { initDraft, setServices } = useBookingStore()
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [barberModal, setBarberModal] = useState<Barber | null>(null)

  const { data: saloon, isLoading: saloonLoading } = useQuery({
    queryKey: ['saloon', slug],
    queryFn: () => saloonApi.get(slug!),
    enabled: !!slug,
  })

  const { data: servicesData } = useQuery({
    queryKey: ['saloon-services', saloon?.id],
    queryFn: () => saloonApi.getServices(saloon!.id),
    enabled: !!saloon,
  })

  const { data: barbersData } = useQuery({
    queryKey: ['saloon-barbers', saloon?.id],
    queryFn: () => saloonApi.getBarbers(saloon!.id),
    enabled: !!saloon,
  })

  function toggleService(svc: Service) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === svc.id)
      return exists ? prev.filter(s => s.id !== svc.id) : [...prev, svc]
    })
  }

  function startBooking() {
    if (!saloon || selectedServices.length === 0) return
    initDraft(saloon.id, saloon.slug, saloon.name, saloon.timezone)
    setServices(selectedServices)
    navigate(`/saloons/${slug}/book`)
  }

  function bookWithBarber(barber: Barber) {
    if (!saloon) return
    initDraft(saloon.id, saloon.slug, saloon.name, saloon.timezone)
    if (selectedServices.length > 0) setServices(selectedServices)
    navigate(`/saloons/${slug}/book?barber_id=${barber.id}`)
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.price), 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_mins, 0)
  const services = servicesData?.items ?? []
  const barbers = barbersData?.items ?? []

  if (saloonLoading) {
    return (
      <div className="max-w-screen-sm mx-auto">
        <Skeleton className="aspect-video w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    )
  }

  if (!saloon) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">Saloon not found</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate('/saloons')}>
          Browse saloons
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-screen-sm mx-auto pb-32">
      <PhotoCarousel photos={saloon.photos} name={saloon.name} />

      {/* Identity block */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900">{saloon.name}</h1>
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>{saloon.city}{saloon.address ? ` · ${saloon.address}` : ''}</span>
        </div>
        {saloon.phone && (
          <a
            href={`tel:${saloon.phone}`}
            className="flex items-center gap-1 mt-1 text-sm text-brand-600"
          >
            <Phone className="h-3.5 w-3.5" />
            {saloon.phone}
          </a>
        )}
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="services" className="mt-2">
        <Tabs.List className="flex border-b border-gray-100 px-4">
          {['services', 'barbers', 'about', 'hours'].map(tab => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="px-4 py-2.5 text-sm font-medium capitalize text-gray-500 data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600 -mb-px transition-colors"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="services" className="px-4 pt-4 animate-fade-in">
          {services.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No services listed yet</p>
          ) : (
            <div>
              {services.map(svc => (
                <ServiceRow
                  key={svc.id}
                  service={svc}
                  selected={!!selectedServices.find(s => s.id === svc.id)}
                  onToggle={() => toggleService(svc)}
                />
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="barbers" className="px-4 pt-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            {barbers.map(barber => (
              <BarberCardItem key={barber.id} barber={barber} onBook={bookWithBarber} />
            ))}
          </div>
          {barbers.length === 0 && (
            <p className="text-sm text-gray-500 py-8 text-center">No barbers listed</p>
          )}
        </Tabs.Content>

        <Tabs.Content value="about" className="px-4 pt-4 animate-fade-in">
          <p className="text-sm text-gray-700 leading-relaxed">
            {saloon.description ?? 'No description available.'}
          </p>
        </Tabs.Content>

        <Tabs.Content value="hours" className="px-4 pt-4 animate-fade-in">
          <div className="space-y-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const isToday = new Date().getDay() === (i + 1) % 7
              return (
                <div key={day} className={`flex items-center justify-between py-2 ${isToday ? 'font-semibold text-brand-700' : 'text-gray-700'}`}>
                  <span className="text-sm">{day}</span>
                  <span className="text-sm">{saloon.default_open} – {saloon.default_close}</span>
                </div>
              )
            })}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Selection bar */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg px-4 py-3">
          <div className="max-w-screen-sm mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">{totalDuration} min · {formatPrice(totalPrice)}</p>
            </div>
            <Button size="md" onClick={startBooking} className="flex-shrink-0">
              Continue to booking
            </Button>
          </div>
        </div>
      )}

      {/* Barber modal */}
      <BottomSheet
        open={!!barberModal}
        onClose={() => setBarberModal(null)}
        title={barberModal?.user.name}
      >
        {barberModal && (
          <div className="space-y-4">
            {barberModal.bio && <p className="text-sm text-gray-600">{barberModal.bio}</p>}
            <p className="text-sm text-gray-500">
              Offers {barberModal.barber_services.length} services
            </p>
            {barberModal.buffer_mins > 0 && (
              <p className="text-sm text-gray-500">Buffer: {barberModal.buffer_mins} min</p>
            )}
            <Button className="w-full" onClick={() => { bookWithBarber(barberModal); setBarberModal(null) }}>
              Book with {barberModal.user.name.split(' ')[0]}
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
