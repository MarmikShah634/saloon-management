import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Check } from 'lucide-react'
import { addDays, format, parseISO } from 'date-fns'
import { saloonApi, slotApi, bookingApi } from '@/lib/api/endpoints'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useBookingStore } from '@/lib/stores/booking.store'
import { useAuthStore } from '@/lib/stores/auth.store'
import { formatPrice } from '@/lib/utils'
import { ApiError } from '@/lib/api/client'
import { useToast } from '@/components/ui/toast'
import type { Service, Barber, SlotOption } from '@/lib/api/types'

// ---- Step 1: Services ----
function StepServices({ onNext }: { onNext: () => void }) {
  const { draft, setServices } = useBookingStore()
  const [selected, setSelected] = useState<Service[]>(draft?.selectedServices ?? [])

  const { data: servicesData } = useQuery({
    queryKey: ['saloon-services', draft?.saloonId],
    queryFn: () => saloonApi.getServices(draft!.saloonId),
    enabled: !!draft?.saloonId,
  })

  function toggle(svc: Service) {
    setSelected(prev => prev.find(s => s.id === svc.id) ? prev.filter(s => s.id !== svc.id) : [...prev, svc])
  }

  const total = selected.reduce((s, svc) => s + parseFloat(svc.price), 0)
  const duration = selected.reduce((s, svc) => s + svc.duration_mins, 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose services</h2>
        {servicesData?.items.map(svc => (
          <div key={svc.id} className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="font-medium text-sm text-gray-900">{svc.name}</p>
              <p className="text-xs text-gray-500">{svc.duration_mins} min · {formatPrice(svc.price)}</p>
            </div>
            <button
              onClick={() => toggle(svc)}
              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected.find(s => s.id === svc.id)
                  ? 'bg-brand-600 border-brand-600'
                  : 'border-gray-300'
              }`}
              aria-label={svc.name}
            >
              {selected.find(s => s.id === svc.id) && <Check className="h-3 w-3 text-white" />}
            </button>
          </div>
        ))}
      </div>
      <div className="px-4 pt-4 border-t border-gray-100">
        {selected.length > 0 && (
          <p className="text-sm text-gray-500 mb-3">{duration} min · {formatPrice(total)}</p>
        )}
        <Button
          className="w-full"
          disabled={selected.length === 0}
          onClick={() => { setServices(selected); onNext() }}
        >
          Next: Choose barber
        </Button>
      </div>
    </div>
  )
}

// ---- Step 2: Barber ----
function StepBarber({ onNext }: { onNext: () => void }) {
  const { draft, setBarber } = useBookingStore()
  const [assignType, setAssignType] = useState<'any' | 'specific'>('any')
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)

  const { data: barbersData } = useQuery({
    queryKey: ['saloon-barbers', draft?.saloonId],
    queryFn: () => saloonApi.getBarbers(draft!.saloonId),
    enabled: !!draft?.saloonId,
  })

  const serviceIdSet = new Set(draft?.selectedServices.map(s => s.id) ?? [])
  const qualifiedBarbers = (barbersData?.items ?? []).filter(b =>
    serviceIdSet.size === 0 || [...serviceIdSet].every(sid => b.barber_services.find(bs => bs.service_id === sid))
  )

  function proceed() {
    if (assignType === 'any') {
      setBarber(null, null, 'any')
    } else if (selectedBarber) {
      setBarber(selectedBarber.id, selectedBarber.user.name, 'specific')
    }
    onNext()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a barber</h2>
        <div className="space-y-3 mb-6">
          {(['any', 'specific'] as const).map(type => (
            <button
              key={type}
              onClick={() => setAssignType(type)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                assignType === type ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white'
              }`}
            >
              <p className="font-medium text-sm text-gray-900">
                {type === 'any' ? 'Any available barber' : 'Choose a specific barber'}
              </p>
              {type === 'any' && (
                <p className="text-xs text-gray-500 mt-0.5">We'll match you with the next free chair.</p>
              )}
            </button>
          ))}
        </div>

        {assignType === 'specific' && (
          <div>
            {qualifiedBarbers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No barber offers all selected services. Try removing a service.
              </p>
            ) : (
              <div className="space-y-2">
                {qualifiedBarbers.map(barber => (
                  <button
                    key={barber.id}
                    onClick={() => setSelectedBarber(barber)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                      selectedBarber?.id === barber.id ? 'border-brand-600 bg-brand-50' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {barber.photo_url ? (
                        <img src={barber.photo_url} alt={barber.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                          {barber.user.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900">{barber.user.name}</p>
                      {barber.buffer_mins > 0 && (
                        <p className="text-xs text-gray-500">Buffer: {barber.buffer_mins} min</p>
                      )}
                    </div>
                    {selectedBarber?.id === barber.id && (
                      <Check className="h-4 w-4 text-brand-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="px-4 pt-4 border-t border-gray-100">
        <Button
          className="w-full"
          disabled={assignType === 'specific' && !selectedBarber}
          onClick={proceed}
        >
          Next: Pick a date
        </Button>
      </div>
    </div>
  )
}

// ---- Step 3: Date & Slot ----
function StepDateSlot({ onNext }: { onNext: () => void }) {
  const { draft, setSlot } = useBookingStore()
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null)
  const serviceIds = draft?.selectedServices.map(s => s.id) ?? []

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i)
    return { iso: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE'), day: format(d, 'd') }
  })

  const slotQueryEnabled = !!draft && serviceIds.length > 0 && !!selectedDate
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', draft?.barberId, draft?.assignType, selectedDate, serviceIds],
    queryFn: () => {
      if (!draft) throw new Error('No draft')
      if (draft.assignType === 'specific' && draft.barberId) {
        return slotApi.forBarber({ barber_id: draft.barberId, date: selectedDate, service_ids: serviceIds })
      }
      return slotApi.forAny({ saloon_id: draft.saloonId, date: selectedDate, service_ids: serviceIds })
    },
    enabled: slotQueryEnabled,
  })

  function groupSlots(slots: SlotOption[]) {
    const morning: SlotOption[] = [], afternoon: SlotOption[] = [], evening: SlotOption[] = []
    slots.forEach(s => {
      const hour = parseISO(s.start_at).getUTCHours()
      if (hour < 12) morning.push(s)
      else if (hour < 17) afternoon.push(s)
      else evening.push(s)
    })
    return [
      { label: 'Morning', slots: morning },
      { label: 'Afternoon', slots: afternoon },
      { label: 'Evening', slots: evening },
    ].filter(g => g.slots.length > 0)
  }

  const grouped = groupSlots(slots ?? [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Date strip */}
        <div className="flex gap-2 px-4 overflow-x-auto pb-3 pt-2">
          {dates.map(d => (
            <button
              key={d.iso}
              onClick={() => { setSelectedDate(d.iso); setSelectedSlot(null) }}
              className={`flex-shrink-0 flex flex-col items-center w-12 py-2 rounded-xl text-xs font-medium transition-colors ${
                selectedDate === d.iso
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-300'
              }`}
            >
              <span className="text-[10px] uppercase">{d.label}</span>
              <span className="text-base font-semibold">{d.day}</span>
            </button>
          ))}
        </div>

        <div className="px-4">
          {slotsLoading && (
            <div className="flex flex-wrap gap-2 py-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 w-20 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {!slotsLoading && slots?.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">
              No slots available on this day
            </p>
          )}

          {grouped.map(group => (
            <div key={group.label} className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.slots.map(slot => (
                  <button
                    key={slot.start_at}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      selectedSlot?.start_at === slot.start_at
                        ? 'bg-brand-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-300'
                    }`}
                  >
                    <div>{format(parseISO(slot.start_at), 'h:mm a')}</div>
                    {draft?.assignType === 'any' && slot.barber_name && (
                      <div className="text-[10px] opacity-75">with {slot.barber_name.split(' ')[0]}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400 mt-4">All times shown in saloon's local time</p>
        </div>
      </div>

      <div className="px-4 pt-4 border-t border-gray-100">
        <Button
          className="w-full"
          disabled={!selectedSlot}
          onClick={() => {
            if (selectedSlot) {
              setSlot(selectedDate, selectedSlot.start_at)
              onNext()
            }
          }}
        >
          Next: Review
        </Button>
      </div>
    </div>
  )
}

// ---- Step 4: Review & Confirm ----
function StepReview({ onSuccess }: { onSuccess: (bookingId: string) => void }) {
  const { draft, setNotes, clearDraft } = useBookingStore()
  const { user } = useAuthStore()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [slotConflict, setSlotConflict] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => {
      if (!draft?.selectedSlotStart || !draft.selectedDate) throw new Error('Missing slot')
      return bookingApi.create({
        saloon_id: draft.saloonId,
        barber_id: draft.barberId ?? undefined,
        date: draft.selectedDate,
        start_at: draft.selectedSlotStart,
        service_ids: draft.selectedServices.map(s => s.id),
        customer_notes: draft.customerNotes || undefined,
      })
    },
    onSuccess: (booking) => {
      clearDraft()
      onSuccess(booking.id)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setSlotConflict(true)
      } else {
        toast({ type: 'error', title: 'Booking failed', description: err instanceof Error ? err.message : 'Please try again' })
      }
    },
  })

  function submit() {
    if (!user) { setShowLoginModal(true); return }
    mutation.mutate()
  }

  if (!draft) return null

  const totalPrice = draft.selectedServices.reduce((s, svc) => s + parseFloat(svc.price), 0)
  const depositAmount = totalPrice * 0.2

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Review your booking</h2>

        {/* Summary card */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <div>
            <p className="font-semibold text-gray-900">{draft.saloonName}</p>
            {draft.selectedDate && draft.selectedSlotStart && (
              <p className="text-sm text-gray-600 mt-0.5">
                {format(parseISO(draft.selectedDate), 'EEEE, d MMMM')} at{' '}
                {format(parseISO(draft.selectedSlotStart), 'h:mm a')}
              </p>
            )}
          </div>

          {draft.barberName && (
            <p className="text-sm text-gray-600">with {draft.barberName}</p>
          )}

          <div className="border-t border-gray-200 pt-3 space-y-2">
            {draft.selectedServices.map(svc => (
              <div key={svc.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{svc.name}</span>
                <span className="text-gray-900 font-medium">{formatPrice(svc.price)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Deposit (online — coming soon)</span>
              <span>{formatPrice(depositAmount.toFixed(2))}</span>
            </div>
          </div>
        </div>

        <Textarea
          label="Add a note for the barber (optional)"
          placeholder="e.g. I'd like a fade on the sides..."
          value={draft.customerNotes}
          onChange={(e) => setNotes(e.target.value)}
          className="text-sm"
        />

        <p className="text-xs text-gray-500">
          Free to cancel up to 2 hours before your appointment.
        </p>
      </div>

      <div className="px-4 pt-4 border-t border-gray-100">
        <Button className="w-full" loading={mutation.isPending} onClick={submit} size="lg">
          Confirm booking
        </Button>
      </div>

      {/* Slot conflict modal */}
      <Modal
        open={slotConflict}
        onClose={() => setSlotConflict(false)}
        title="Slot taken"
        description="This slot just got booked by someone else. Pick another time?"
      >
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setSlotConflict(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => { setSlotConflict(false); navigate(-1) }}
          >
            Pick another time
          </Button>
        </div>
      </Modal>

      {/* Login interception */}
      <Modal open={showLoginModal} onClose={() => setShowLoginModal(false)} title="Sign in to confirm">
        <p className="text-sm text-gray-500 mb-4">You need to be signed in to complete this booking.</p>
        <Button
          className="w-full"
          onClick={() => navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
        >
          Sign in
        </Button>
        <Button
          variant="ghost"
          className="w-full mt-2"
          onClick={() => navigate(`/auth/register?redirect=${encodeURIComponent(window.location.pathname)}`)}
        >
          Create account
        </Button>
      </Modal>
    </div>
  )
}

// ---- Main flow ----
export function BookingFlowPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { step, setStep, draft, initDraft, restoreDraft } = useBookingStore()

  useEffect(() => {
    restoreDraft()
  }, [restoreDraft])

  const { data: saloon } = useQuery({
    queryKey: ['saloon', slug],
    queryFn: () => saloonApi.get(slug!),
    enabled: !!slug,
  })

  useEffect(() => {
    if (saloon && (!draft || draft.saloonId !== saloon.id)) {
      initDraft(saloon.id, saloon.slug, saloon.name, saloon.timezone)
    }
  }, [saloon, draft, initDraft])

  const stepTitles = ['Services', 'Barber', 'Date & time', 'Review']
  const totalSteps = 4

  function goBack() {
    if (step === 1) navigate(`/saloons/${slug}`)
    else setStep((step - 1) as 1 | 2 | 3 | 4)
  }

  return (
    <div className="max-w-screen-sm mx-auto flex flex-col" style={{ height: 'calc(100dvh - 56px)' }}>
      {/* Top header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <button
          onClick={goBack}
          className="p-1 rounded-lg hover:bg-gray-100"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{stepTitles[step - 1]}</p>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-brand-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-gray-400">{step}/{totalSteps}</span>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {step === 1 && <StepServices onNext={() => setStep(2)} />}
        {step === 2 && <StepBarber onNext={() => setStep(3)} />}
        {step === 3 && <StepDateSlot onNext={() => setStep(4)} />}
        {step === 4 && (
          <StepReview
            onSuccess={(id) => navigate(`/account/bookings/${id}?just_booked=true`)}
          />
        )}
      </div>
    </div>
  )
}
