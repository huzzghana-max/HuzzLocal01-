/**
 * API Configuration
 * Centralized configuration for API base URL and related settings
 * Uses Vite environment variables for environment-specific configuration
 */

export const API_CONFIG = {
  // Base URL for API requests - uses VITE_API_BASE_URL from .env
  // Falls back to http://localhost:5000/api if not set
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  
  // Extract API host from baseURL (for image URLs, etc.)
  getApiHost: (): string => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    return baseURL.replace(/\/api$/, '')
  },
  
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
