export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
  has_next: boolean
}

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  role: 'customer' | 'barber' | 'owner' | 'super_admin'
  status: string
  created_at: string
}

export interface Saloon {
  id: string
  name: string
  slug: string
  address: string
  city: string
  neighborhood: string | null
  phone: string | null
  description: string | null
  photos: string[]
  timezone: string
  status: string
  default_open: string
  default_close: string
  is_open_now?: boolean
}

export interface Service {
  id: string
  saloon_id: string
  name: string
  category: string | null
  duration_mins: number
  price: string
  deposit_pct: number
  is_active: boolean
}

export interface Barber {
  id: string
  user_id: string
  saloon_id: string
  bio: string | null
  buffer_mins: number
  is_active: boolean
  user: { id: string; name: string; email: string }
  photo_url: string | null
  barber_services: Array<{ service_id: string }>
}

export interface BookingItem {
  id: string
  service_id: string
  service_name_snapshot: string
  start_at: string
  end_at: string
  price_snapshot: string
  duration_snapshot: number
  order_index: number
}

export interface Booking {
  id: string
  customer_id: string
  barber_id: string
  saloon_id: string
  date: string
  start_at: string
  end_at: string
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'pending_payment'
  total_price: string
  deposit_amount: string
  deposit_paid: boolean
  assigned_type: 'specific' | 'any'
  customer_notes: string | null
  cancellation_reason: string | null
  cancelled_by: string | null
  items: BookingItem[]
  saloon?: Saloon
  barber?: Barber
  created_at: string
  updated_at: string
}

export interface SlotOption {
  barber_id: string
  barber_name: string
  start_at: string
  end_at: string
  duration_mins: number
}

export interface Notification {
  id: string
  user_id: string
  kind: string
  title: string
  body: string
  is_read: boolean
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  user: User
}
