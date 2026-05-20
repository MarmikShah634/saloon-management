import { api } from './client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  role: 'customer' | 'barber' | 'owner' | 'super_admin'
  status: string
}

export interface Saloon {
  id: string
  slug: string
  name: string
  city: string
  address: string
  phone: string | null
  timezone: string
  status: string
  photos: string[] | null
  services?: Service[]
}

export interface Service {
  id: string
  saloon_id: string
  name: string
  duration_mins: number
  price: string
  is_active: boolean
}

export interface Barber {
  id: string
  user_id: string
  saloon_id: string
  bio: string | null
  buffer_mins: number
  barber_name?: string
  barber_services: { service_id: string }[]
}

export interface Booking {
  id: string
  customer_id: string
  barber_id: string
  saloon_id: string
  date: string
  start_at: string
  end_at: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  total_price: string
  customer_notes: string | null
  items: {
    service_name_snapshot: string
    duration_snapshot: number
    price_snapshot: string
  }[]
  saloon?: { name: string; timezone: string }
  created_at: string
}

export interface SlotOption {
  barber_id: string
  start_at: string
  end_at: string
  barber_name?: string
}

export interface WorkingHours {
  id: string
  barber_id: string
  weekday: number
  start_time: string
  end_time: string
}

export interface Notification {
  id: string
  kind: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  has_next: boolean
}

