import { api } from './client'

export interface User { id: string; email: string; name: string; phone: string | null; role: string; status: string }
export interface TokenPair { access_token: string; refresh_token: string; user: User }
export interface Page<T> { items: T[]; total: number; page: number; size: number; has_next: boolean }
export interface SaloonWorkingHours { weekday: number; is_open: boolean; open_time: string | null; close_time: string | null }
export interface Saloon { id: string; name: string; slug: string; address: string; city: string; photos: string[]; timezone: string; status: string; description: string | null; phone: string | null; instagram_handle: string | null; default_open: string; default_close: string; working_hours?: SaloonWorkingHours[] }
export interface Service { id: string; saloon_id: string; name: string; category: string | null; duration_mins: number; price: string; deposit_pct: number; is_active: boolean }
export interface Barber { id: string; user_id: string; saloon_id: string; bio: string | null; buffer_mins: number; is_active: boolean; user: { id: string; name: string; email: string }; barber_services: Array<{ service_id: string }> }
export interface Booking {
  id: string; customer_id: string; barber_id: string; saloon_id: string; date: string; start_at: string; end_at: string; status: string; total_price: string; customer_notes: string | null
  items: Array<{ id: string; service_name_snapshot: string; price_snapshot: string; duration_snapshot: number }>
  customer?: { id: string; name: string; phone: string | null }
  barber?: { id: string; user: { name: string } }
  created_at: string; updated_at: string
}
export interface AnalyticsSummary { total_bookings: number; completed_bookings: number; cancelled_bookings: number; revenue: string; avg_booking_value: string }
export interface Notification { id: string; kind: string; title: string; body: string; is_read: boolean; created_at: string }

export const authApi = {
  login: (email: string, password: string) => api.post<TokenPair>('/api/v1/auth/login', { email, password }),
  logout: () => api.post<void>('/api/v1/auth/logout'),
  me: () => api.get<User>('/api/v1/auth/me'),
}

export const saloonApi = {
  getMine: (ownerSaloonId: string) => api.get<Saloon>(`/api/v1/saloons/${ownerSaloonId}`),
  get: (id: string) => api.get<Saloon>(`/api/v1/saloons/${id}`),
  update: (id: string, payload: Partial<Saloon>) => api.patch<Saloon>(`/api/v1/saloons/${id}`, payload),
  updateHours: (id: string, hours: SaloonWorkingHours[]) => api.put<void>(`/api/v1/saloons/${id}/hours`, { hours }),
}

export const serviceApi = {
  list: (saloonId: string) => api.get<Page<Service>>(`/api/v1/saloons/${saloonId}/services?size=100`),
  create: (saloonId: string, payload: { name: string; duration_mins: number; price: number; category?: string; deposit_pct?: number }) =>
    api.post<Service>(`/api/v1/saloons/${saloonId}/services`, payload),
  update: (serviceId: string, payload: Partial<Service>) => api.patch<Service>(`/api/v1/services/${serviceId}`, payload),
  delete: (serviceId: string) => api.delete<void>(`/api/v1/services/${serviceId}`),
}

export const barberApi = {
  list: (saloonId: string) => api.get<Page<Barber>>(`/api/v1/saloons/${saloonId}/barbers?size=50`),
  invite: (saloonId: string, payload: { name: string; email: string; phone?: string }) =>
    api.post<Barber>(`/api/v1/saloons/${saloonId}/barbers`, payload),
  update: (barberId: string, payload: { bio?: string; buffer_mins?: number; is_active?: boolean }) =>
    api.patch<Barber>(`/api/v1/barbers/${barberId}`, payload),
}

export const bookingApi = {
  list: (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)))
    return api.get<Page<Booking>>(`/api/v1/bookings?${q}`)
  },
  get: (id: string) => api.get<Booking>(`/api/v1/bookings/${id}`),
  cancel: (id: string, reason?: string) => api.patch<Booking>(`/api/v1/bookings/${id}/cancel`, { reason }),
  updateStatus: (id: string, status: string) => api.patch<Booking>(`/api/v1/bookings/${id}/status`, { status }),
}

export const analyticsApi = {
  summary: (saloonId: string, params: { date_from?: string; date_to?: string }) => {
    const q = new URLSearchParams({ saloon_id: saloonId })
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    return api.get<AnalyticsSummary>(`/api/v1/analytics/summary?${q}`)
  },
}

export const notificationApi = {
  list: (params: { page?: number; size?: number }) => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), size: String(params.size ?? 20) })
    return api.get<Page<Notification>>(`/api/v1/notifications?${q}`)
  },
  markAllRead: () => api.post<void>('/api/v1/notifications/read-all'),
}

export const userApi = {
  updateMe: (payload: { name?: string; phone?: string }) => api.patch<User>('/api/v1/users/me', payload),
  changePassword: (current_password: string, new_password: string) => api.post<void>('/api/v1/users/me/password', { current_password, new_password }),
}
