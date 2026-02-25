/**
 * Payment Routes - Paystack Integration
 * Handles payment initialization, verification, and webhooks
 */

const express = require('express');
const { getPool } = require('./db');
const { verifyToken } = require('./middleware');
const {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} = require('./paystack');

const router = express.Router();

/**
 * POST /api/payments/paystack/initialize
 * Initialize a Paystack transaction
 */
router.post('/paystack/initialize', verifyToken, async (req, res) => {
  try {
    const { email, amount, firstName, lastName, phone, metadata = {} } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!email || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or amount',
      });
    }

    // Prepare metadata
    const paymentMetadata = {
      userId,
      firstName,
      lastName,
      phone,
      ...metadata,
    };

    // Initialize Paystack transaction (amount in Naira)
    const paystackResponse = await initializePaystackTransaction(
      email,
      amount,
      paymentMetadata
    );

    // Store pending transaction in database
    try {
      const pool = getPool();
      const reference = paystackResponse.reference;
      
      await pool.execute(
        `INSERT INTO payments (user_id, amount, currency, status, payment_method, reference, metadata)
         VALUES (?, ?, 'NGN', 'pending', 'paystack', ?, ?)`,
        [userId, amount, reference, JSON.stringify(paymentMetadata)]
      );
    } catch (dbError) {
      console.error('Failed to store payment record:', dbError);
      // Payment can still proceed even if DB insert fails
    }

    res.json({
      success: true,
      reference: paystackResponse.reference,
      authorizationUrl: paystackResponse.authorizationUrl,
      accessCode: paystackResponse.accessCode,
      amount: paystackResponse.amount, // In kobo
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/payments/paystack/verify/:reference
 * Verify a Paystack transaction
 */
router.get('/paystack/verify/:reference', verifyToken, async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user.id;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Reference is required',
      });
    }

    // Verify with Paystack
    const paystackResponse = await verifyPaystackTransaction(reference);

    // Update payment record in database
    try {
      const pool = getPool();
      const status = paystackResponse.status === 'success' ? 'completed' : 'failed';
      const amountPaidNaira = paystackResponse.amountPaid ? paystackResponse.amountPaid / 100 : 0;
      
      await pool.execute(
        `UPDATE payments 
         SET status = ?, amount_paid = ?, verified_at = NOW() 
         WHERE reference = ? AND user_id = ?`,
        [status, amountPaidNaira, reference, userId]
      );
    } catch (dbError) {
      console.error('Failed to update payment record:', dbError);
    }

    res.json({
      success: true,
      status: paystackResponse.status,
      reference: paystackResponse.reference,
      amountKobo: paystackResponse.amount,
      amountNaira: paystackResponse.amount / 100,
      currency: paystackResponse.currency,
      paidAt: paystackResponse.paidAt,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
});

/**
 * POST /api/payments/paystack/webhook
 * Paystack webhook handler for payment notifications
 */
router.post('/paystack/webhook', async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return res.status(400).json({ success: false });
    }

    // Verify webhook signature
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const event = req.body.event;
    const { reference, amount } = req.body.data;

    // Handle successful payment
    if (event === 'charge.success') {
      try {
        const pool = getPool();
        
        // Update payment status
        await pool.execute(
          `UPDATE payments 
           SET status = 'completed', verified_at = NOW() 
           WHERE reference = ?`,
          [reference]
        );

        // Extract metadata if needed
        const [payment] = await pool.execute(
          'SELECT * FROM payments WHERE reference = ?',
          [reference]
        );

        if (payment.length > 0) {
          const paymentRecord = payment[0];
          console.log(`Payment completed: ${reference}, Amount: ${amount / 100} NGN`);
          
          // Trigger any post-payment actions here
          // e.g., create booking, send confirmation email, etc.
        }
      } catch (dbError) {
        console.error('Failed to process webhook payment:', dbError);
      }
    }

    // Handle failed payment
    if (event === 'charge.failed') {
      try {
        const pool = getPool();
        await pool.execute(
          `UPDATE payments 
           SET status = 'failed', verified_at = NOW() 
           WHERE reference = ?`,
          [reference]
        );
      } catch (dbError) {
        console.error('Failed to update failed payment:', dbError);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ success: false });
  }
});

module.exports = router;
