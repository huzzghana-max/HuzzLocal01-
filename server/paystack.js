/**
 * Paystack Payment SDK Wrapper
 * Uses official paystack npm package for simplified API interactions
 */

const Paystack = require('paystack')

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_CURRENCY = (process.env.PAYSTACK_CURRENCY || 'GHS').toUpperCase()

if (!PAYSTACK_SECRET_KEY) {
  console.warn('WARNING: PAYSTACK_SECRET_KEY not configured')
}

// Initialize Paystack client
const paystack = new Paystack(PAYSTACK_SECRET_KEY, { timeout: 10000 })

/**
 * Initialize a Paystack transaction
 * @param {string} email - Customer email
 * @param {number} amount - Amount in major unit (e.g. GHS, NGN)
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Transaction details with authorization URL
 */
async function initializePaystackTransaction(email, amount, metadata = {}) {
  try {
    const response = await paystack.transaction.initialize({
      email,
      amount: Math.round(amount * 100), // Convert major currency unit to smallest unit
      currency: PAYSTACK_CURRENCY,
      metadata,
    })

    if (!response.status) {
      throw new Error(response.message || 'Failed to initialize transaction')
    }

    return {
      success: true,
      reference: response.data.reference,
      authorizationUrl: response.data.authorization_url,
      accessCode: response.data.access_code,
      amount: response.data.amount,
      currency: response.data.currency,
      message: response.message,
    }
  } catch (error) {
    console.error('Paystack initialization error:', error.message)
    throw new Error(`Transaction initialization failed: ${error.message}`)
  }
}

/**
 * Verify a Paystack transaction
 * @param {string} reference - Transaction reference from Paystack
 * @returns {Promise<Object>} - Verification result with transaction details
 */
async function verifyPaystackTransaction(reference) {
  try {
    const response = await paystack.transaction.verify(reference)

    if (!response.status) {
      throw new Error(response.message || 'Failed to verify transaction')
    }

    const data = response.data
    return {
      success: true,
      status: data.status, // 'success', 'failed', 'pending'
      reference: data.reference,
      amount: data.amount, // Amount in kobo
      amountPaid: data.amount_paid,
      currency: data.currency, // 'NGN', etc.
      customerEmail: data.customer?.email,
      paidAt: data.paid_at,
      authorizationUrl: data.authorization_url,
      message: response.message,
    }
  } catch (error) {
    console.error('Paystack verification error:', error.message)
    throw new Error(`Transaction verification failed: ${error.message}`)
  }
}

/**
 * List transactions
 * @param {Object} options - Query options (perPage, page, from, to)
 * @returns {Promise<Array>} - List of transactions
 */
async function listTransactions(options = {}) {
  try {
    const response = await paystack.transaction.list(options)

    if (!response.status) {
      throw new Error(response.message || 'Failed to list transactions')
    }

    return response.data
  } catch (error) {
    console.error('Paystack list transactions error:', error.message)
    throw new Error(`Failed to list transactions: ${error.message}`)
  }
}

/**
 * Fetch transaction details
 * @param {number|string} id - Transaction ID or reference
 * @returns {Promise<Object>} - Transaction details
 */
async function fetchTransaction(id) {
  try {
    const response = await paystack.transaction.fetch(id)

    if (!response.status) {
      throw new Error(response.message || 'Failed to fetch transaction')
    }

    return response.data
  } catch (error) {
    console.error('Paystack fetch transaction error:', error.message)
    throw new Error(`Failed to fetch transaction: ${error.message}`)
  }
}

/**
 * Create recurring payment (subscription)
 * @param {string} email - Customer email
 * @param {number} amount - Amount in major unit (e.g. GHS, NGN)
 * @param {string} authorizationCode - Authorization code from previous payment
 * @param {string} reference - Unique reference for this transaction
 * @returns {Promise<Object>} - Charge result
 */
async function chargeAuthorization(email, amount, authorizationCode, reference) {
  try {
    const response = await paystack.transaction.chargeAuthorization({
      email,
      amount: Math.round(amount * 100),
      currency: PAYSTACK_CURRENCY,
      authorization_code: authorizationCode,
      reference,
    })

    if (!response.status) {
      throw new Error(response.message || 'Failed to charge authorization')
    }

    return response.data
  } catch (error) {
    console.error('Paystack charge authorization error:', error.message)
    throw new Error(`Failed to charge authorization: ${error.message}`)
  }
}

/**
 * Refund a transaction
 * @param {number|string} reference - Transaction reference
 * @param {number} amount - Optional: Amount to refund in Paystack's smallest unit (partial refund)
 * @returns {Promise<Object>} - Refund result
 */
async function refundTransaction(reference, amount = null) {
  try {
    const payload = { transaction: reference }
    if (amount) {
      payload.amount = amount
    }

    const response = await paystack.refund.create(payload)

    if (!response.status) {
      throw new Error(response.message || 'Failed to refund transaction')
    }

    return response.data
  } catch (error) {
    console.error('Paystack refund error:', error.message)
    throw new Error(`Refund failed: ${error.message}`)
  }
}

module.exports = {
  // Transaction methods
  initializePaystackTransaction,
  verifyPaystackTransaction,
  listTransactions,
  fetchTransaction,
  chargeAuthorization,

  // Refund methods
  refundTransaction,

  // Raw client for advanced usage
  paystackClient: paystack,
}
