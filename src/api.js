import axios from 'axios'
import { API_CONFIG } from './config/api.config'

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  withCredentials: true,
  timeout: API_CONFIG.timeout,
})

// Request interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
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
      // Clear auth data and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('rememberMe')
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  }
)

export default api
