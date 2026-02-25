/**
 * Error Handler Utility
 * Standardized error handling and user-friendly error messages
 */

import axios, { AxiosError } from 'axios'

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: unknown
}

/**
 * Extracts a user-friendly error message from various error types
 * Handles axios errors, network errors, and generic errors
 */
export const getErrorMessage = (error: unknown): string => {
  // Axios error response
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>

    // Server returned an error response
    if (axiosError.response?.status === 401) {
      return 'Unauthorized. Please log in again.'
    }
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to perform this action.'
    }
    if (axiosError.response?.status === 404) {
      return 'The requested resource was not found.'
    }
    if (axiosError.response?.status === 409) {
      return 'This resource already exists. Please use a different value.'
    }
    if (axiosError.response?.status === 422) {
      return 'Invalid data provided. Please check your input.'
    }
    if (axiosError.response?.status === 500) {
      return 'Server error. Please try again later.'
    }

    // Custom error message from server
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error
    }

    // Network error
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection and try again.'
    }

    // Timeout
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.'
    }

    // Generic axios error
    return axiosError.message || 'An error occurred. Please try again.'
  }

  // Generic Error object
  if (error instanceof Error) {
    return error.message
  }

  // String error
  if (typeof error === 'string') {
    return error
  }

  // Unknown error
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Logs error for debugging purposes
 * Can be extended to send to error tracking service
 */
export const logError = (error: unknown, context?: string): void => {
  console.error(`Error${context ? ` (${context})` : ''}:`, error)

  // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
  // sentryClient.captureException(error, { contexts: { context } })
}

/**
 * Parses error and returns structured error object
 */
export const parseError = (error: unknown): ApiError => {
  const message = getErrorMessage(error)
  let status: number | undefined
  let code: string | undefined
  let details: unknown

  if (axios.isAxiosError(error)) {
    status = error.response?.status
    code = (error as AxiosError<{ code?: string }>).response?.data?.code
    details = error.response?.data
  }

  return {
    message,
    status,
    code,
    details,
  }
}

/**
 * Determines if an error is network-related
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false
  return !error.response && error.code !== undefined
}

/**
 * Determines if an error is authentication-related
 */
export const isAuthError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false
  return error.response?.status === 401 || error.response?.status === 403
}

export default {
  getErrorMessage,
  logError,
  parseError,
  isNetworkError,
  isAuthError,
}
