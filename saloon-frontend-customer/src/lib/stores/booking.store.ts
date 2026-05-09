import { create } from 'zustand'
import type { Service } from '@/lib/api/types'

export type BookingStep = 1 | 2 | 3 | 4

export interface BookingDraft {
  saloonId: string
  saloonSlug: string
  saloonName: string
  saloonTimezone: string
  selectedServices: Service[]
  barberId: string | null
  barberName: string | null
  assignType: 'any' | 'specific'
  selectedDate: string | null  // ISO date string
  selectedSlotStart: string | null  // ISO datetime
  customerNotes: string
}

const DRAFT_KEY = 'bookingDraft'

function saveDraft(draft: BookingDraft | null) {
  if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  else sessionStorage.removeItem(DRAFT_KEY)
}

function loadDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as BookingDraft) : null
  } catch {
    return null
  }
}

interface BookingFlowState {
  step: BookingStep
  draft: BookingDraft | null
  setStep: (step: BookingStep) => void
  initDraft: (saloonId: string, saloonSlug: string, saloonName: string, saloonTimezone: string) => void
  setServices: (services: Service[]) => void
  setBarber: (barberId: string | null, barberName: string | null, assignType: 'any' | 'specific') => void
  setSlot: (date: string, slotStart: string) => void
  setNotes: (notes: string) => void
  restoreDraft: () => void
  clearDraft: () => void
}

export const useBookingStore = create<BookingFlowState>((set, get) => ({
  step: 1,
  draft: null,

  setStep: (step) => set({ step }),

  initDraft: (saloonId, saloonSlug, saloonName, saloonTimezone) => {
    const existing = get().draft
    if (existing?.saloonId === saloonId) return
    const draft: BookingDraft = {
      saloonId,
      saloonSlug,
      saloonName,
      saloonTimezone,
      selectedServices: [],
      barberId: null,
      barberName: null,
      assignType: 'any',
      selectedDate: null,
      selectedSlotStart: null,
      customerNotes: '',
    }
    saveDraft(draft)
    set({ draft, step: 1 })
  },

  setServices: (selectedServices) =>
    set((s) => {
      const draft = { ...s.draft!, selectedServices }
      saveDraft(draft)
      return { draft }
    }),

  setBarber: (barberId, barberName, assignType) =>
    set((s) => {
      const draft = { ...s.draft!, barberId, barberName, assignType }
      saveDraft(draft)
      return { draft }
    }),

  setSlot: (selectedDate, selectedSlotStart) =>
    set((s) => {
      const draft = { ...s.draft!, selectedDate, selectedSlotStart }
      saveDraft(draft)
      return { draft }
    }),

  setNotes: (customerNotes) =>
    set((s) => {
      const draft = { ...s.draft!, customerNotes }
      saveDraft(draft)
      return { draft }
    }),

  restoreDraft: () => {
    const draft = loadDraft()
    if (draft) set({ draft })
  },

  clearDraft: () => {
    saveDraft(null)
    set({ draft: null, step: 1 })
  },
}))