export interface AnalyticsOverview {
  total_bookings: number
  revenue: number
  active_barbers: number
  pending_bookings?: number
  completed_bookings?: number
  cancelled_bookings?: number
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface RegisterPayload {
  name: string
  email: string
  phone?: string
  password: string
}

export const authApi = {
  login(payload: LoginPayload) {
    return api.post<AuthResponse>('/api/v1/auth/login', payload)
  },
  register(payload: RegisterPayload) {
    return api.post<AuthResponse>('/api/v1/auth/register/customer', payload)
  },
  me() {
    return api.get<User>('/api/v1/auth/me')
  },
  logout() {
    return api.post<void>('/api/v1/auth/logout')
  },
  forgotPassword(email: string) {
    return api.post<void>('/api/v1/auth/forgot-password', { email })
  },
  resetPassword(token: string, newPassword: string) {
    return api.post<void>('/api/v1/auth/reset-password', {
      token,
      new_password: newPassword,
    })
  },
}

// ─── Saloons ─────────────────────────────────────────────────────────────────

export interface SaloonsQuery {
  city?: string
  q?: string
  page?: number
  size?: number
}

export const saloonsApi = {
  list(query: SaloonsQuery = {}) {
    const params = new URLSearchParams()
    if (query.city) params.set('city', query.city)
    if (query.q) params.set('q', query.q)
    if (query.page) params.set('page', String(query.page))
    if (query.size) params.set('size', String(query.size))
    const qs = params.toString()
    return api.get<PaginatedResponse<Saloon>>(`/api/v1/saloons${qs ? `?${qs}` : ''}`)
  },
  get(id: string) {
    return api.get<Saloon>(`/api/v1/saloons/${id}`)
  },
  getBarbers(id: string, size = 50) {
    return api.get<PaginatedResponse<Barber>>(`/api/v1/saloons/${id}/barbers?size=${size}`)
  },
  getServices(id: string, size = 100) {
    return api.get<PaginatedResponse<Service>>(`/api/v1/saloons/${id}/services?size=${size}`)
  },
  me() {
    return api.get<Saloon>('/api/v1/saloons/me')
  },
  update(id: string, data: Partial<Saloon>) {
    return api.patch<Saloon>(`/api/v1/saloons/${id}`, data)
  },
}

// ─── Slots ────────────────────────────────────────────────────────────────────

export const slotsApi = {
  specific(barberId: string, date: string, serviceIds: string[]) {
    const params = new URLSearchParams()
    params.set('barber_id', barberId)
    params.set('date', date)
    serviceIds.forEach((id) => params.append('service_ids', id))
    return api.get<SlotOption[]>(`/api/v1/slots/specific?${params.toString()}`)
  },
  any(saloonId: string, date: string, serviceIds: string[]) {
    const params = new URLSearchParams()
    params.set('saloon_id', saloonId)
    params.set('date', date)
    serviceIds.forEach((id) => params.append('service_ids', id))
    return api.get<SlotOption[]>(`/api/v1/slots/any?${params.toString()}`)
  },
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface CreateBookingPayload {
  saloon_id: string
  barber_id?: string
  date: string
  start_at: string
  service_ids: string[]
  customer_notes?: string
}

export interface BookingsQuery {
  page?: number
  size?: number
  status?: string
  barber_id?: string
  date_from?: string
  date_to?: string
}

export const bookingsApi = {
  create(payload: CreateBookingPayload) {
    return api.post<Booking>('/api/v1/bookings', payload)
  },
  listMine(query: BookingsQuery = {}) {
    const params = new URLSearchParams()
    if (query.page) params.set('page', String(query.page))
    if (query.size) params.set('size', String(query.size))
    if (query.status) params.set('status', query.status)
    const qs = params.toString()
    return api.get<PaginatedResponse<Booking>>(`/api/v1/bookings/me${qs ? `?${qs}` : ''}`)
  },
  list(query: BookingsQuery = {}) {
    const params = new URLSearchParams()
    if (query.barber_id) params.set('barber_id', query.barber_id)
    if (query.date_from) params.set('date_from', query.date_from)
    if (query.date_to) params.set('date_to', query.date_to)
    if (query.status) params.set('status', query.status)
    if (query.page) params.set('page', String(query.page))
    if (query.size) params.set('size', String(query.size))
    const qs = params.toString()
    return api.get<PaginatedResponse<Booking>>(`/api/v1/bookings${qs ? `?${qs}` : ''}`)
  },
  get(id: string) {
    return api.get<Booking>(`/api/v1/bookings/${id}`)
  },
  cancel(id: string, reason?: string) {
    return api.patch<Booking>(`/api/v1/bookings/${id}/cancel`, { reason })
  },
  updateStatus(id: string, status: string) {
    return api.patch<Booking>(`/api/v1/bookings/${id}/status`, { status })
  },
}

// ─── Barbers ──────────────────────────────────────────────────────────────────

export const barbersApi = {
  me() {
    return api.get<Barber>('/api/v1/barbers/me')
  },
  getSchedule(id: string) {
    return api.get<WorkingHours[]>(`/api/v1/barbers/${id}/schedule`)
  },
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationsQuery {
  unread_only?: boolean
  page?: number
  size?: number
}

export const notificationsApi = {
  list(query: NotificationsQuery = {}) {
    const params = new URLSearchParams()
    if (query.unread_only !== undefined) params.set('unread_only', String(query.unread_only))
    if (query.page) params.set('page', String(query.page))
    if (query.size) params.set('size', String(query.size))
    const qs = params.toString()
    return api.get<PaginatedResponse<Notification>>(`/api/v1/notifications${qs ? `?${qs}` : ''}`)
  },
  markAllRead() {
    return api.patch<void>('/api/v1/notifications/read-all')
  },
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsQuery {
  date_from?: string
  date_to?: string
}

export const analyticsApi = {
  ownerOverview(query: AnalyticsQuery = {}) {
    const params = new URLSearchParams()
    if (query.date_from) params.set('date_from', query.date_from)
    if (query.date_to) params.set('date_to', query.date_to)
    const qs = params.toString()
    return api.get<AnalyticsOverview>(`/api/v1/analytics/owner/overview${qs ? `?${qs}` : ''}`)
  },
}

// ─── Working Hours (alias for barbersApi.getSchedule) ─────────────────────────

export const workingHoursApi = {
  list(barberId: string) {
    if (barberId === 'me') {
      // For "me" endpoint, we need to get barber ID first from barbers/me
      // This is a simplified approach - callers should use barbersApi.me() + getSchedule()
      return api.get<WorkingHours[]>('/api/v1/barbers/me/schedule').catch(() => [] as WorkingHours[])
    }
    return barbersApi.getSchedule(barberId)
  },
}

// ─── Saloon (owner alias) ─────────────────────────────────────────────────────

export const saloonApi = {
  getOwner() {
    return saloonsApi.me()
  },
  get(id: string) {
    return saloonsApi.get(id)
  },
  update(id: string, data: Partial<Saloon>) {
    return saloonsApi.update(id, data)
  },
}
