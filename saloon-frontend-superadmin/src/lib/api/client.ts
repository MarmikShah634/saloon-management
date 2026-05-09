const API_BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message); this.name = 'ApiError'
  }
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('sa_access_token', access)
  localStorage.setItem('sa_refresh_token', refresh)
}
export function clearTokens() {
  localStorage.removeItem('sa_access_token')
  localStorage.removeItem('sa_refresh_token')
}
function getToken() { return localStorage.getItem('sa_access_token') }

let isRefreshing = false
let queue: Array<(t: string) => void> = []

async function refreshToken(): Promise<string> {
  const refresh = localStorage.getItem('sa_refresh_token')
  if (!refresh) throw new ApiError(401, 'No refresh token')
  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!res.ok) { clearTokens(); throw new ApiError(401, 'Session expired') }
  const data = await res.json() as { access_token: string; refresh_token: string }
  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Request-Id': crypto.randomUUID(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (res.status === 401 && !retried) {
    if (isRefreshing) return new Promise((resolve, reject) => {
      queue.push(t => request<T>(path, { ...init, headers: { ...headers, Authorization: `Bearer ${t}` } }, true).then(resolve).catch(reject))
    })
    isRefreshing = true
    try {
      const t = await refreshToken()
      queue.forEach(cb => cb(t)); queue = []; isRefreshing = false
      return request<T>(path, init, true)
    } catch (e) { queue = []; isRefreshing = false; throw e }
  }
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, (body as { detail?: string })?.detail ?? res.statusText, body)
  return body as T
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, b?: unknown) => request<T>(p, { method: 'POST', body: b !== undefined ? JSON.stringify(b) : undefined }),
  patch: <T>(p: string, b?: unknown) => request<T>(p, { method: 'PATCH', body: b !== undefined ? JSON.stringify(b) : undefined }),
  put: <T>(p: string, b?: unknown) => request<T>(p, { method: 'PUT', body: b !== undefined ? JSON.stringify(b) : undefined }),
  delete: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
}
