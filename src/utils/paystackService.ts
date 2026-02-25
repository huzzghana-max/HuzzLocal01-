/**
 * Paystack Service Utilities
 * Backend verification and support functions (uses react-paystack for UI)
 */

import API_CONFIG from '../config/api.config'

/**
 * Verify payment reference with backend
 * @param reference - Payment reference from Paystack
 * @param token - JWT token for authentication
 * @returns Payment verification result
 */
export async function verifyPaystackPayment(reference: string, token: string) {
  try {
    const response = await fetch(
      `${API_CONFIG.baseURL}/payments/paystack/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Verification failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Payment verification error:', error)
    throw error
  }
}

/**
 * Get list of user payments with optional filters
 * @param token - JWT token for authentication
 * @param page - Page number (default: 1)
 * @param limit - Records per page (default: 10)
 * @returns List of payments
 */
export async function getPaymentHistory(
  token: string,
  page = 1,
  limit = 10
) {
  try {
    const response = await fetch(
      `${API_CONFIG.baseURL}/payments?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch payments with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Payment history fetch error:', error)
    throw error
  }
}

/**
 * Initiate payment through backend (for complex cases)
 * @param params - Payment initialization parameters
 * @param token - JWT token for authentication
 * @returns Payment initialization result with authorization URL
 */
export async function initiatePayment(
  params: {
    email: string
    amount: number
    firstName?: string
    lastName?: string
    phone?: string
    metadata?: Record<string, any>
  },
  token: string
) {
  try {
    const response = await fetch(
      `${API_CONFIG.baseURL}/payments/paystack/initialize`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    )

    if (!response.ok) {
      throw new Error(`Payment initialization failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Payment initialization error:', error)
    throw error
  }
}

export default {
  verifyPaystackPayment,
  getPaymentHistory,
  initiatePayment,
}
