/**
 * Paystack Payment Modal Component (using react-paystack SDK)
 * Simplified payment processing with official SDK
 */

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Typography,
  Stack,
  Divider,
} from '@mui/material'
import PaymentIcon from '@mui/icons-material/Payment'
import { PaystackButton } from 'react-paystack'
import { getErrorMessage, logError } from '../utils/errorHandler'

interface PaystackPaymentModalProps {
  open: boolean
  amount: number // Amount in Naira
  email: string
  onClose: () => void
  onSuccess: (reference: string) => void
  onError?: (error: Error) => void
  title?: string
  description?: string
  metadata?: Record<string, any>
}

const PaystackPaymentModal: React.FC<PaystackPaymentModalProps> = ({
  open,
  amount,
  email,
  onClose,
  onSuccess,
  onError,
  title = 'Complete Payment',
  description = 'Secure payment powered by Paystack',
  metadata = {},
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

  if (!publicKey) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Alert severity="error">
            Paystack public key not configured
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  const transformedAmount = Math.round(amount * 100) // Convert to kobo

  const paystackConfig = {
    email,
    amount: transformedAmount,
    publicKey,
    metadata: {
      custom_fields: [
        {
          display_name: 'Full Name',
          variable_name: 'full_name',
          value: fullName,
        },
        {
          display_name: 'Phone',
          variable_name: 'phone',
          value: phone,
        },
      ],
      ...metadata,
    },
  }

  const handlePaymentSuccess = (reference: any) => {
    setLoading(false)
    try {
      // Verify payment on backend
      verifyPayment(reference.reference)
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      logError(err, 'PaystackPaymentVerification')
    }
  }

  const handlePaymentClose = () => {
    setLoading(false)
    setError('Payment cancelled')
  }

  const verifyPayment = async (reference: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/payments/paystack/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success && data.status === 'success') {
        onSuccess(reference)
        onClose()
        // Reset form
        setFullName('')
        setPhone('')
        setError(null)
      } else {
        throw new Error(data.message || 'Payment verification failed')
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      logError(err, 'PaymentVerification')
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMsg))
      }
    }
  }

  const handleInitiate = async () => {
    setError(null)

    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }

    if (!phone.trim()) {
      setError('Phone number is required')
      return
    }

    setLoading(true)
  }

  const isFormValid = fullName.trim() && phone.trim() && !loading

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon />
        {title}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5}>
          {/* Payment Summary */}
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {description}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          {/* Error Alert */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* Email (Read-only) */}
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            disabled
            size="small"
          />

          {/* Full Name */}
          <TextField
            fullWidth
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            size="small"
            required
          />

          {/* Phone Number */}
          <TextField
            fullWidth
            label="Phone Number"
            placeholder="080xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            size="small"
            required
          />

          {/* Security Info */}
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            🔒 Your payment information is secure and encrypted by Paystack
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        {isFormValid ? (
          <PaystackButton
            {...paystackConfig}
            onSuccess={handlePaymentSuccess}
            onClose={handlePaymentClose}
            className="paystack-button"
            text={`Pay ₦${amount.toLocaleString()}`}
          />
        ) : (
          <Button
            variant="contained"
            disabled={!isFormValid}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
            onClick={handleInitiate}
          >
            {loading ? 'Processing...' : `Pay ₦${amount.toLocaleString()}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default PaystackPaymentModal
