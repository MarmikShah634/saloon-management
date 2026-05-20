import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken)
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
}

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      await clearTokens()
      return null
    }

    const data = await response.json()
    if (data.access_token && data.refresh_token) {
      await setTokens(data.access_token, data.refresh_token)
      return data.access_token
    }
    await clearTokens()
    return null
  } catch {
    await clearTokens()
    return null
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  const accessToken = await getAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && !retried) {
    if (isRefreshing) {
      // Wait for refresh to complete
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push(async (newToken: string) => {
          try {
            const retryHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
            }
            const retryResponse = await fetch(url, {
              method,
              headers: retryHeaders,
              body: body !== undefined ? JSON.stringify(body) : undefined,
            })
            if (!retryResponse.ok) {
              const errData = await retryResponse.json().catch(() => ({}))
              reject(new ApiError(retryResponse.status, errData.detail ?? 'Request failed'))
            } else {
              if (retryResponse.status === 204) {
                resolve(undefined as unknown as T)
              } else {
                resolve(retryResponse.json() as Promise<T>)
              }
            }
          } catch (err) {
            reject(err)
          }
        })
      })
    }

    isRefreshing = true
    const newToken = await refreshAccessToken()
    isRefreshing = false

    if (!newToken) {
      throw new ApiError(401, 'Session expired. Please log in again.')
    }

    onRefreshed(newToken)
    return request<T>(method, path, body, true)
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, errData.detail ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail)
    this.name = 'ApiError'
  }
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path)
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, body)
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PATCH', path, body)
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PUT', path, body)
  },
  delete<T>(path: string): Promise<T> {
    return request<T>('DELETE', path)
  },
}
