/**
 * API Configuration
 * Centralized configuration for API base URL and related settings
 * Uses Vite environment variables for environment-specific configuration
 */

const DEFAULT_API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'

function normalizeApiBaseUrl(rawValue?: string): string {
  if (!rawValue || typeof rawValue !== 'string') return DEFAULT_API_BASE_URL
  const trimmed = rawValue.trim().replace(/\/+$/, '')
  if (!trimmed) return DEFAULT_API_BASE_URL
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const resolvedBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

export const API_CONFIG = {
  // Base URL for API requests - uses VITE_API_BASE_URL from .env
  // Accepts either https://your-backend.com or https://your-backend.com/api
  baseURL: resolvedBaseUrl,

  // Extract API host from baseURL (for image URLs, etc.)
  getApiHost: (): string => resolvedBaseUrl.replace(/\/api$/, ''),
  
  // Timeout for API requests (in milliseconds)
  timeout: 30000,
  
  // Default headers
  getHeaders: (): Record<string, string> => {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  },
} as const;

export default API_CONFIG;
