import { api } from './client'

export interface User { id: string; email: string; name: string; phone: string | null; role: string; status: string }
export interface TokenPair { access_token: string; refresh_token: string; user: User }
export interface Booking {
  id: string; customer_id: string; barber_id: string; saloon_id: string
  date: string; start_at: string; end_at: string; status: string
  total_price: string; customer_notes: string | null
  items: Array<{ id: string; service_name_snapshot: string; duration_snapshot: number; price_snapshot: string }>
  customer?: { id: string; name: string; phone: string | null }
  saloon?: { name: string; timezone: string }
  created_at: string; updated_at: string
}
export interface Service {
  id: string; saloon_id: string; name: string; duration_mins: number; price: string; is_active: boolean
}
export interface WorkingHours {
  id: string; barber_id: string; weekday: number; start_time: string; end_time: string
}
export interface TimeOff {
  id: string; barber_id: string; start_at: string; end_at: string; reason: string | null
}
export interface Notification {
  id: string; kind: string; title: string; body: string; is_read: boolean; created_at: string
}
export interface Page<T> { items: T[]; total: number; page: number; size: number; has_next: boolean }
export interface Barber { id: string; user_id: string; saloon_id: string; bio: string | null; buffer_mins: number; barber_services: Array<{ service_id: string }> }

export const authApi = {
  login: (email: string, password: string) => api.post<TokenPair>('/api/v1/auth/login', { email, password }),
  logout: () => api.post<void>('/api/v1/auth/logout'),
  me: () => api.get<User>('/api/v1/auth/me'),
  forgotPassword: (email: string) => api.post<void>('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) => api.post<void>('/api/v1/auth/reset-password', { token, new_password }),
  changePassword: (old_password: string, new_password: string) =>
    api.post<void>('/api/v1/auth/change-password', { old_password, new_password }),
}

export const bookingApi = {
  list: (params: { barber_id?: string; date_from?: string; date_to?: string; status?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)))
    return api.get<Page<Booking>>(`/api/v1/bookings?${q}`)
  },
  get: (id: string) => api.get<Booking>(`/api/v1/bookings/${id}`),
  updateStatus: (id: string, status: string) => api.patch<Booking>(`/api/v1/bookings/${id}/status`, { status }),
  cancel: (id: string, reason?: string) => api.patch<Booking>(`/api/v1/bookings/${id}/cancel`, { reason }),
}

export const barberApi = {
  getMe: () => api.get<Barber>('/api/v1/barbers/me'),
  updateProfile: (id: string, payload: { bio?: string; buffer_mins?: number }) =>
    api.patch<Barber>(`/api/v1/barbers/${id}`, payload),
  getServices: (id: string) => api.get<Page<Service>>(`/api/v1/saloons/me/services?size=100`),
  assignService: (barberId: string, serviceId: string) =>
    api.post<void>(`/api/v1/barbers/${barberId}/services/${serviceId}`),
  removeService: (barberId: string, serviceId: string) =>
    api.delete<void>(`/api/v1/barbers/${barberId}/services/${serviceId}`),
}

export const workingHoursApi = {
  list: (barberId: string) => api.get<WorkingHours[]>(`/api/v1/barbers/${barberId}/schedule`),
  set: (barberId: string, hours: Array<{ weekday: number; start_time: string; end_time: string }>) =>
    api.put<WorkingHours[]>(`/api/v1/barbers/${barberId}/schedule`, { hours }),
}

export const timeOffApi = {
  list: (barberId: string) => {
    const q = new URLSearchParams({ barber_id: barberId, page: '1', size: '50' })
    return api.get<Page<TimeOff>>(`/api/v1/time-off?${q}`)
  },
  create: (payload: { barber_id: string; start_at: string; end_at: string; reason?: string }) =>
    api.post<TimeOff>('/api/v1/time-off', payload),
  delete: (id: string) => api.delete<void>(`/api/v1/time-off/${id}`),
}

export const notificationApi = {
  list: (params: { unread_only?: boolean; page?: number; size?: number }) => {
    const q = new URLSearchParams()
    if (params.unread_only) q.set('unread_only', 'true')
    q.set('page', String(params.page ?? 1))
    q.set('size', String(params.size ?? 20))
    return api.get<Page<Notification>>(`/api/v1/notifications?${q}`)
  },
  markRead: (id: string) => api.post<Notification>(`/api/v1/notifications/${id}/read`),
  markAllRead: () => api.post<void>('/api/v1/notifications/read-all'),
}

export const userApi = {
  updateMe: (payload: { name?: string; phone?: string }) => api.patch<User>('/api/v1/users/me', payload),
}
