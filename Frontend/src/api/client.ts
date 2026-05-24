import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// In production (Vercel) VITE_API_URL is set to the Render backend URL.
// In development it's empty — Vite proxy handles routing to localhost backend.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Token helpers ─────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess:   ()    => sessionStorage.getItem('accessToken'),
  setAccess:   (t: string) => sessionStorage.setItem('accessToken', t),
  getRefresh:  ()    => localStorage.getItem('refreshToken'),
  setRefresh:  (t: string) => localStorage.setItem('refreshToken', t),
  getRole:     ()    => localStorage.getItem('userRole'),
  setRole:     (r: string) => localStorage.setItem('userRole', r),
  clearAll:    ()    => {
    sessionStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userRole')
  },
}

// ── Request interceptor — attach access token ─────────────────────────────
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — auto-refresh on 401 ───────────────────────────
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const drainQueue = (err: unknown, token?: string) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    err ? reject(err) : resolve(token!)
  )
  pendingQueue = []
}

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const refreshToken = tokenStorage.getRefresh()
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await client.post('/auth/refresh', { refreshToken })
        tokenStorage.setAccess(data.accessToken)
        tokenStorage.setRefresh(data.refreshToken)
        if (data.role) tokenStorage.setRole(data.role)
        drainQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return client(original)
      } catch (refreshError) {
        drainQueue(refreshError)
        tokenStorage.clearAll()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message
  }
  return String(error)
}
