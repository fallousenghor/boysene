import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data?.data !== undefined ? { ...res, data: res.data } : res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token')
        const res = await axios.post('/api/v1/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data || res.data
        useAuthStore.getState().setTokens(accessToken, newRefresh)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Helpers to read the backend response envelope consistently.
export function extractData<T>(value: any): T {
  return value?.data?.data ?? value?.data ?? value
}

export function extractList<T>(value: any): T[] {
  const data = extractData<any>(value)
  return Array.isArray(data) ? data : []
}

export function extractMeta(value: any) {
  return value?.data?.meta ?? value?.meta ?? {}
}

export function extractSummary(value: any) {
  return value?.data?.summary ?? value?.summary ?? {}
}
