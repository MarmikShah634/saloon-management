import { api } from './client'
import type {
  Barber, Booking, Notification, Page, Saloon, Service, SlotOption, TokenPair, User,
} from './types'

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenPair>('/api/v1/auth/login', { email, password }),
  register: (payload: { name: string; email: string; phone?: string; password: string }) =>
    api.post<TokenPair>('/api/v1/auth/register/customer', payload),
  logout: () => api.post<void>('/api/v1/auth/logout'),
  me: () => api.get<User>('/api/v1/auth/me'),
  forgotPassword: (email: string) =>
    api.post<void>('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post<void>('/api/v1/auth/reset-password', { token, new_password }),
  changePassword: (old_password: string, new_password: string) =>
    api.post<void>('/api/v1/auth/change-password', { old_password, new_password }),
}

// Users
export const userApi = {
  getMe: () => api.get<User>('/api/v1/users/me'),
  updateMe: (payload: { name?: string; phone?: string }) =>
    api.patch<User>('/api/v1/users/me', payload),
}

// Saloons
export const saloonApi = {
  list: (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)) })
    return api.get<Page<Saloon>>(`/api/v1/saloons?${q}`)
  },
  get: (idOrSlug: string) => api.get<Saloon>(`/api/v1/saloons/${idOrSlug}`),
  getBarbers: (saloonId: string) =>
    api.get<Page<Barber>>(`/api/v1/saloons/${saloonId}/barbers?size=50`),
  getServices: (saloonId: string) =>
    api.get<Page<Service>>(`/api/v1/saloons/${saloonId}/services?size=100`),
}

// Slots
export const slotApi = {
  forBarber: (params: { barber_id: string; date: string; service_ids: string[] }) => {
    const q = new URLSearchParams({ barber_id: params.barber_id, date: params.date })
    params.service_ids.forEach(id => q.append('service_ids', id))
    return api.get<SlotOption[]>(`/api/v1/slots/specific?${q}`)
  },
  forAny: (params: { saloon_id: string; date: string; service_ids: string[] }) => {
    const q = new URLSearchParams({ saloon_id: params.saloon_id, date: params.date })
    params.service_ids.forEach(id => q.append('service_ids', id))
    return api.get<SlotOption[]>(`/api/v1/slots/any?${q}`)
  },
}

// Bookings
export const bookingApi = {
  create: (payload: {
    saloon_id: string
    barber_id?: string
    date: string
    start_at: string
    service_ids: string[]
    customer_notes?: string
  }) => api.post<Booking>('/api/v1/bookings', payload),
  listMine: (params: { status?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    q.set('page', String(params.page ?? 1))
    q.set('size', String(params.size ?? 20))
    return api.get<Page<Booking>>(`/api/v1/bookings/me?${q}`)
  },
  get: (id: string) => api.get<Booking>(`/api/v1/bookings/${id}`),
  cancel: (id: string, reason?: string) =>
    api.patch<Booking>(`/api/v1/bookings/${id}/cancel`, { reason }),
}

// Notifications
export const notificationApi = {
  list: (params: { unread_only?: boolean; page?: number; size?: number }) => {
    const q = new URLSearchParams()
    if (params.unread_only) q.set('unread_only', 'true')
    q.set('page', String(params.page ?? 1))
    q.set('size', String(params.size ?? 20))
    return api.get<Page<Notification>>(`/api/v1/notifications?${q}`)
  },
  markRead: (id: string) =>
    api.post<Notification>(`/api/v1/notifications/${id}/read`),
  markAllRead: () => api.post<void>('/api/v1/notifications/read-all'),
}
