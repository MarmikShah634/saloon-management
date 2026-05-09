import { api } from './client'

export interface User {
  id: string; email: string; name: string; phone: string | null; role: string; status: string; created_at: string
}
export interface TokenPair { access_token: string; refresh_token: string; user: User }
export interface Page<T> { items: T[]; total: number; page: number; size: number; has_next: boolean }

export interface Saloon {
  id: string; name: string; slug: string; address: string; city: string; photos: string[]
  timezone: string; status: string; description: string | null; phone: string | null
  owner_id: string; created_at: string; updated_at: string
  owner?: { id: string; name: string; email: string }
  barbers_count?: number; services_count?: number; bookings_count?: number; gmv?: string
}

export interface Service {
  id: string; saloon_id: string; name: string; category: string | null
  duration_mins: number; price: string; deposit_pct: number; is_active: boolean
}

export interface Barber {
  id: string; user_id: string; saloon_id: string; bio: string | null; buffer_mins: number; is_active: boolean
  user: { id: string; name: string; email: string; phone: string | null }
  saloon?: { id: string; name: string }
  barber_services: Array<{ service_id: string }>
  bookings_count?: number; cancel_rate?: number
}

export interface Booking {
  id: string; customer_id: string; barber_id: string; saloon_id: string; status: string
  start_at: string; end_at: string; total_price: string; customer_notes: string | null
  items: Array<{ id: string; service_name_snapshot: string; price_snapshot: string; duration_snapshot: number }>
  customer?: { id: string; name: string; email: string; phone: string | null }
  barber?: { id: string; user: { name: string; email: string } }
  saloon?: { id: string; name: string }
  created_at: string; updated_at: string
}

export interface AuditEntry {
  id: string; actor_id: string | null; actor_role: string | null; action: string
  entity_type: string; entity_id: string | null
  before: Record<string, unknown> | null; after: Record<string, unknown> | null
  created_at: string
  actor?: { id: string; name: string; email: string; role: string }
}

export interface Notification {
  id: string; kind: string; title: string; body: string; is_read: boolean; created_at: string
}

export interface OverviewStats {
  total_saloons: number; active_saloons: number; pending_saloons: number; inactive_saloons: number
  total_owners: number; total_barbers: number; total_customers: number
  bookings_today: number; bookings_this_month: number
  gmv_today: string; gmv_this_month: string
}

export interface DailyMetric { date: string; value: number }
export interface DailyRevenue { date: string; value: string }
export interface SignupMetric { date: string; customers: number; barbers: number; owners: number }

export interface AnalyticsOverview {
  stats: OverviewStats
  bookings_per_day: DailyMetric[]
  gmv_per_day: DailyRevenue[]
  signups_per_day: SignupMetric[]
  top_saloons_by_gmv: Array<{ saloon_id: string; name: string; gmv: string }>
  top_saloons_by_volume: Array<{ saloon_id: string; name: string; bookings: number }>
  high_cancel_rate: Array<{ saloon_id: string; name: string; cancel_rate: number }>
  pending_saloons: Saloon[]
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post<TokenPair>('/api/v1/auth/login', { email, password }),
  logout: () => api.post<void>('/api/v1/auth/logout'),
  me: () => api.get<User>('/api/v1/auth/me'),
  forgotPassword: (email: string) => api.post<void>('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) => api.post<void>('/api/v1/auth/reset-password', { token, new_password }),
}

// ── Users ─────────────────────────────────────────────────────────────────────
function buildQ(params: Record<string, string | number | boolean | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)))
  return q.toString()
}

export const userApi = {
  list: (params: { role?: string; status?: string; q?: string; page?: number; size?: number }) =>
    api.get<Page<User>>(`/api/v1/users?${buildQ(params)}`),
  get: (id: string) => api.get<User>(`/api/v1/users/${id}`),
  updateStatus: (id: string, status: string) => api.patch<User>(`/api/v1/users/${id}/status`, { status }),
  updateMe: (payload: { name?: string; phone?: string }) => api.patch<User>('/api/v1/users/me', payload),
  changePassword: (current_password: string, new_password: string) =>
    api.post<void>('/api/v1/users/me/password', { current_password, new_password }),
  resetPassword: (id: string) => api.post<void>(`/api/v1/admin/users/${id}/reset-password`),
  resendInvite: (id: string) => api.post<void>(`/api/v1/admin/users/${id}/resend-invite`),
}

// ── Saloons ───────────────────────────────────────────────────────────────────
export const saloonApi = {
  list: (params: { status?: string; city?: string; q?: string; sort?: string; page?: number; size?: number }) =>
    api.get<Page<Saloon>>(`/api/v1/admin/saloons?${buildQ(params)}`),
  get: (id: string) => api.get<Saloon>(`/api/v1/saloons/${id}`),
  create: (payload: { name: string; address: string; city: string; timezone: string; owner_id: string; status?: string }) =>
    api.post<Saloon>('/api/v1/admin/saloons', payload),
  update: (id: string, payload: Partial<Saloon>) => api.patch<Saloon>(`/api/v1/saloons/${id}`, payload),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch<Saloon>(`/api/v1/saloons/${id}/status`, { status, reason }),
  transferOwner: (id: string, new_owner_id: string) =>
    api.post<Saloon>(`/api/v1/admin/saloons/${id}/transfer`, { new_owner_id }),
  services: (id: string) => api.get<Page<Service>>(`/api/v1/saloons/${id}/services?size=100`),
  barbers: (id: string) => api.get<Page<Barber>>(`/api/v1/saloons/${id}/barbers?size=100`),
}

export const ownerApi = {
  create: (payload: { name: string; email: string; phone?: string }) =>
    api.post<User>('/api/v1/admin/owners', payload),
}

// ── Barbers ───────────────────────────────────────────────────────────────────
export const barberApi = {
  list: (params: { saloon_id?: string; q?: string; status?: string; page?: number; size?: number }) =>
    api.get<Page<Barber>>(`/api/v1/admin/barbers?${buildQ(params)}`),
  get: (id: string) => api.get<Barber>(`/api/v1/barbers/${id}`),
  update: (id: string, payload: { is_active?: boolean }) => api.patch<Barber>(`/api/v1/barbers/${id}`, payload),
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingApi = {
  list: (params: { saloon_id?: string; barber_id?: string; customer_id?: string; status?: string; date_from?: string; date_to?: string; q?: string; page?: number; size?: number }) =>
    api.get<Page<Booking>>(`/api/v1/bookings?${buildQ(params)}`),
  get: (id: string) => api.get<Booking>(`/api/v1/bookings/${id}`),
  cancel: (id: string, reason?: string) => api.patch<Booking>(`/api/v1/bookings/${id}/cancel`, { reason }),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch<Booking>(`/api/v1/bookings/${id}/status`, { status, ...(reason ? { reason } : {}) }),
}

// ── Audit log ─────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params: { actor_id?: string; action?: string; entity_type?: string; entity_id?: string; date_from?: string; date_to?: string; page?: number; size?: number }) =>
    api.get<Page<AuditEntry>>(`/api/v1/admin/audit-log?${buildQ(params)}`),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  overview: (params: { date_from?: string; date_to?: string }) =>
    api.get<AnalyticsOverview>(`/api/v1/analytics/super-admin/overview?${buildQ(params)}`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationApi = {
  list: (params: { page?: number; size?: number }) =>
    api.get<Page<Notification>>(`/api/v1/notifications?${buildQ(params)}`),
  markAllRead: () => api.post<void>('/api/v1/notifications/read-all'),
}
