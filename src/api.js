import axios from 'axios'
import { API_CONFIG } from './config/api.config'

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  withCredentials: true,
  timeout: API_CONFIG.timeout,
})

const clearStoredAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('rememberMe')
}

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(window.atob(padded))
  } catch {
    return null
  }
}

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now()
}

const isPublicGuestFlow = (url = '') => {
  const normalizedUrl = String(url)
  return [
    '/events/public',
    '/approved-services',
    '/service-bookings/verify-email',
    '/service-bookings',
  ].some((path) => normalizedUrl.includes(path)) || /\/events\/[^/]+\/attend/.test(normalizedUrl)
}

// Request interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && isTokenExpired(token)) {
      clearStoredAuth()
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Handle 401 errors and auth failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearStoredAuth()
      if (!isPublicGuestFlow(error.config?.url) && window.location.pathname !== '/signin') {
        window.location.href = '/signin'
      }
    }
    return Promise.reject(error)
  }
)

export default api
