/*
  File: server/server.js
  Purpose: Main Express application that exposes the API surface for the Huzz app.

  Major responsibilities (high-level):
  - App configuration & startup (env, static folder, uploads dir)
  - CORS & JSON parsing middleware
  - Authentication middleware (JWT verification) used across protected routes
  - File upload handling (multer) for profile and service images
  - REST endpoints for: auth (register/login), dashboards, services, vendor profile,
    admin approval flows, settings (profile & password), and bookings.

  Where it affects the UI / pages:
  - `BrowseVendors.tsx` / `/approved-services` (public service listing)
  - `VendorServices.tsx` (vendor create/update service endpoints)
  - `Settings.tsx` (profile update + password change)
  - Admin pages that approve/decline services

  Notes:
  - Returns absolute/normalized image URLs for client consumption where possible.
  - Enforces server-side `approval_status` for services (important for security).
*/
const dotenv = require('dotenv')
const path = require('path');
dotenv.config()
dotenv.config({ path: path.join(__dirname, '..', '.env') })
const express = require('express');
const cors = require('cors');
const fs = require('fs')
const jwt = require('jsonwebtoken')
const QRCode = require('qrcode')
let Stripe = null
try {
  Stripe = require('stripe')
} catch (err) {
  // stripe may not be installed in the environment — we'll handle conditionally
  Stripe = null
}
const multer = require('multer')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const { sendMail, transporter } = require('./mailer')
const { getPool, initializeDatabase, registerUser, loginUser } = require('./db')


const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function logMailConfigStatus() {
  const required = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS', 'MAIL_FROM']
  const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim() === '')
  if (missing.length > 0) {
    console.warn(`Mail config warning: missing env vars -> ${missing.join(', ')}`)
    return
  }

  transporter.verify((error) => {
    if (error) {
      console.error('SMTP verify failed:', error.message)
    } else {
      console.log(`SMTP ready: ${process.env.MAIL_HOST}:${process.env.MAIL_PORT}`)
    }
  })
}

logMailConfigStatus()


// Ensure public/uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Helper function to get pool with error checking
function getPoolOrThrow() {
  const pool = getPool()
  if (!pool) {
    throw new Error('Database is not initialized. Please ensure MySQL is running on port 3306.')
  }
  return pool
}

let servicesOwnerColumnCache = null
let serviceBookingsOwnerColumnCache = null

async function getServicesOwnerColumn(pool) {
  if (servicesOwnerColumnCache) return servicesOwnerColumnCache
  const [vendorColumn] = await pool.execute("SHOW COLUMNS FROM services LIKE 'vendor_id'")
  servicesOwnerColumnCache = vendorColumn.length > 0 ? 'vendor_id' : 'provider_id'
  return servicesOwnerColumnCache
}

async function getServiceBookingsOwnerColumn(pool) {
  if (serviceBookingsOwnerColumnCache) return serviceBookingsOwnerColumnCache
  const [vendorColumn] = await pool.execute("SHOW COLUMNS FROM service_bookings LIKE 'vendor_id'")
  serviceBookingsOwnerColumnCache = vendorColumn.length > 0 ? 'vendor_id' : 'provider_id'
  return serviceBookingsOwnerColumnCache
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function formatDateOnly(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function toDateOnly(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return formatDateOnly(date)
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function normalizeRange(fromRaw, toRaw, fallbackDays = 90) {
  const now = new Date()
  const from = new Date(fromRaw || now)
  const to = new Date(toRaw || now)

  if (Number.isNaN(from.getTime())) return null
  if (Number.isNaN(to.getTime())) to.setDate(from.getDate() + fallbackDays)
  if (!toRaw) to.setDate(from.getDate() + fallbackDays)

  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)

  return { from, to }
}

async function ensurePayoutRequestsTable() {
  const pool = getPoolOrThrow()
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payout_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requester_id INT NOT NULL,
      requester_role ENUM('provider','organizer') NOT NULL,
      source_type ENUM('service_bookings','ticket_sales') NOT NULL,
      source_event_id INT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      status ENUM('pending','approved','rejected','paid') DEFAULT 'pending',
      note TEXT NULL,
      admin_note TEXT NULL,
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_requester (requester_id, requester_role),
      INDEX idx_status (status),
      INDEX idx_source_event (source_event_id)
    )
  `)
}

async function getProviderPayoutSummary(pool, providerId) {
  const serviceBookingOwnerColumn = await getServiceBookingsOwnerColumn(pool)
  const [earnedRows] = await pool.execute(
    `SELECT COALESCE(SUM(s.price), 0) AS totalEarned
     FROM service_bookings sb
     JOIN services s ON sb.service_id = s.id
     WHERE sb.${serviceBookingOwnerColumn} = ? AND sb.status = 'completed'`,
    [providerId],
  )
  const [requestedRows] = await pool.execute(
    `SELECT COALESCE(SUM(amount), 0) AS totalRequested
     FROM payout_requests
     WHERE requester_id = ? AND requester_role = 'provider'
       AND status IN ('pending', 'approved', 'paid')`,
    [providerId],
  )

  const totalEarned = Number(earnedRows[0]?.totalEarned || 0)
  const totalRequested = Number(requestedRows[0]?.totalRequested || 0)
  return {
    totalEarned,
    totalRequested,
    available: Math.max(0, totalEarned - totalRequested),
    sourceType: 'service_bookings',
  }
}

async function getOrganizerPayoutSummary(pool, organizerId, eventId = null) {
  let earnedSql = `
    SELECT COALESCE(SUM(ts.amount), 0) AS totalEarned
    FROM ticket_sales ts
    JOIN tickets t ON ts.ticket_id = t.id
    JOIN events e ON t.event_id = e.id
    WHERE e.organizer_id = ? AND ts.status = 'completed'
  `
  const earnedParams = [organizerId]
  let requestSql = `
    SELECT COALESCE(SUM(amount), 0) AS totalRequested
    FROM payout_requests
    WHERE requester_id = ? AND requester_role = 'organizer'
      AND status IN ('pending', 'approved', 'paid')
  `
  const requestParams = [organizerId]

  if (eventId) {
    earnedSql += ' AND e.id = ?'
    earnedParams.push(eventId)
    requestSql += ' AND source_event_id = ?'
    requestParams.push(eventId)
  }

  const [earnedRows] = await pool.execute(earnedSql, earnedParams)
  const [requestedRows] = await pool.execute(requestSql, requestParams)
  const totalEarned = Number(earnedRows[0]?.totalEarned || 0)
  const totalRequested = Number(requestedRows[0]?.totalRequested || 0)
  return {
    totalEarned,
    totalRequested,
    available: Math.max(0, totalEarned - totalRequested),
    sourceType: 'ticket_sales',
  }
}

async function sendTicketPurchaseEmail({
  pool,
  buyerId,
  buyerEmail,
  buyerName,
  eventId,
  ticket,
  quantity,
  amount,
  paymentMethod,
  transactionId,
  saleId,
  qrDataUrl,
}) {
  let user = null
  if (buyerId) {
    const [users] = await pool.execute('SELECT name, email FROM users WHERE id = ? LIMIT 1', [buyerId])
    if (users && users.length > 0) user = users[0]
  } else if (buyerEmail) {
    user = { name: buyerName || 'Attendee', email: buyerEmail }
  }
  if (!user || !user.email) return

  const [events] = await pool.execute('SELECT name, date, location FROM events WHERE id = ? LIMIT 1', [eventId])
  if (!events || events.length === 0) return

  const event = events[0]
  const eventDateTime = event.date ? new Date(event.date).toLocaleString() : 'TBD'
  const unitPrice = parseFloat(ticket.price || 0)
  const finalAmount = parseFloat(amount || 0)
  const methodLabel = paymentMethod || 'offline'

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin: 0 0 12px; color: #145A45;">Your Ticket Purchase Is Confirmed</h2>
      <p>Hi ${user.name || 'Attendee'},</p>
      <p>Thanks for your purchase. Here are your ticket details:</p>

      <div style="background:#f6f8f7;border:1px solid #d8e2de;border-radius:10px;padding:14px;margin:14px 0;">
        <p><strong>Event:</strong> ${event.name}</p>
        <p><strong>Date & Time:</strong> ${eventDateTime}</p>
        <p><strong>Location:</strong> ${event.location || 'TBD'}</p>
        <p><strong>Ticket Type:</strong> ${ticket.ticket_type || 'General Admission'}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Unit Price:</strong> ${unitPrice.toFixed(2)}</p>
        <p><strong>Total Paid:</strong> ${finalAmount.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${methodLabel}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Ticket Sale ID:</strong> ${saleId}</p>
      </div>

      ${qrDataUrl ? `<p><strong>Your Ticket QR:</strong><br/><img src="${qrDataUrl}" alt="Ticket QR code" style="max-width:240px;border:1px solid #d8e2de;border-radius:8px;padding:6px;background:white;" /></p>` : ''}

      <p>Please keep this email and present your QR code at check-in.</p>
      <p style="color:#5b6a65;">Huzz Ticketing</p>
    </div>
  `

  await sendMail({
    to: user.email,
    subject: `Ticket Confirmation - ${event.name}`,
    html,
  })
}


// CORS setup for local and ngrok - default to common dev origins when not provided
const allowedOrigins = (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.length > 0)
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'http://localhost:5000']
// In development allow all origins to simplify local testing
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
          return regex.test(origin);
        }
        return origin === pattern;
      })) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }));
} else {
  app.use(cors({ origin: true, credentials: true }));
}
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Always initialize database on startup.
// initializeDatabase() is idempotent and ensures required tables exist.
initializeDatabase()
  .then(async () => {
    try {
      await ensurePayoutRequestsTable()
    } catch (payoutErr) {
      console.warn('Payout table initialization warning:', payoutErr.message)
    }
  })
  .catch(err => {
    console.warn('Database initialization warning:', err.message)
    console.warn('Server will continue running without database. Authentication will fail.')
  })

// Middleware: Token verification
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this')
    console.log('Token decoded:', decoded)
    req.userId = decoded.id
    req.userRole = decoded.role
    next()
  } catch (error) {
    console.error('Token verification error:', error.message)
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

function getOptionalAuthUser(req) {
  const authHeader = req.headers.authorization
  if (!authHeader) return { id: null, role: null }
  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this')
    return { id: decoded?.id || null, role: decoded?.role || null }
  } catch {
    return { id: null, role: null }
  }
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'))
    }
  },
})

// Rate limiter for public event registration (5 registrations per hour per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests
  message: 'Too many registration attempts from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
})

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    console.log('Register request received:', { name, email, role })

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const userRole = role && ['organizer', 'provider', 'admin'].includes(role) ? role : 'organizer'
    const result = await registerUser(name, email, password, userRole)
    console.log('User registered successfully:', result.user)
    res.status(201).json(result)
  } catch (error) {
    console.error('Register error - Full error:', error)
    console.error('Register error - Message:', error.message)
    console.error('Register error - Code:', error.code)
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists' })
    }
    res.status(500).json({ message: error.message || 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('Login request received:', { email })

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const result = await loginUser(email, password)
    console.log('User logged in successfully:', result.user)
    res.status(200).json(result)
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(401).json({ message: error.message || 'Login failed' })
  }
})

// Dashboard endpoints
app.get('/api/dashboard/organizer-stats', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId

    // Get total events count
    const [eventCounts] = await pool.execute(
      'SELECT COUNT(*) AS totalEvents FROM events WHERE organizer_id = ?',
      [userId]
    )

    // Get upcoming events count
    const [upcomingCounts] = await pool.execute(
      "SELECT COUNT(*) AS upcomingEvents FROM events WHERE organizer_id = ? AND date > NOW()",
      [userId]
    )

    // Get pending bookings count
    const [pendingBookings] = await pool.execute(
      "SELECT COUNT(*) AS pendingBookings FROM bookings WHERE organizer_id = ? AND status = 'pending'",
      [userId]
    )

    // Get user's actual events
    const [events] = await pool.execute(
      'SELECT id, name, date, status, (SELECT COUNT(*) FROM bookings WHERE event_id = events.id) AS vendors FROM events WHERE organizer_id = ? ORDER BY date DESC LIMIT 10',
      [userId]
    )

    // Get total revenue (sum of completed bookings)
    const [revenue] = await pool.execute(
      "SELECT COALESCE(SUM(total_cost), 0) AS totalRevenue FROM bookings WHERE organizer_id = ? AND status = 'completed'",
      [userId]
    )

    res.json({
      totalEvents: eventCounts[0]?.totalEvents || 0,
      pendingBookings: pendingBookings[0]?.pendingBookings || 0,
      upcomingEvents: upcomingCounts[0]?.upcomingEvents || 0,
      totalRevenue: revenue[0]?.totalRevenue || 0,
      events: events || []
    })
  } catch (error) {
    console.error('Organizer stats error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/dashboard/provider-stats', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId
    const bookingOwnerColumn = await getServiceBookingsOwnerColumn(pool)

    // Get profile completion percentage
    const [provider] = await pool.execute(
      'SELECT * FROM service_providers WHERE user_id = ?',
      [userId]
    )

    // Get pending service requests
    const [pending] = await pool.execute(
      `SELECT COUNT(*) AS pendingRequests FROM service_bookings WHERE ${bookingOwnerColumn} = ? AND status = 'pending'`,
      [userId]
    )

    // Get completed bookings
    const [completed] = await pool.execute(
      `SELECT COUNT(*) AS completedBookings FROM service_bookings WHERE ${bookingOwnerColumn} = ? AND status = 'completed'`,
      [userId]
    )

    // Get total earnings from completed bookings (price comes from services table)
    const [earnings] = await pool.execute(
      `SELECT COALESCE(SUM(s.price), 0) AS totalEarnings
       FROM service_bookings sb
       JOIN services s ON sb.service_id = s.id
       WHERE sb.${bookingOwnerColumn} = ? AND sb.status = 'completed'`,
      [userId]
    )

    // Get recent bookings
    const [bookings] = await pool.execute(
      `SELECT id, service_id, booking_date, status, created_at
       FROM service_bookings
       WHERE ${bookingOwnerColumn} = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    )

    const hasDescription = Boolean(provider?.[0]?.description)
    const hasPortfolio = Boolean(provider?.[0]?.portfolio_images)
    const profileCompletion = hasDescription && hasPortfolio ? '100%' : (hasDescription || hasPortfolio ? '75%' : '50%')

    res.json({
      profileCompletion,
      pendingRequests: pending[0]?.pendingRequests || 0,
      completedBookings: completed[0]?.completedBookings || 0,
      totalEarnings: earnings[0]?.totalEarnings || 0,
      earnings: earnings[0]?.totalEarnings || 0,
      bookings: bookings || []
    })
  } catch (error) {
    console.error('Provider stats error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/dashboard/admin-stats', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()

    // Get total users count
    const [userCounts] = await pool.execute(
      'SELECT COUNT(*) AS totalUsers FROM users'
    )

    // Get pending approvals (services awaiting approval)
    const [pending] = await pool.execute(
      "SELECT COUNT(*) AS pendingApprovals FROM services WHERE approval_status = 'pending'"
    )

    // Get total transactions (sum of all completed bookings)
    const [transactions] = await pool.execute(
      "SELECT COALESCE(SUM(total_cost), 0) AS totalTransactions FROM bookings WHERE status = 'completed'"
    )

    // Calculate platform fee (10% of transactions)
    const platformFee = transactions[0]?.totalTransactions * 0.1 || 0

    // Get recent users
    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    )

    res.json({
      totalUsers: userCounts[0]?.totalUsers || 0,
      pendingApprovals: pending[0]?.pendingApprovals || 0,
      totalTransactions: transactions[0]?.totalTransactions || 0,
      platformFee: Math.round(platformFee * 100) / 100,
      users: users || []
    })
  } catch (error) {
    console.error('Admin stats error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get all users (admin only)
app.get('/api/admin/users', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const [users] = await pool.execute('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC')
    res.json(users)
  } catch (error) {
    console.error('Get users error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Create new user (admin only)
app.post('/api/admin/users', verifyToken, async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const validRole = ['organizer', 'provider', 'admin'].includes(role) ? role : 'organizer'
    const hashedPassword = await require('bcryptjs').hash(password, 10)

    const pool = getPoolOrThrow()
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, 1)',
      [name, email, hashedPassword, validRole]
    )

    res.status(201).json({
      message: `${validRole} user created successfully`,
      user: {
        id: result.insertId,
        name,
        email,
        role: validRole
      }
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists' })
    }
    res.status(500).json({ message: error.message })
  }
})

// Update user role/privileges (admin only)
app.put('/api/admin/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['organizer', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const pool = getPoolOrThrow()
    const [result] = await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ message: 'User role updated successfully', role })
  } catch (error) {
    console.error('Update user role error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Delete user (admin only)
app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params

    const pool = getPoolOrThrow()
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

// Mail test endpoint (authenticated)
app.post('/api/mail/test', verifyToken, async (req, res) => {
  try {
    const to = String(req.body?.to || '').trim() || String(req.body?.email || '').trim()
    if (!to) {
      return res.status(400).json({ message: 'Recipient email is required in body as "to" or "email"' })
    }

    await sendMail({
      to,
      subject: 'HUZZ Mail Test',
      html: `<p>This is a test email from HUZZ at ${new Date().toISOString()}.</p>`,
      text: `This is a test email from HUZZ at ${new Date().toISOString()}.`,
    })

    res.json({ message: 'Test email sent', to })
  } catch (error) {
    console.error('Mail test error:', error.message)
    res.status(500).json({ message: error.message || 'Failed to send test email' })
  }
})

// --- Reviews API ---

// Submit a review for a completed booking
app.post('/api/reviews', verifyToken, async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body
    const reviewer_id = req.userId
    const parsedRating = Number(rating)
    if (!booking_id || !parsedRating) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' })
    }

    const pool = getPoolOrThrow()
    const serviceBookingOwnerColumn = await getServiceBookingsOwnerColumn(pool)
    // Check if booking is completed and belongs to this user
    const [bookings] = await pool.execute(
      `SELECT id, ${serviceBookingOwnerColumn} as provider_id
       FROM service_bookings
       WHERE id = ? AND organizer_id = ? AND status = ? LIMIT 1`,
      [booking_id, reviewer_id, 'completed']
    )
    if (bookings.length === 0) {
      return res.status(403).json({ message: 'You can only review completed bookings you own.' })
    }
    const provider_id = bookings[0].provider_id

    // Check if review already exists
    const [existing] = await pool.execute(
      'SELECT * FROM reviews WHERE booking_id = ? AND reviewer_id = ?',
      [booking_id, reviewer_id]
    )
    if (existing.length > 0) {
      return res.status(409).json({ message: 'You have already reviewed this booking.' })
    }
    // Insert review
    const [insertResult] = await pool.execute(
      'INSERT INTO reviews (booking_id, reviewer_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [booking_id, reviewer_id, provider_id, parsedRating, (comment || '').trim() || null]
    )

    // Update aggregate provider rating.
    const [ratingRows] = await pool.execute(
      `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total_ratings
       FROM reviews
       WHERE provider_id = ?`,
      [provider_id],
    )
    const avgRating = Number(ratingRows[0]?.avg_rating || 0)
    const totalRatings = Number(ratingRows[0]?.total_ratings || 0)
    await pool.execute(
      `UPDATE service_providers
       SET rating = ?, total_ratings = ?
       WHERE user_id = ?`,
      [avgRating, totalRatings, provider_id],
    )

    res.status(201).json({
      message: 'Review submitted successfully.',
      reviewId: insertResult.insertId,
      provider: {
        id: provider_id,
        rating: avgRating,
        totalRatings,
      },
    })
  } catch (error) {
    console.error('Submit review error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Fetch reviews written by current user
app.get('/api/reviews/by-reviewer', verifyToken, async (req, res) => {
  try {
    const reviewerId = req.userId
    const pool = getPoolOrThrow()
    const [reviews] = await pool.execute(
      `SELECT r.id, r.booking_id, r.provider_id, r.rating, r.comment, r.created_at,
              u.name as provider_name
       FROM reviews r
       LEFT JOIN users u ON r.provider_id = u.id
       WHERE r.reviewer_id = ?
       ORDER BY r.created_at DESC`,
      [reviewerId],
    )
    res.json(reviews)
  } catch (error) {
    console.error('Fetch reviewer reviews error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Fetch reviews for a provider
app.get('/api/reviews/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params
    const pool = getPoolOrThrow()
    const [reviews] = await pool.execute(
      `SELECT r.*, u.name as reviewer_name FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.provider_id = ?
        ORDER BY r.created_at DESC`,
      [providerId]
    )
    res.json(reviews)
  } catch (error) {
    console.error('Fetch reviews error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get all vendors (service providers)
app.get('/api/vendors', async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const [vendors] = await pool.execute(`
      SELECT 
        sp.id,
        sp.business_name as name,
        sp.service_type,
        sp.description,
        sp.hourly_rate as price,
        sp.rating,
        sp.total_ratings as totalRatings,
        sp.availability_status,
        sp.profile_image,
        u.name as ownerName,
        u.phone,
        u.email,
        u.phone as location
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE u.role = 'provider'
      ORDER BY sp.rating DESC
    `)
    
    res.json(vendors)
  } catch (error) {
    console.error('Get vendors error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get all approved services for browsing
app.get('/api/approved-services', async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const serviceOwnerColumn = await getServicesOwnerColumn(pool)
    const [services] = await pool.execute(`
      SELECT 
        s.id, 
        s.${serviceOwnerColumn} as vendor_id, 
        s.title, 
        s.description, 
        s.category, 
        s.price, 
        s.phone,
        s.location,
        s.latitude,
        s.longitude,
        s.image, 
        s.duration, 
        s.availability, 
        s.is_approved,
        s.created_at,
        sp.rating as vendor_rating,
        sp.total_ratings as vendor_total_ratings,
        u.id as user_id,
        u.name as vendor_name, 
        u.email as vendor_email
      FROM services s
      JOIN users u ON s.${serviceOwnerColumn} = u.id
      LEFT JOIN service_providers sp ON sp.user_id = u.id
      WHERE s.is_approved = TRUE
      ORDER BY s.created_at DESC
    `)
    
    res.json(services)
  } catch (error) {
    console.error('Get approved services error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Public vendor availability calendar summary (used by booking UI)
app.get('/api/vendors/:vendorId/availability-calendar', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.vendorId, 10)
    if (!vendorId) return res.status(400).json({ message: 'Invalid vendorId' })

    const range = normalizeRange(req.query.from, req.query.to, 90)
    if (!range) return res.status(400).json({ message: 'Invalid date range' })

    const pool = getPoolOrThrow()
    const serviceBookingOwnerColumn = await getServiceBookingsOwnerColumn(pool)
    const from = formatDateOnly(range.from)
    const to = formatDateOnly(range.to)

    const [bookings] = await pool.execute(
      `SELECT id, booking_date
       FROM service_bookings
       WHERE ${serviceBookingOwnerColumn} = ?
         AND status IN ('pending', 'confirmed')
         AND DATE(booking_date) BETWEEN ? AND ?`,
      [vendorId, from, to],
    )

    const [blocks] = await pool.execute(
      `SELECT id, start_at, end_at, source, source_ref, notes
       FROM vendor_availability_blocks
       WHERE vendor_id = ?
         AND status = 'active'
         AND DATE(start_at) <= ?
         AND DATE(end_at) >= ?
       ORDER BY start_at ASC`,
      [vendorId, to, from],
    )

    const blockedDateSet = new Set()
    bookings.forEach((b) => {
      const day = toDateOnly(b.booking_date)
      if (day) blockedDateSet.add(day)
    })
    blocks.forEach((b) => {
      const start = new Date(b.start_at)
      const end = new Date(b.end_at)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return
      const cursor = new Date(start)
      cursor.setHours(0, 0, 0, 0)
      const endDay = new Date(end)
      endDay.setHours(0, 0, 0, 0)
      while (cursor <= endDay) {
        blockedDateSet.add(formatDateOnly(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
    })

    res.json({
      vendorId,
      from,
      to,
      blockedDates: Array.from(blockedDateSet).sort(),
      slots: blocks,
    })
  } catch (error) {
    console.error('Get vendor availability calendar error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Provider: get own manual/calendar blocks
app.get('/api/vendor/availability-blocks', verifyToken, async (req, res) => {
  try {
    const vendorId = req.userId
    const range = normalizeRange(req.query.from, req.query.to, 120)
    if (!range) return res.status(400).json({ message: 'Invalid date range' })
    const pool = getPoolOrThrow()
    const from = formatDateOnly(range.from)
    const to = formatDateOnly(range.to)

    const [blocks] = await pool.execute(
      `SELECT id, vendor_id, start_at, end_at, source, source_ref, status, notes, created_at, updated_at
       FROM vendor_availability_blocks
       WHERE vendor_id = ?
         AND DATE(start_at) <= ?
         AND DATE(end_at) >= ?
       ORDER BY start_at ASC`,
      [vendorId, to, from],
    )

    res.json(blocks)
  } catch (error) {
    console.error('Get vendor availability blocks error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Provider: create manual/calendar sync block
app.post('/api/vendor/availability-blocks', verifyToken, async (req, res) => {
  try {
    const vendorId = req.userId
    const { start_at, end_at, notes, source = 'manual', source_ref = null } = req.body
    if (!start_at || !end_at) return res.status(400).json({ message: 'start_at and end_at are required' })

    const start = new Date(start_at)
    const end = new Date(end_at)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start_at or end_at value' })
    }
    if (start > end) return res.status(400).json({ message: 'start_at must be before end_at' })

    const normalizedSource = ['manual', 'calendar_sync', 'booking'].includes(String(source))
      ? String(source)
      : 'manual'

    const pool = getPoolOrThrow()
    const [result] = await pool.execute(
      `INSERT INTO vendor_availability_blocks (vendor_id, start_at, end_at, source, source_ref, status, notes)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [vendorId, start, end, normalizedSource, source_ref, notes || null],
    )

    res.status(201).json({
      message: 'Availability block created',
      id: result.insertId,
      vendor_id: vendorId,
      start_at: start,
      end_at: end,
      source: normalizedSource,
      source_ref,
      status: 'active',
      notes: notes || null,
    })
  } catch (error) {
    console.error('Create vendor availability block error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Provider: bulk sync external busy slots (e.g., Google/Outlook worker output)
app.post('/api/vendor/availability-blocks/sync', verifyToken, async (req, res) => {
  try {
    const vendorId = req.userId
    const {
      source = 'google',
      replace = false,
      blocks = [],
    } = req.body || {}

    if (!Array.isArray(blocks)) {
      return res.status(400).json({ message: 'blocks must be an array' })
    }
    if (blocks.length > 1000) {
      return res.status(400).json({ message: 'blocks payload too large (max 1000)' })
    }

    const safeSource = String(source || 'google').slice(0, 32)
    const pool = getPoolOrThrow()

    let created = 0
    let updated = 0
    let skipped = 0
    const activeRefs = []

    for (const block of blocks) {
      const start = new Date(block?.start_at)
      const end = new Date(block?.end_at)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        skipped += 1
        continue
      }

      const externalIdRaw = block?.external_id != null ? String(block.external_id) : ''
      const fallbackId = `${start.toISOString()}_${end.toISOString()}`
      const sourceRef = `calendar_sync:${safeSource}:${(externalIdRaw || fallbackId).slice(0, 120)}`
      const notes = block?.summary ? String(block.summary).slice(0, 2000) : null
      activeRefs.push(sourceRef)

      const [existing] = await pool.execute(
        `SELECT id
         FROM vendor_availability_blocks
         WHERE vendor_id = ? AND source = 'calendar_sync' AND source_ref = ?
         LIMIT 1`,
        [vendorId, sourceRef],
      )

      if (existing.length > 0) {
        await pool.execute(
          `UPDATE vendor_availability_blocks
           SET start_at = ?, end_at = ?, notes = ?, status = 'active'
           WHERE id = ?`,
          [start, end, notes, existing[0].id],
        )
        updated += 1
      } else {
        await pool.execute(
          `INSERT INTO vendor_availability_blocks (vendor_id, start_at, end_at, source, source_ref, status, notes)
           VALUES (?, ?, ?, 'calendar_sync', ?, 'active', ?)`,
          [vendorId, start, end, sourceRef, notes],
        )
        created += 1
      }
    }

    if (replace === true) {
      if (activeRefs.length > 0) {
        const placeholders = activeRefs.map(() => '?').join(', ')
        await pool.execute(
          `UPDATE vendor_availability_blocks
           SET status = 'cancelled'
           WHERE vendor_id = ?
             AND source = 'calendar_sync'
             AND source_ref NOT IN (${placeholders})`,
          [vendorId, ...activeRefs],
        )
      } else {
        await pool.execute(
          `UPDATE vendor_availability_blocks
           SET status = 'cancelled'
           WHERE vendor_id = ? AND source = 'calendar_sync'`,
          [vendorId],
        )
      }
    }

    res.json({
      message: 'Availability sync completed',
      source: safeSource,
      replace: Boolean(replace),
      counts: { created, updated, skipped, received: blocks.length },
    })
  } catch (error) {
    console.error('Sync vendor availability blocks error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Provider: cancel availability block
app.delete('/api/vendor/availability-blocks/:id', verifyToken, async (req, res) => {
  try {
    const blockId = parseInt(req.params.id, 10)
    const vendorId = req.userId
    if (!blockId) return res.status(400).json({ message: 'Invalid block id' })
    const pool = getPoolOrThrow()
    const [result] = await pool.execute(
      `UPDATE vendor_availability_blocks
       SET status = 'cancelled'
       WHERE id = ? AND vendor_id = ?`,
      [blockId, vendorId],
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Block not found' })
    res.json({ message: 'Availability block cancelled' })
  } catch (error) {
    console.error('Cancel vendor availability block error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Vendor Profile - GET
app.get('/api/vendor/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.replace('Bearer ', '')
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, 'your-secret-key-change-this')
    
    const pool = getPoolOrThrow()
    const [vendors] = await pool.execute(
      `SELECT sp.*, u.email, u.phone, u.name as ownerName 
       FROM service_providers sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.user_id = ?`,
      [decoded.id]
    )
    
    if (vendors.length === 0) {
      return res.status(404).json({ message: 'Vendor profile not found' })
    }
    
    const vendor = vendors[0]
    res.json({
      id: vendor.id,
      userId: vendor.user_id,
      businessName: vendor.business_name,
      serviceType: vendor.service_type,
      description: vendor.description,
      hourlyRate: vendor.hourly_rate,
      profileImage: vendor.profile_image,
      portfolioImages: vendor.portfolio_images ? JSON.parse(vendor.portfolio_images) : [],
      phone: vendor.phone,
      email: vendor.email,
      location: vendor.location,
      availability: vendor.availability_status,
    })
  } catch (error) {
    console.error('Get vendor profile error:', error.message)
    res.status(500).json({ message: error.message || 'Failed to fetch profile' })
  }
})

// Vendor Profile - PUT
app.put('/api/vendor/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.replace('Bearer ', '')
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, 'your-secret-key-change-this')
    
    const { businessName, serviceType, description, hourlyRate, profileImage, portfolioImages } = req.body
    
    const pool = getPoolOrThrow()
    
    await pool.execute(
      `UPDATE service_providers 
       SET business_name = ?, service_type = ?, description = ?, hourly_rate = ?, 
           profile_image = ?, portfolio_images = ?
       WHERE user_id = ?`,
      [
        businessName,
        serviceType,
        description,
        hourlyRate,
        profileImage || null,
        portfolioImages ? JSON.stringify(portfolioImages) : null,
        decoded.id,
      ]
    )
    
    res.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Update vendor profile error:', error.message)
    res.status(500).json({ message: error.message || 'Failed to update profile' })
  }
})

// Vendor Services endpoints
// GET vendor services
app.get('/api/vendor/services', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId
    const serviceOwnerColumn = await getServicesOwnerColumn(pool)
    console.log('Fetching services for user:', userId)

    const [results] = await pool.query(
      `SELECT id, title, description, category, price, image, phone, location, latitude, longitude, duration, availability, is_approved, approval_status
       FROM services
       WHERE ${serviceOwnerColumn} = ?
       ORDER BY created_at DESC`,
      [userId]
    )
    console.log('Services found:', results?.length || 0)
    res.json(results || [])
  } catch (error) {
    console.error('Get services error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// POST create service
app.post('/api/vendor/services', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId
    const serviceOwnerColumn = await getServicesOwnerColumn(pool)
    const { title, description, category, price, duration, availability, phone, location, latitude, longitude } = req.body
    console.log('Create service - body fields:', { title, description, category, price, duration, availability, phone, location, latitude, longitude })
    console.log('Create service - uploaded file:', req.file ? { filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } : null)

    if (!title || !description || !category || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null

    const [result] = await pool.query(
      `INSERT INTO services (${serviceOwnerColumn}, title, description, category, price, image, phone, location, latitude, longitude, duration, availability, is_approved, approval_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, NOW())`,
      [userId, title, description, category, price, imageUrl, phone || null, location || null, latitude || null, longitude || null, duration, availability, 'pending']
    )
    
    console.log('Service created with ID:', result.insertId)
    res.status(201).json({
      id: result.insertId,
      title,
      description,
      category,
      price,
      image: imageUrl,
      phone: phone || null,
      location: location || null,
      latitude: latitude || null,
      longitude: longitude || null,
      duration,
      availability,
      approval_status: 'pending',
      is_approved: false,
    })
  } catch (error) {
    console.error('Services POST error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// PUT update service
app.put('/api/vendor/services/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId
    const serviceOwnerColumn = await getServicesOwnerColumn(pool)
    const serviceId = parseInt(req.params.id)
    const { title, description, category, price, duration, availability, phone, location, latitude, longitude } = req.body
    console.log('Update service id=', serviceId, '- body fields:', { title, description, category, price, duration, availability, phone, location, latitude, longitude })
    console.log('Update service - uploaded file:', req.file ? { filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } : null)

    if (!title || !description || !category || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Check ownership
    const [results] = await pool.query(`SELECT ${serviceOwnerColumn} as service_owner_id FROM services WHERE id = ?`, [serviceId])
    if (results.length === 0) {
      return res.status(404).json({ message: 'Service not found' })
    }
    if (results[0].service_owner_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    let updateQuery = 'UPDATE services SET title = ?, description = ?, category = ?, price = ?, duration = ?, availability = ?'
    let updateParams = [title, description, category, price, duration, availability]

    if (req.file) {
      updateQuery += ', image = ?'
      updateParams.push(`${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`)
    }

    // Optional phone/location/coords updates
    if (typeof phone !== 'undefined') {
      updateQuery += ', phone = ?'
      updateParams.push(phone || null)
    }
    if (typeof location !== 'undefined') {
      updateQuery += ', location = ?'
      updateParams.push(location || null)
    }
    if (typeof latitude !== 'undefined') {
      updateQuery += ', latitude = ?'
      updateParams.push(latitude || null)
    }
    if (typeof longitude !== 'undefined') {
      updateQuery += ', longitude = ?'
      updateParams.push(longitude || null)
    }

    updateQuery += ' WHERE id = ?'
    updateParams.push(serviceId)

    await pool.query(updateQuery, updateParams)
    res.json({ message: 'Service updated successfully' })
  } catch (error) {
    console.error('Services PUT error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// DELETE service
app.delete('/api/vendor/services/:id', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId
    const serviceOwnerColumn = await getServicesOwnerColumn(pool)
    const serviceId = parseInt(req.params.id)

    // Check ownership
    const [results] = await pool.query(`SELECT ${serviceOwnerColumn} as service_owner_id FROM services WHERE id = ?`, [serviceId])
    if (results.length === 0) {
      return res.status(404).json({ message: 'Service not found' })
    }
    if (results[0].service_owner_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    await pool.query('DELETE FROM services WHERE id = ?', [serviceId])
    res.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Services DELETE error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Messaging endpoints
// Get all users (for messaging/creating new conversations)
app.get('/api/messaging-users', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const pool = getPoolOrThrow()
    
    // Get all users except the current user, prioritize admin users
    const [users] = await pool.execute(
      `SELECT id, name, email, profile_image, role FROM users 
       WHERE id != ? 
       ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, name ASC`,
      [userId]
    )
    
    res.json(users)
  } catch (error) {
    console.error('Get messaging users error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get messages between two users
app.get('/api/messages/:recipientId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const recipientId = parseInt(req.params.recipientId)

    const pool = getPoolOrThrow()
    const [messages] = await pool.execute(
      `SELECT m.*, u1.name as sender_name, u2.name as receiver_name 
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) 
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [userId, recipientId, recipientId, userId]
    )

    res.json(messages)
  } catch (error) {
    console.error('Get messages error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get all conversations for a user
app.get('/api/conversations', verifyToken, async (req, res) => {
  try {
    const userId = req.userId

    const pool = getPoolOrThrow()
    const [conversations] = await pool.execute(
      `SELECT DISTINCT 
         CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as user_id,
         u.name, u.email, u.profile_image,
         (SELECT message FROM messages 
          WHERE (sender_id = ? AND receiver_id = u.id) 
             OR (sender_id = u.id AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1) as last_message,
         (SELECT created_at FROM messages 
          WHERE (sender_id = ? AND receiver_id = u.id) 
             OR (sender_id = u.id AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1) as last_message_time,
         (SELECT COUNT(*) FROM messages 
          WHERE receiver_id = ? AND sender_id = u.id AND is_read = FALSE) as unread_count
       FROM messages m
       JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END)
       WHERE m.sender_id = ? OR m.receiver_id = ?
       GROUP BY user_id, u.id, u.name, u.email, u.profile_image
       ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId]
    )

    res.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Send a message
app.post('/api/messages', verifyToken, async (req, res) => {
  try {
    const senderId = req.userId
    const { recipientId, message, bookingId } = req.body

    console.log('Message received:', { senderId, recipientId, message, bookingId })

    if (!recipientId || !message) {
      return res.status(400).json({ message: 'Recipient and message are required' })
    }

    if (!senderId) {
      return res.status(400).json({ message: 'Sender ID not found in token' })
    }

    const pool = getPoolOrThrow()
    
    // Verify sender exists
    const [senderCheck] = await pool.execute('SELECT id FROM users WHERE id = ?', [senderId])
    if (senderCheck.length === 0) {
      console.error('Sender not found:', senderId)
      return res.status(400).json({ message: 'Sender not found in database' })
    }

    // Verify recipient exists
    const [recipientCheck] = await pool.execute('SELECT id FROM users WHERE id = ?', [recipientId])
    if (recipientCheck.length === 0) {
      console.error('Recipient not found:', recipientId)
      return res.status(400).json({ message: 'Recipient not found' })
    }

    const [result] = await pool.execute(
      `INSERT INTO messages (sender_id, receiver_id, booking_id, message, is_read)
       VALUES (?, ?, ?, ?, FALSE)`,
      [senderId, recipientId, bookingId || null, message]
    )

    console.log('Message inserted successfully:', { messageId: result.insertId })

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.insertId
    })
  } catch (error) {
    console.error('Send message error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Mark messages as read
app.put('/api/messages/:conversationUserId/read', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.replace('Bearer ', '')
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, 'your-secret-key-change-this')
    const userId = decoded.id
    const conversationUserId = parseInt(req.params.conversationUserId)

    const pool = getPoolOrThrow()
    await pool.execute(
      `UPDATE messages SET is_read = TRUE 
       WHERE receiver_id = ? AND sender_id = ?`,
      [userId, conversationUserId]
    )

    res.json({ message: 'Messages marked as read' })
  } catch (error) {
    console.error('Mark as read error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Image Upload
app.post('/api/vendor/upload-image', upload.single('file'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    console.log('File uploaded successfully:', req.file.filename)
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`
    console.log('Image URL:', imageUrl)
    res.json({ imageUrl })
  } catch (error) {
    console.error('Upload image error:', error.message)
    res.status(500).json({ message: error.message || 'Failed to upload image' })
  }
})

// Settings Routes
// GET user settings
app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId

    const [results] = await pool.execute(
      'SELECT notification_preferences, privacy_settings FROM users WHERE id = ?',
      [userId]
    )

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = results[0]
    const notifications = user.notification_preferences ? JSON.parse(user.notification_preferences) : {
      emailNotifications: true,
      pushNotifications: true,
      messageNotifications: true,
      bookingNotifications: true,
      paymentNotifications: true,
    }

    const privacy = user.privacy_settings ? JSON.parse(user.privacy_settings) : {
      profileVisibility: 'public',
      allowMessagesFromAnyone: true,
    }

    res.json({ notifications, privacy })
  } catch (error) {
    console.error('Get settings error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// PUT update profile
app.put('/api/settings/profile', verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId
    const { name, email, phone, currentPassword, newPassword } = req.body

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' })
    }

    // Handle password change if provided (synchronous & safe)
    let hashedPassword = null
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required to change password' })
      }

      // Verify current password (use promise-based query so we wait for verification)
      const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId])
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'User not found' })
      }

      const isPasswordValid = bcrypt.compareSync(currentPassword, rows[0].password)
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' })
      }

      // Hash new password only after verification
      hashedPassword = bcrypt.hashSync(newPassword, 10)
    }

    // Build update query
    let updateQuery = 'UPDATE users SET name = ?, email = ?, phone = ?'
    let updateParams = [name, email, phone || '']

    if (hashedPassword) {
      updateQuery += ', password = ?'
      updateParams.push(hashedPassword)
    }

    if (req.file) {
      updateQuery += ', profile_image = ?'
      updateParams.push(`/uploads/${req.file.filename}`)
    }

    updateQuery += ' WHERE id = ?'
    updateParams.push(userId)

    await pool.execute(updateQuery, updateParams)

    // Always return persisted profile_image so frontend does not overwrite it with undefined.
    const [updatedRows] = await pool.execute(
      'SELECT id, name, email, phone, profile_image, role FROM users WHERE id = ? LIMIT 1',
      [userId]
    )

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(404).json({ message: 'User not found after update' })
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedRows[0],
    })
  } catch (error) {
    console.error('Settings profile error:', error.stack || error.message)
    res.status(500).json({ message: error.message })
  }
})

// PUT update notification preferences
app.put('/api/settings/notifications', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId
    const notifications = req.body

    await pool.execute(
      'UPDATE users SET notification_preferences = ? WHERE id = ?',
      [JSON.stringify(notifications), userId]
    )
    res.json({ message: 'Notification preferences updated', notifications })
  } catch (error) {
    console.error('Settings notifications error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// PUT update privacy settings
app.put('/api/settings/privacy', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const userId = req.userId
    const privacy = req.body

    await pool.execute(
      'UPDATE users SET privacy_settings = ? WHERE id = ?',
      [JSON.stringify(privacy), userId]
    )
    res.json({ message: 'Privacy settings updated', privacy })
  } catch (error) {
    console.error('Settings privacy error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Admin: Get pending services for approval
app.get('/api/admin/pending-services', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view pending services' })
    }

    const pool = getPoolOrThrow()
    const serviceOwnerColumn = await getServicesOwnerColumn(pool)
    const [services] = await pool.execute(
      `SELECT s.id, s.${serviceOwnerColumn} as vendor_id, s.title, s.description, s.category, s.price, 
              s.image, s.duration, s.availability, s.phone, s.location, s.created_at, s.is_approved,
              u.name as vendor_name, u.email as vendor_email
       FROM services s
       JOIN users u ON s.${serviceOwnerColumn} = u.id
       WHERE s.is_approved = FALSE
       ORDER BY s.created_at DESC`
    )

    res.json(services)
  } catch (error) {
    console.error('Get pending services error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Admin: Approve service
app.put('/api/admin/services/:serviceId/approve', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve services' })
    }

    const { serviceId } = req.params
    const pool = getPoolOrThrow()

    const [result] = await pool.execute(
      'UPDATE services SET is_approved = TRUE, approval_status = ? WHERE id = ?',
      ['approved', serviceId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found' })
    }

    console.log(`Service ${serviceId} approved by admin`)
    res.json({ message: 'Service approved successfully' })
  } catch (error) {
    console.error('Approve service error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Admin: Decline service (mark declined instead of hard-delete)
app.delete('/api/admin/services/:serviceId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete services' })
    }

    const { serviceId } = req.params
    const pool = getPoolOrThrow()

    const [result] = await pool.execute(
      'UPDATE services SET approval_status = ?, is_approved = FALSE WHERE id = ? AND approval_status = ?',
      ['declined', serviceId, 'pending']
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found or already approved' })
    }

    console.log(`Service ${serviceId} declined by admin`)
    res.json({ message: 'Service declined successfully' })
  } catch (error) {
    console.error('Decline service error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Update: Only show approved services in browse vendors
app.get('/api/vendor-services/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params
    const pool = getPoolOrThrow()
    const serviceOwnerColumn = await getServicesOwnerColumn(pool)
    const [services] = await pool.execute(
      `SELECT * FROM services WHERE ${serviceOwnerColumn} = ? AND approval_status = ? ORDER BY created_at DESC`,
      [vendorId, 'approved']
    )
    res.json(services)
  } catch (error) {
    console.error('Get vendor services error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Create event (supports optional image upload)
app.post('/api/events', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { name, date, type, description, location } = req.body
    const organizer_id = req.userId

    if (!name || !date) {
      return res.status(400).json({ message: 'Event name and date are required' })
    }

    const pool = getPoolOrThrow()

    const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : (req.body.imageUrl || null)

    const [result] = await pool.execute(
      `INSERT INTO events (organizer_id, name, date, type, description, location, image_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', NOW())`,
      [organizer_id, name, date, type || null, description || null, location || null, imageUrl]
    )

    res.status(201).json({
      id: result.insertId,
      organizer_id,
      name,
      date,
      type,
      description,
      location,
      image_url: imageUrl,
      status: 'published',
    })
  } catch (error) {
    console.error('Create event error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Public: list published events
app.get('/api/events/public', async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const [events] = await pool.execute('SELECT id, organizer_id, name, date, location, type, description, image_url FROM events WHERE status = ? ORDER BY date ASC', ['published'])
    res.json(events)
  } catch (err) {
    console.error('Get public events error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Get single event details (public)
app.get('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params
    const pool = getPoolOrThrow()
    const [events] = await pool.execute('SELECT id, organizer_id, name, date, location, type, description, image_url, status FROM events WHERE id = ? LIMIT 1', [eventId])
    
    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' })
    }
    
    res.json(events[0])
  } catch (error) {
    console.error('Get event details error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Register for an event (non-ticketed)
app.post('/api/events/:eventId/register', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const userId = req.userId
    const pool = getPoolOrThrow()

    // ensure event exists
    const [rows] = await pool.execute('SELECT id FROM events WHERE id = ? LIMIT 1', [eventId])
    if (rows.length === 0) return res.status(404).json({ message: 'Event not found' })

    await pool.execute('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)', [eventId, userId])
    res.status(201).json({ message: 'Registered successfully' })
  } catch (err) {
    console.error('Event register error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Public registration for an event (accepts name, email, phone) and sends confirmation email with token
// Rate limited to prevent abuse
app.post('/api/events/:eventId/register-public', registerLimiter, async (req, res) => {
  try {
    const { eventId } = req.params
    let { name, email, phone } = req.body
    
    // trim and validate
    email = (email || '').trim().toLowerCase()
    name = (name || '').trim()
    phone = (phone || '').trim()
    
    if (!email) return res.status(400).json({ message: 'Email is required' })
    
    // simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' })
    
    if (!name) return res.status(400).json({ message: 'Name is required' })

    const pool = getPoolOrThrow()
    const [rows] = await pool.execute('SELECT id, name, date, location FROM events WHERE id = ? LIMIT 1', [eventId])
    if (rows.length === 0) return res.status(404).json({ message: 'Event not found' })
    
    // check if email already registered for this event
    const [existing] = await pool.execute('SELECT id FROM event_attendees WHERE event_id = ? AND email = ? LIMIT 1', [eventId, email])
    if (existing.length > 0) return res.status(409).json({ message: 'This email is already registered for this event' })

    // generate token
    const token = `TK-${Date.now()}-${Math.round(Math.random()*1e6)}`

    await pool.execute('INSERT INTO event_attendees (event_id, name, email, phone, token) VALUES (?, ?, ?, ?, ?)', [eventId, name || null, email, phone || null, token])

    // generate QR for token
    let qrDataUrl = null
    try {
      qrDataUrl = await QRCode.toDataURL(JSON.stringify({ eventId, token }))
    } catch (qrErr) {
      console.error('QR generation failed for attendee:', qrErr.message)
    }

    // send confirmation email via Mailpit SMTP
    let mailResult = null
    try {
      const event = rows[0]
      const html = `
        <p>Hi ${name || 'Attendee'},</p>
        <p>Thanks for registering for <strong>${event.name}</strong> on ${new Date(event.date).toLocaleString()} at ${event.location || ''}.</p>
        <p>Your ticket token: <strong>${token}</strong></p>
        ${qrDataUrl ? `<p><img src="${qrDataUrl}" alt="QR code" style="max-width:240px"/></p>` : ''}
        <p>Show this email at check-in.</p>
      `
      mailResult = await sendMail({
        to: email,
        subject: `Registration confirmation - ${event.name}`,
        html
      })
    } catch (mailErr) {
      console.warn('Mail send skipped or failed (Mailpit SMTP):', mailErr && mailErr.message ? mailErr.message : mailErr)
    }

    res.status(201).json({ message: 'Registered (public)', token, qr: qrDataUrl, mailSent: !!mailResult })
  } catch (err) {
    console.error('Public event register error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Unified attend endpoint: register-only OR ticket purchase in one flow.
// - If ticket_id is provided: requires authenticated user and performs purchase.
// - If ticket_id is omitted: performs attendee registration (public or authenticated).
app.post('/api/events/:eventId/attend', registerLimiter, async (req, res) => {
  try {
    const { eventId } = req.params
    let { name, email, phone, ticket_id, quantity, payment_method } = req.body
    const pool = getPoolOrThrow()

    // Optional auth (needed for ticket purchase; also used as fallback for registration details)
    let authUserId = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this')
        authUserId = decoded?.id || null
      } catch {
        authUserId = null
      }
    }

    // Ensure event exists
    const [eventRows] = await pool.execute('SELECT id, name, date, location FROM events WHERE id = ? LIMIT 1', [eventId])
    if (eventRows.length === 0) return res.status(404).json({ message: 'Event not found' })
    const event = eventRows[0]

    // Purchase path (ticket + attendance)
    if (ticket_id) {
      if (!authUserId) {
        email = (email || '').trim().toLowerCase()
        name = (name || '').trim()
        phone = (phone || '').trim()
        if (!email) return res.status(400).json({ message: 'Email is required' })
        if (!name) return res.status(400).json({ message: 'Name is required' })
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' })
      }
      if (!quantity || Number(quantity) <= 0) {
        return res.status(400).json({ message: 'Positive quantity is required for ticket purchase' })
      }

      const [tickets] = await pool.execute('SELECT * FROM tickets WHERE id = ? AND event_id = ? LIMIT 1', [ticket_id, eventId])
      if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' })
      const ticket = tickets[0]

      const qty = parseInt(quantity, 10)
      const available = (ticket.quantity || 0) - (ticket.sold || 0)
      if (available < qty) return res.status(400).json({ message: 'Not enough tickets available' })

      await pool.execute('UPDATE tickets SET sold = sold + ? WHERE id = ?', [qty, ticket_id])

      const amount = (parseFloat(ticket.price || 0) * qty) || 0
      const transactionId = `tx_${Date.now()}_${Math.round(Math.random() * 1e6)}`
      const [saleResult] = await pool.execute(
        'INSERT INTO ticket_sales (ticket_id, buyer_id, buyer_name, buyer_email, buyer_phone, quantity, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          ticket_id,
          authUserId,
          authUserId ? null : name || null,
          authUserId ? null : email || null,
          authUserId ? null : phone || null,
          qty,
          amount,
          payment_method || 'offline',
          transactionId,
          'completed',
        ]
      )
      const saleId = saleResult.insertId

      let qrDataUrl = null
      try {
        qrDataUrl = await QRCode.toDataURL(JSON.stringify({ saleId, transactionId }))
        await pool.execute('UPDATE ticket_sales SET qr_code = ? WHERE id = ?', [qrDataUrl, saleId])
      } catch (qrErr) {
        console.error('QR generation failed:', qrErr.message)
      }

      try {
        await sendTicketPurchaseEmail({
          pool,
          buyerId: authUserId,
          buyerEmail: authUserId ? null : email,
          buyerName: authUserId ? null : name,
          eventId: parseInt(eventId, 10),
          ticket,
          quantity: qty,
          amount,
          paymentMethod: payment_method || 'offline',
          transactionId,
          saleId,
          qrDataUrl,
        })
      } catch (mailErr) {
        console.warn('Ticket purchase email failed:', mailErr && mailErr.message ? mailErr.message : mailErr)
      }

      return res.status(201).json({
        mode: 'ticket',
        message: 'Ticket purchased and attendance confirmed',
        saleId,
        transactionId,
        amount,
        qr: qrDataUrl,
      })
    }

    // Registration-only path
    if (authUserId && (!email || !name)) {
      const [users] = await pool.execute('SELECT name, email FROM users WHERE id = ? LIMIT 1', [authUserId])
      if (users.length > 0) {
        name = name || users[0].name
        email = email || users[0].email
      }
    }

    email = (email || '').trim().toLowerCase()
    name = (name || '').trim()
    phone = (phone || '').trim()

    if (!email) return res.status(400).json({ message: 'Email is required' })
    if (!name) return res.status(400).json({ message: 'Name is required' })
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' })

    const [existing] = await pool.execute(
      'SELECT id FROM event_attendees WHERE event_id = ? AND email = ? LIMIT 1',
      [eventId, email]
    )
    if (existing.length > 0) return res.status(409).json({ message: 'This email is already registered for this event' })

    const token = `TK-${Date.now()}-${Math.round(Math.random() * 1e6)}`
    await pool.execute(
      'INSERT INTO event_attendees (event_id, name, email, phone, token) VALUES (?, ?, ?, ?, ?)',
      [eventId, name || null, email, phone || null, token]
    )

    let qrDataUrl = null
    try {
      qrDataUrl = await QRCode.toDataURL(JSON.stringify({ eventId, token }))
    } catch (qrErr) {
      console.error('QR generation failed for attendee:', qrErr.message)
    }

    let mailResult = null
    try {
      const html = `
        <p>Hi ${name || 'Attendee'},</p>
        <p>Thanks for registering for <strong>${event.name}</strong> on ${new Date(event.date).toLocaleString()} at ${event.location || ''}.</p>
        <p>Your ticket token: <strong>${token}</strong></p>
        ${qrDataUrl ? `<p><img src="${qrDataUrl}" alt="QR code" style="max-width:240px"/></p>` : ''}
        <p>Show this email at check-in.</p>
      `
      mailResult = await sendMail({
        to: email,
        subject: `Registration confirmation - ${event.name}`,
        html,
      })
    } catch (mailErr) {
      console.warn('Registration email failed:', mailErr && mailErr.message ? mailErr.message : mailErr)
    }

    return res.status(201).json({
      mode: 'registration',
      message: 'Registered (public)',
      token,
      qr: qrDataUrl,
      mailSent: !!mailResult,
    })
  } catch (err) {
    console.error('Attend event error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Get user events
app.get('/api/events', verifyToken, async (req, res) => {
  try {
    const organizer_id = req.userId
    const pool = getPoolOrThrow()

    const [events] = await pool.execute(
      'SELECT * FROM events WHERE organizer_id = ? ORDER BY date DESC',
      [organizer_id]
    )

    res.json(events)
  } catch (error) {
    console.error('Get events error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Admin: View event attendees (registrations)
app.get('/api/admin/events/:eventId/attendees', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Only admins can view attendees' })
    
    const { eventId } = req.params
    const pool = getPoolOrThrow()
    
    // Get event details
    const [events] = await pool.execute('SELECT id, name, date, location FROM events WHERE id = ? LIMIT 1', [eventId])
    if (events.length === 0) return res.status(404).json({ message: 'Event not found' })
    
    // Get all attendees for this event
    const [attendees] = await pool.execute(
      'SELECT id, name, email, phone, token, created_at FROM event_attendees WHERE event_id = ? ORDER BY created_at DESC',
      [eventId]
    )
    
    res.json({ event: events[0], attendeeCount: attendees.length, attendees })
  } catch (error) {
    console.error('Get attendees error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Admin: List all events with attendee counts
app.get('/api/admin/events', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Only admins can view all events' })
    
    const pool = getPoolOrThrow()
    
    const [events] = await pool.execute(`
      SELECT e.id, e.name, e.date, e.location, e.status, 
             COUNT(ea.id) as attendee_count
      FROM events e
      LEFT JOIN event_attendees ea ON e.id = ea.event_id
      GROUP BY e.id
      ORDER BY e.date DESC
    `)
    
    res.json(events)
  } catch (error) {
    console.error('Get all events error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Organizer: Get registrants for all their events
app.get('/api/organizer/registrants', verifyToken, async (req, res) => {
  try {
    const organizer_id = req.userId
    const pool = getPoolOrThrow()
    const eventId = req.query.eventId ? Number(req.query.eventId) : null

    let sql = `
      SELECT ea.id, ea.event_id, ea.name, ea.email, ea.phone, ea.token, ea.created_at,
             e.name as event_name, e.date as event_date, e.location
      FROM event_attendees ea
      JOIN events e ON ea.event_id = e.id
      WHERE e.organizer_id = ?`
    const params = [organizer_id]
    if (eventId) {
      sql += ` AND ea.event_id = ?`
      params.push(eventId)
    }
    sql += ` ORDER BY ea.created_at DESC`

    const [registrants] = await pool.execute(sql, params)
    
    res.json(registrants)
  } catch (error) {
    console.error('Get registrants error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Organizer: Get ticket sales & revenue for all their events
app.get('/api/organizer/ticket-sales', verifyToken, async (req, res) => {
  try {
    const organizer_id = req.userId
    const pool = getPoolOrThrow()
    const eventId = req.query.eventId ? Number(req.query.eventId) : null

    let sql = `
      SELECT ts.id, ts.ticket_id, ts.buyer_id, ts.quantity, ts.amount, ts.transaction_id, 
             ts.payment_method, ts.validated, ts.created_at,
             t.ticket_type, t.event_id,
             e.name as event_name, e.date as event_date,
             COALESCE(u.name, ts.buyer_name) as buyer_name,
             COALESCE(u.email, ts.buyer_email) as buyer_email
      FROM ticket_sales ts
      JOIN tickets t ON ts.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      LEFT JOIN users u ON ts.buyer_id = u.id
      WHERE e.organizer_id = ?`
    const params = [organizer_id]
    if (eventId) {
      sql += ` AND t.event_id = ?`
      params.push(eventId)
    }
    sql += ` ORDER BY ts.created_at DESC`

    const [sales] = await pool.execute(sql, params)
    
    res.json(sales)
  } catch (error) {
    console.error('Get ticket sales error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// --- Tickets API ---
// Create ticket type for an event (organizer only)
app.post('/api/events/:eventId/tickets', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const { ticket_type, price, quantity } = req.body
    const userId = req.userId

    if (!ticket_type || typeof price === 'undefined' || typeof quantity === 'undefined') {
      return res.status(400).json({ message: 'ticket_type, price and quantity are required' })
    }

    const pool = getPoolOrThrow()

    // verify ownership
    const [events] = await pool.execute('SELECT organizer_id FROM events WHERE id = ? LIMIT 1', [eventId])
    if (events.length === 0) return res.status(404).json({ message: 'Event not found' })
    if (events[0].organizer_id !== userId) return res.status(403).json({ message: 'Only the organizer can add tickets' })

    const [result] = await pool.execute(
      'INSERT INTO tickets (event_id, ticket_type, price, quantity, sold) VALUES (?, ?, ?, ?, 0)',
      [eventId, ticket_type, price, quantity]
    )

    res.status(201).json({ id: result.insertId, event_id: parseInt(eventId), ticket_type, price, quantity, sold: 0 })
  } catch (error) {
    console.error('Create ticket error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// List tickets for an event (public)
app.get('/api/events/:eventId/tickets', async (req, res) => {
  try {
    const { eventId } = req.params
    const pool = getPoolOrThrow()
    const [tickets] = await pool.execute('SELECT id, ticket_type, price, quantity, sold FROM tickets WHERE event_id = ? ORDER BY price ASC', [eventId])
    res.json(tickets)
  } catch (error) {
    console.error('Get event tickets error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Purchase ticket(s) for an event (allows guest purchase)
app.post('/api/events/:eventId/purchase', async (req, res) => {
  try {
    const { eventId } = req.params
    let { ticket_id, quantity, payment_method, name, email, phone } = req.body
    const { id: authUserId } = getOptionalAuthUser(req)

    if (!ticket_id || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'ticket_id and positive quantity are required' })
    }

    if (!authUserId) {
      email = (email || '').trim().toLowerCase()
      name = (name || '').trim()
      phone = (phone || '').trim()
      if (!email) return res.status(400).json({ message: 'Email is required' })
      if (!name) return res.status(400).json({ message: 'Name is required' })
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' })
    }

    const pool = getPoolOrThrow()

    // Load ticket
    const [tickets] = await pool.execute('SELECT * FROM tickets WHERE id = ? AND event_id = ? LIMIT 1', [ticket_id, eventId])
    if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' })

    const ticket = tickets[0]
    const available = (ticket.quantity || 0) - (ticket.sold || 0)
    if (available < quantity) return res.status(400).json({ message: 'Not enough tickets available' })

    // Simple transaction: increment sold and record sale
    await pool.execute('UPDATE tickets SET sold = sold + ? WHERE id = ?', [quantity, ticket_id])

    const amount = (parseFloat(ticket.price || 0) * parseInt(quantity)) || 0
    const transactionId = `tx_${Date.now()}_${Math.round(Math.random()*1e6)}`

    // create sale record with completed status
    const [saleResult] = await pool.execute(
      'INSERT INTO ticket_sales (ticket_id, buyer_id, buyer_name, buyer_email, buyer_phone, quantity, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        ticket_id,
        authUserId,
        authUserId ? null : name || null,
        authUserId ? null : email || null,
        authUserId ? null : phone || null,
        quantity,
        amount,
        payment_method || 'offline',
        transactionId,
        'completed',
      ]
    )

    const saleId = saleResult.insertId

    // Generate QR code pointing to a minimal payload (transactionId)
    let qrDataUrl = null
    try {
      qrDataUrl = await QRCode.toDataURL(JSON.stringify({ saleId, transactionId }))
      // store qr in ticket_sales
      await pool.execute('UPDATE ticket_sales SET qr_code = ? WHERE id = ?', [qrDataUrl, saleId])
    } catch (qrErr) {
      console.error('QR generation failed:', qrErr.message)
    }

    // Send ticket purchase confirmation email (non-blocking)
    try {
      await sendTicketPurchaseEmail({
        pool,
        buyerId: authUserId,
        buyerEmail: authUserId ? null : email,
        buyerName: authUserId ? null : name,
        eventId: parseInt(eventId, 10),
        ticket,
        quantity: parseInt(quantity, 10),
        amount,
        paymentMethod: payment_method || 'offline',
        transactionId,
        saleId,
        qrDataUrl,
      })
    } catch (mailErr) {
      console.warn('Ticket purchase email failed:', mailErr && mailErr.message ? mailErr.message : mailErr)
    }

    res.status(201).json({ message: 'Purchase successful', saleId, transactionId, amount, qr: qrDataUrl })
  } catch (error) {
    console.error('Purchase ticket error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Validate ticket (check-in) - accepts { transactionId } or { saleId }
app.post('/api/events/:eventId/validate', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const { transactionId, saleId } = req.body
    if (!transactionId && !saleId) return res.status(400).json({ message: 'transactionId or saleId required' })

    const pool = getPoolOrThrow()
    let rows
    if (saleId) {
      const [r] = await pool.execute('SELECT ts.*, t.event_id FROM ticket_sales ts JOIN tickets t ON ts.ticket_id = t.id WHERE ts.id = ? LIMIT 1', [saleId])
      rows = r
    } else {
      const [r] = await pool.execute('SELECT ts.*, t.event_id FROM ticket_sales ts JOIN tickets t ON ts.ticket_id = t.id WHERE ts.transaction_id = ? LIMIT 1', [transactionId])
      rows = r
    }

    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Sale not found' })
    const sale = rows[0]
    if (parseInt(sale.event_id) !== parseInt(eventId)) return res.status(400).json({ message: 'Sale does not belong to this event' })
    if (sale.validated) return res.status(409).json({ message: 'Ticket already validated' })

    await pool.execute('UPDATE ticket_sales SET validated = TRUE WHERE id = ?', [sale.id])
    res.json({ message: 'Ticket validated', saleId: sale.id })
  } catch (err) {
    console.error('Validation error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Admin: Get ticket sales (reporting)
app.get('/api/admin/ticket-sales', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Only admins can view ticket sales' })
    const { from, to } = req.query
    const pool = getPoolOrThrow()
    let query = `SELECT ts.id, ts.ticket_id, ts.buyer_id, ts.quantity, ts.amount, ts.payment_method, ts.transaction_id, ts.validated, ts.created_at, t.ticket_type, t.event_id, e.name as event_name, 
                 COALESCE(u.name, ts.buyer_name) as buyer_name,
                 COALESCE(u.email, ts.buyer_email) as buyer_email
                 FROM ticket_sales ts
                 JOIN tickets t ON ts.ticket_id = t.id
                 JOIN events e ON t.event_id = e.id
                 LEFT JOIN users u ON ts.buyer_id = u.id`
    const params = []
    if (from && to) {
      query += ' WHERE ts.created_at BETWEEN ? AND ?'
      params.push(from, to)
    }
    query += ' ORDER BY ts.created_at DESC'

    const [rows] = await pool.execute(query, params)
    res.json(rows)
  } catch (err) {
    console.error('Admin ticket sales error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Create Stripe PaymentIntent for a ticket (only if Stripe key present)
app.post('/api/events/:eventId/create-payment-intent', verifyToken, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ message: 'Stripe not configured' })
    const { ticket_id, quantity } = req.body
    if (!ticket_id || !quantity) return res.status(400).json({ message: 'ticket_id and quantity required' })

    const pool = getPoolOrThrow()
    const [tickets] = await pool.execute('SELECT * FROM tickets WHERE id = ? LIMIT 1', [ticket_id])
    if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' })
    const ticket = tickets[0]
    const amount = Math.round((parseFloat(ticket.price || 0) * parseInt(quantity)) * 100) // cents

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
    const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'usd' })
    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('Create payment intent error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Confirm payment and record ticket sale (client calls after successful Stripe payment)
app.post('/api/events/:eventId/confirm-payment', async (req, res) => {
  try {
    const { eventId } = req.params
    let { ticket_id, quantity, payment_intent_id, name, email, phone } = req.body
    const { id: authUserId } = getOptionalAuthUser(req)

    if (!ticket_id || !quantity || !payment_intent_id) return res.status(400).json({ message: 'ticket_id, quantity and payment_intent_id are required' })

    const pool = getPoolOrThrow()

    // Verify ticket
    const [tickets] = await pool.execute('SELECT * FROM tickets WHERE id = ? AND event_id = ? LIMIT 1', [ticket_id, eventId])
    if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' })
    const ticket = tickets[0]
    const available = (ticket.quantity || 0) - (ticket.sold || 0)
    if (available < quantity) return res.status(400).json({ message: 'Not enough tickets available' })

    // If Stripe configured, verify the payment intent status
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
        const pi = await stripe.paymentIntents.retrieve(payment_intent_id)
        if (!pi || pi.status !== 'succeeded') {
          return res.status(400).json({ message: 'Payment not completed' })
        }
      } catch (err) {
        console.error('Stripe retrieval error:', err.message)
        return res.status(500).json({ message: 'Failed to verify payment' })
      }
    }

    // Update sold count and create sale record
    await pool.execute('UPDATE tickets SET sold = sold + ? WHERE id = ?', [quantity, ticket_id])
    const amount = (parseFloat(ticket.price || 0) * parseInt(quantity)) || 0

    const transactionId = payment_intent_id
    if (!authUserId) {
      email = (email || '').trim().toLowerCase()
      name = (name || '').trim()
      phone = (phone || '').trim()
      if (!email) return res.status(400).json({ message: 'Email is required' })
      if (!name) return res.status(400).json({ message: 'Name is required' })
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' })
    }

    const [saleResult] = await pool.execute(
      'INSERT INTO ticket_sales (ticket_id, buyer_id, buyer_name, buyer_email, buyer_phone, quantity, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        ticket_id,
        authUserId,
        authUserId ? null : name || null,
        authUserId ? null : email || null,
        authUserId ? null : phone || null,
        quantity,
        amount,
        'stripe',
        transactionId,
        'completed',
      ]
    )

    const saleId = saleResult.insertId
    // generate QR
    let qrDataUrl = null
    try {
      qrDataUrl = await QRCode.toDataURL(JSON.stringify({ saleId, transactionId }))
      await pool.execute('UPDATE ticket_sales SET qr_code = ? WHERE id = ?', [qrDataUrl, saleId])
    } catch (qrErr) {
      console.error('QR generation failed:', qrErr.message)
    }

    // Send ticket purchase confirmation email (non-blocking)
    try {
      await sendTicketPurchaseEmail({
        pool,
        buyerId: authUserId,
        buyerEmail: authUserId ? null : email,
        buyerName: authUserId ? null : name,
        eventId: parseInt(eventId, 10),
        ticket,
        quantity: parseInt(quantity, 10),
        amount,
        paymentMethod: 'stripe',
        transactionId,
        saleId,
        qrDataUrl,
      })
    } catch (mailErr) {
      console.warn('Ticket purchase email failed:', mailErr && mailErr.message ? mailErr.message : mailErr)
    }

    res.json({ message: 'Payment confirmed and tickets issued', saleId, transactionId, qr: qrDataUrl, amount })
  } catch (err) {
    console.error('Confirm payment error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Book a service (allows guest bookings)
app.post('/api/service-bookings', async (req, res) => {
  try {
    let { service_id, booking_date, notes, name, email, phone, verification_code } = req.body
    const { id: authUserId } = getOptionalAuthUser(req)
    
    if (!service_id || !booking_date) {
      return res.status(400).json({ message: 'Service ID and booking date are required' })
    }

    if (!authUserId) {
      email = (email || '').trim().toLowerCase()
      name = (name || '').trim()
      phone = (phone || '').trim()
      if (!email) return res.status(400).json({ message: 'Email is required' })
      if (!name) return res.status(400).json({ message: 'Name is required' })
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' })
    }

    const pool = getPoolOrThrow()
    const serviceOwnerColumn = await getServicesOwnerColumn(pool)
    const serviceBookingOwnerColumn = await getServiceBookingsOwnerColumn(pool)
    
    // Get service details to find vendor_id
    const [serviceData] = await pool.execute(`SELECT ${serviceOwnerColumn} as service_owner_id FROM services WHERE id = ?`, [service_id])
    
    if (serviceData.length === 0) {
      return res.status(404).json({ message: 'Service not found' })
    }

    const serviceOwnerId = serviceData[0].service_owner_id
    const requestedDay = toDateOnly(booking_date)
    if (!requestedDay) {
      return res.status(400).json({ message: 'Invalid booking date format' })
    }

    // Prevent booking on days already blocked by existing bookings
    const [existingBookings] = await pool.execute(
      `SELECT id
       FROM service_bookings
       WHERE ${serviceBookingOwnerColumn} = ?
         AND status IN ('pending', 'confirmed')
         AND DATE(booking_date) = ?
       LIMIT 1`,
      [serviceOwnerId, requestedDay],
    )
    if (existingBookings.length > 0) {
      return res.status(409).json({ message: 'Vendor is already booked for the selected date' })
    }

    // Prevent booking on blocked dates from manual/external availability sync
    const [blockedSlots] = await pool.execute(
      `SELECT id
       FROM vendor_availability_blocks
       WHERE vendor_id = ?
         AND status = 'active'
         AND DATE(start_at) <= ?
         AND DATE(end_at) >= ?
       LIMIT 1`,
      [serviceOwnerId, requestedDay, requestedDay],
    )
    if (blockedSlots.length > 0) {
      return res.status(409).json({ message: 'Vendor is unavailable on the selected date' })
    }

    // Require verified email for guest bookings
    if (!authUserId) {
      if (!verification_code) return res.status(400).json({ message: 'Verification code is required' })
      const [verRows] = await pool.execute(
        `SELECT id, expires_at
         FROM guest_booking_verifications
         WHERE service_id = ? AND email = ? AND code = ? AND verified_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [service_id, email, verification_code],
      )
      if (verRows.length === 0) return res.status(400).json({ message: 'Invalid verification code' })
      const expiresAt = new Date(verRows[0].expires_at)
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ message: 'Verification code expired' })
      }
      await pool.execute('UPDATE guest_booking_verifications SET verified_at = NOW() WHERE id = ?', [verRows[0].id])
    }

    // Create booking
    const [result] = await pool.execute(
      `INSERT INTO service_bookings (service_id, ${serviceBookingOwnerColumn}, organizer_id, guest_name, guest_email, guest_phone, booking_date, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        service_id,
        serviceOwnerId,
        authUserId || null,
        authUserId ? null : name || null,
        authUserId ? null : email || null,
        authUserId ? null : phone || null,
        booking_date,
        notes || null,
      ]
    )

    // Auto-create booking hold in availability calendar
    const bookingId = result.insertId
    await pool.execute(
      `INSERT INTO vendor_availability_blocks (vendor_id, start_at, end_at, source, source_ref, status, notes)
       VALUES (?, ?, ?, 'booking', ?, 'active', ?)`,
      [
        serviceOwnerId,
        `${requestedDay} 00:00:00`,
        `${requestedDay} 23:59:59`,
        `service_booking:${bookingId}`,
        'Auto-synced from booking',
      ],
    )

    console.log(`Service booking created: ID ${bookingId} for service ${service_id}`)
    res.status(201).json({ 
      message: 'Service booking created successfully',
      bookingId,
    })
  } catch (error) {
    console.error('Create booking error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Guest booking email verification (send code)
app.post('/api/service-bookings/verify-email', async (req, res) => {
  try {
    const { service_id, email, name } = req.body
    if (!service_id) return res.status(400).json({ message: 'Service ID is required' })
    const cleanedEmail = (email || '').trim().toLowerCase()
    if (!cleanedEmail) return res.status(400).json({ message: 'Email is required' })
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanedEmail)) return res.status(400).json({ message: 'Invalid email format' })

    const pool = getPoolOrThrow()
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await pool.execute(
      `INSERT INTO guest_booking_verifications (service_id, email, code, expires_at)
       VALUES (?, ?, ?, ?)`,
      [service_id, cleanedEmail, code, expiresAt],
    )

    const displayName = (name || '').trim() || 'Guest'
    const html = `
      <p>Hi ${displayName},</p>
      <p>Your verification code for booking a provider is:</p>
      <p style="font-size:20px;font-weight:700;letter-spacing:2px;">${code}</p>
      <p>This code expires in 10 minutes.</p>
    `
    try {
      await sendMail({
        to: cleanedEmail,
        subject: 'Verify your booking request',
        html,
      })
    } catch (mailErr) {
      console.warn('Guest booking verification email failed:', mailErr && mailErr.message ? mailErr.message : mailErr)
    }

    res.json({ message: 'Verification code sent' })
  } catch (error) {
    console.error('Send booking verification error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get bookings for organizer
app.get('/api/my-bookings', verifyToken, async (req, res) => {
  try {
    const organizer_id = req.userId
    const pool = getPoolOrThrow()
    const serviceBookingOwnerColumn = await getServiceBookingsOwnerColumn(pool)
    
    const [bookings] = await pool.execute(
      `SELECT 
        sb.id, 
        sb.service_id, 
        sb.booking_date, 
        sb.notes, 
        sb.status,
        sb.created_at,
        s.title, 
        s.description, 
        s.category, 
        s.price, 
        s.image,
        s.duration,
        u.id as vendor_id,
        u.name as vendor_name, 
        u.email as vendor_email
       FROM service_bookings sb
       JOIN services s ON sb.service_id = s.id
       JOIN users u ON sb.${serviceBookingOwnerColumn} = u.id
       WHERE sb.organizer_id = ?
       ORDER BY sb.booking_date DESC`,
      [organizer_id]
    )
    
    res.json(bookings)
  } catch (error) {
    console.error('Get bookings error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get bookings for provider
app.get('/api/provider-bookings', verifyToken, async (req, res) => {
  try {
    const vendor_id = req.userId
    const pool = getPoolOrThrow()
    const serviceBookingOwnerColumn = await getServiceBookingsOwnerColumn(pool)
    
    const [bookings] = await pool.execute(
      `SELECT 
        sb.id, 
        sb.service_id, 
        sb.booking_date, 
        sb.notes, 
        sb.status,
        sb.created_at,
        s.title, 
        s.description, 
        s.category, 
        s.price,
        COALESCE(u.name, sb.guest_name) as organizer_name, 
        COALESCE(u.email, sb.guest_email) as organizer_email,
        COALESCE(u.phone, sb.guest_phone) as organizer_phone
       FROM service_bookings sb
       JOIN services s ON sb.service_id = s.id
       LEFT JOIN users u ON sb.organizer_id = u.id
       WHERE sb.${serviceBookingOwnerColumn} = ?
       ORDER BY sb.booking_date DESC`,
      [vendor_id]
    )
    
    res.json(bookings)
  } catch (error) {
    console.error('Get provider bookings error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/payouts/summary', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    await ensurePayoutRequestsTable()
    const role = req.userRole
    const userId = req.userId
    const eventId = req.query.eventId ? Number(req.query.eventId) : null

    if (!['provider', 'organizer'].includes(role)) {
      return res.status(403).json({ message: 'Only providers and organizers can view payout summary' })
    }

    if (role === 'provider') {
      const summary = await getProviderPayoutSummary(pool, userId)
      return res.json(summary)
    }

    if (eventId) {
      const [events] = await pool.execute(
        'SELECT id FROM events WHERE id = ? AND organizer_id = ? LIMIT 1',
        [eventId, userId],
      )
      if (events.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this event payout summary' })
      }
    }

    const summary = await getOrganizerPayoutSummary(pool, userId, eventId)
    return res.json(summary)
  } catch (error) {
    console.error('Get payout summary error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/payouts/my-requests', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    await ensurePayoutRequestsTable()
    const role = req.userRole
    const userId = req.userId

    if (!['provider', 'organizer'].includes(role)) {
      return res.status(403).json({ message: 'Only providers and organizers can view payout requests' })
    }

    const [rows] = await pool.execute(
      `SELECT pr.id, pr.requester_id, pr.requester_role, pr.source_type, pr.source_event_id,
              pr.amount, pr.status, pr.note, pr.admin_note, pr.requested_at, pr.processed_at,
              e.name as source_event_name
       FROM payout_requests pr
       LEFT JOIN events e ON pr.source_event_id = e.id
       WHERE pr.requester_id = ? AND pr.requester_role = ?
       ORDER BY pr.requested_at DESC
       LIMIT 50`,
      [userId, role],
    )

    res.json(rows)
  } catch (error) {
    console.error('Get payout requests error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/payouts/request', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    await ensurePayoutRequestsTable()
    const role = req.userRole
    const userId = req.userId
    const amount = Number(req.body?.amount || 0)
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : ''
    const sourceEventId = req.body?.sourceEventId ? Number(req.body.sourceEventId) : null

    if (!['provider', 'organizer'].includes(role)) {
      return res.status(403).json({ message: 'Only providers and organizers can request payouts' })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'A valid payout amount is required' })
    }

    let summary
    let sourceType = 'service_bookings'

    if (role === 'provider') {
      summary = await getProviderPayoutSummary(pool, userId)
      sourceType = 'service_bookings'
    } else {
      if (sourceEventId) {
        const [events] = await pool.execute(
          'SELECT id FROM events WHERE id = ? AND organizer_id = ? LIMIT 1',
          [sourceEventId, userId],
        )
        if (events.length === 0) {
          return res.status(403).json({ message: 'You do not have access to this event' })
        }
      }
      summary = await getOrganizerPayoutSummary(pool, userId, sourceEventId)
      sourceType = 'ticket_sales'
    }

    if (amount > Number(summary.available || 0)) {
      return res.status(400).json({
        message: `Requested amount exceeds available payout balance (${Number(summary.available || 0).toFixed(2)})`,
      })
    }

    const [result] = await pool.execute(
      `INSERT INTO payout_requests (requester_id, requester_role, source_type, source_event_id, amount, note, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, role, sourceType, sourceEventId, amount.toFixed(2), note || null],
    )

    const [rows] = await pool.execute(
      `SELECT id, requester_id, requester_role, source_type, source_event_id, amount, status, note, admin_note, requested_at, processed_at
       FROM payout_requests WHERE id = ? LIMIT 1`,
      [result.insertId],
    )

    res.status(201).json(rows[0])
  } catch (error) {
    console.error('Create payout request error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/admin/payout-requests', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view payout requests' })
    }
    const pool = getPoolOrThrow()
    await ensurePayoutRequestsTable()
    const [rows] = await pool.execute(
      `SELECT pr.id, pr.requester_id, pr.requester_role, pr.source_type, pr.source_event_id,
              pr.amount, pr.status, pr.note, pr.admin_note, pr.requested_at, pr.processed_at,
              u.name as requester_name, u.email as requester_email, u.phone as requester_phone,
              e.name as source_event_name, e.date as source_event_date, e.location as source_event_location,
              e.type as source_event_type, e.status as source_event_status
       FROM payout_requests pr
       JOIN users u ON pr.requester_id = u.id
       LEFT JOIN events e ON pr.source_event_id = e.id
       ORDER BY pr.requested_at DESC`
    )
    res.json(rows)
  } catch (error) {
    console.error('Admin payout requests error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

app.put('/api/admin/payout-requests/:requestId', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update payout requests' })
    }
    const requestId = Number(req.params.requestId)
    const status = String(req.body?.status || '').toLowerCase()
    const adminNote = typeof req.body?.admin_note === 'string' ? req.body.admin_note.trim() : null

    if (!['approved', 'rejected', 'paid'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payout status' })
    }

    const pool = getPoolOrThrow()
    await ensurePayoutRequestsTable()
    const [result] = await pool.execute(
      `UPDATE payout_requests
       SET status = ?, admin_note = ?, processed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, adminNote, requestId],
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Payout request not found' })
    }
    res.json({ message: 'Payout request updated successfully' })
  } catch (error) {
    console.error('Update payout request error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Update booking status (confirm/reject)
app.put('/api/service-bookings/:bookingId', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params
    const { status } = req.body
    
    if (!['confirmed', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const pool = getPoolOrThrow()
    const [result] = await pool.execute(
      'UPDATE service_bookings SET status = ? WHERE id = ?',
      [status, bookingId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    if (status === 'cancelled' || status === 'rejected') {
      await pool.execute(
        `UPDATE vendor_availability_blocks
         SET status = 'cancelled'
         WHERE source = 'booking' AND source_ref = ?`,
        [`service_booking:${bookingId}`],
      )
    }

    console.log(`Booking ${bookingId} status updated to ${status}`)
    res.json({ message: 'Booking updated successfully' })
  } catch (error) {
    console.error('Update booking error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// --- Support System API ---

// Create support ticket
app.post('/api/support/tickets', verifyToken, async (req, res) => {
  try {
    const { category_id, subject, description, priority } = req.body
    const user_id = req.userId

    if (!category_id || !subject || !description) {
      return res.status(400).json({ message: 'Category, subject, and description are required' })
    }

    const pool = getPoolOrThrow()
    const [result] = await pool.execute(
      `INSERT INTO support_tickets (user_id, category_id, subject, description, priority, status) 
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [user_id, category_id, subject, description, priority || 'medium']
    )

    res.status(201).json({
      id: result.insertId,
      user_id,
      category_id,
      subject,
      description,
      priority: priority || 'medium',
      status: 'open',
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Create ticket error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get user's support tickets
app.get('/api/support/tickets', verifyToken, async (req, res) => {
  try {
    const user_id = req.userId
    const pool = getPoolOrThrow()

    const [tickets] = await pool.execute(
      `SELECT t.id, t.subject, t.status, t.priority, t.created_at, t.updated_at,
              c.name as category, u.name as assigned_to_name
       FROM support_tickets t
       LEFT JOIN support_categories c ON t.category_id = c.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC`,
      [user_id]
    )

    res.json(tickets)
  } catch (error) {
    console.error('Get tickets error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get ticket details with messages
app.get('/api/support/tickets/:ticketId', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params
    const user_id = req.userId
    const pool = getPoolOrThrow()

    // Get ticket details
    const [tickets] = await pool.execute(
      `SELECT t.*, c.name as category, u.name as user_name, 
              a.name as assigned_to_name
       FROM support_tickets t
       LEFT JOIN support_categories c ON t.category_id = c.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users a ON t.assigned_to = a.id
       WHERE t.id = ? AND t.user_id = ?`,
      [ticketId, user_id]
    )

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    // Get messages
    const [messages] = await pool.execute(
      `SELECT m.id, m.message, m.created_at, m.attachment_path,
              u.id as user_id, u.name, u.role
       FROM support_messages m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.ticket_id = ?
       ORDER BY m.created_at ASC`,
      [ticketId]
    )

    res.json({
      ticket: tickets[0],
      messages
    })
  } catch (error) {
    console.error('Get ticket error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Add message to ticket
app.post('/api/support/tickets/:ticketId/messages', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params
    const { message } = req.body
    const user_id = req.userId

    if (!message) {
      return res.status(400).json({ message: 'Message content is required' })
    }

    const pool = getPoolOrThrow()

    // Verify user has access to this ticket
    const [tickets] = await pool.execute(
      'SELECT id FROM support_tickets WHERE id = ? AND user_id = ?',
      [ticketId, user_id]
    )

    if (tickets.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this ticket' })
    }

    const [result] = await pool.execute(
      `INSERT INTO support_messages (ticket_id, user_id, message) VALUES (?, ?, ?)`,
      [ticketId, user_id, message]
    )

    res.status(201).json({
      id: result.insertId,
      ticket_id: ticketId,
      user_id,
      message,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Add message error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Update ticket status (user can close their own tickets)
app.put('/api/support/tickets/:ticketId', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params
    const { status } = req.body
    const user_id = req.userId

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const pool = getPoolOrThrow()

    // Verify user has access to this ticket
    const [tickets] = await pool.execute(
      'SELECT user_id FROM support_tickets WHERE id = ?',
      [ticketId]
    )

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    if (tickets[0].user_id !== user_id) {
      return res.status(403).json({ message: 'You do not have permission to update this ticket' })
    }

    await pool.execute(
      'UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, ticketId]
    )

    res.json({ message: 'Ticket updated successfully', status })
  } catch (error) {
    console.error('Update ticket error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get FAQs by category
app.get('/api/faqs', async (req, res) => {
  try {
    const { category } = req.query
    const pool = getPoolOrThrow()

    let query = 'SELECT id, category, question, answer, views, helpful_count FROM faqs'
    let params = []

    if (category) {
      query += ' WHERE category = ?'
      params.push(category)
    }

    query += ' ORDER BY views DESC'

    const [faqs] = await pool.execute(query, params)
    res.json(faqs)
  } catch (error) {
    console.error('Get FAQs error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get unique FAQ categories
app.get('/api/faqs/categories', async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const [categories] = await pool.execute(
      'SELECT DISTINCT category FROM faqs ORDER BY category'
    )
    res.json(categories.map(c => c.category))
  } catch (error) {
    console.error('Get FAQ categories error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Increment FAQ view count
app.post('/api/faqs/:faqId/view', async (req, res) => {
  try {
    const { faqId } = req.params
    const pool = getPoolOrThrow()

    await pool.execute(
      'UPDATE faqs SET views = views + 1 WHERE id = ?',
      [faqId]
    )

    res.json({ message: 'View counted' })
  } catch (error) {
    console.error('Update FAQ views error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Mark FAQ as helpful (admin only)
app.post('/api/faqs/:faqId/helpful', verifyToken, async (req, res) => {
  try {
    const { faqId } = req.params
    const pool = getPoolOrThrow()

    await pool.execute(
      'UPDATE faqs SET helpful_count = helpful_count + 1 WHERE id = ?',
      [faqId]
    )

    res.json({ message: 'Marked as helpful' })
  } catch (error) {
    console.error('Mark helpful error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Import and mount advanced ticket management routes
const ticketManagementRoutes = require('./ticket-management-routes')
ticketManagementRoutes(app, { getPoolOrThrow, verifyToken, isAdmin: (req) => req.user?.role === 'admin' })

// Contact form submission endpoint - using Mailpit SMTP
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'jonathandraft02@gmail.com'
    const fromEmail = process.env.MAIL_FROM || 'noreply@huzz.local'

    // Send email to admin
    await sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0E3B26; border-bottom: 2px solid #1B5E3C; padding-bottom: 10px;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #0E3B26; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Submitted at: ${new Date().toLocaleString()}</p>
        </div>
      `
    })

    // Send confirmation email to user
    await sendMail({
      from: fromEmail,
      to: email,
      subject: '✓ We received your message - Huzz',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0E3B26;">Thank you for reaching out!</h2>
          <p>Hi ${name},</p>
          <p>We've received your message and will get back to you as soon as possible. We appreciate your inquiry and look forward to connecting with you.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #B8E3C5; margin: 20px 0;">
            <p><strong>Your Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666;">Best regards,<br/><strong>The Huzz Team</strong></p>
          <p style="color: #999; font-size: 12px;">If you have any questions, feel free to reply to this email.</p>
        </div>
      `
    })

    console.log(`✅ Contact emails sent successfully from ${email}`)

    res.status(201).json({
      message: 'Thank you! Your message has been received. We will get back to you soon.',
      emailSent: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Contact form error:', error.message)
    res.status(500).json({
      message: 'Failed to send message. Please try again later or contact support directly.'
    })
  }
})

// --- Admin Event Management ---

// Get all events in the system (admin only)
app.get('/api/admin/events', verifyToken, async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const [events] = await pool.execute(`
      SELECT 
        e.id,
        e.organizer_id,
        e.name,
        e.description,
        e.date,
        e.location,
        e.type,
        e.guest_count,
        e.budget,
        e.status,
        e.image_url,
        e.created_at,
        e.updated_at,
        u.name as organizer_name,
        u.email as organizer_email
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      ORDER BY e.date DESC
    `)
    res.json(events)
  } catch (error) {
    console.error('Get admin events error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get single event (admin only)
app.get('/api/admin/events/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const pool = getPoolOrThrow()
    const [events] = await pool.execute(`
      SELECT 
        e.id,
        e.organizer_id,
        e.name,
        e.description,
        e.date,
        e.location,
        e.type,
        e.guest_count,
        e.budget,
        e.status,
        e.image_url,
        e.created_at,
        e.updated_at,
        u.name as organizer_name,
        u.email as organizer_email
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.id = ?
    `, [eventId])
    
    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' })
    }
    
    res.json(events[0])
  } catch (error) {
    console.error('Get admin event error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Update event status (admin only)
app.put('/api/admin/events/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const { name, description, date, location, type, guest_count, budget, status } = req.body

    const pool = getPoolOrThrow()
    
    // Build update query based on provided fields
    const updates = []
    const values = []
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (description !== undefined) { updates.push('description = ?'); values.push(description) }
    if (date !== undefined) { updates.push('date = ?'); values.push(date) }
    if (location !== undefined) { updates.push('location = ?'); values.push(location) }
    if (type !== undefined) { updates.push('type = ?'); values.push(type) }
    if (guest_count !== undefined) { updates.push('guest_count = ?'); values.push(guest_count) }
    if (budget !== undefined) { updates.push('budget = ?'); values.push(budget) }
    if (status !== undefined) { updates.push('status = ?'); values.push(status) }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }

    updates.push('updated_at = NOW()')
    values.push(eventId)

    const query = `UPDATE events SET ${updates.join(', ')} WHERE id = ?`
    const [result] = await pool.execute(query, values)

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' })
    }

    res.json({ message: 'Event updated successfully' })
  } catch (error) {
    console.error('Update event error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Delete event (admin only)
app.delete('/api/admin/events/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params

    const pool = getPoolOrThrow()
    const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [eventId])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' })
    }

    res.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Delete event error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Organizer: Delete their own event
app.delete('/api/events/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const userId = req.userId

    const pool = getPoolOrThrow()
    
    // Verify the event belongs to the organizer
    const [events] = await pool.execute(
      'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
      [eventId, userId]
    )

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found or you do not have permission to delete it' })
    }

    // Delete the event
    await pool.execute('DELETE FROM events WHERE id = ?', [eventId])

    res.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Delete event error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Organizer: Edit their own event
app.put('/api/events/:eventId', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { eventId } = req.params
    const userId = req.userId
    const { name, date, type, description, location } = req.body

    if (!name || !date) {
      return res.status(400).json({ message: 'Event name and date are required' })
    }

    const pool = getPoolOrThrow()
    
    // Verify the event belongs to the organizer
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ? AND organizer_id = ?',
      [eventId, userId]
    )

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found or you do not have permission to edit it' })
    }

    // Handle image update
    let imageUrl = events[0].image_url
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    }

    // Update the event
    await pool.execute(
      `UPDATE events SET name = ?, date = ?, type = ?, description = ?, location = ?, image_url = ? WHERE id = ?`,
      [name, date, type || null, description || null, location || null, imageUrl, eventId]
    )

    res.json({
      id: parseInt(eventId),
      name,
      date,
      type,
      description,
      location,
      image_url: imageUrl,
      status: events[0].status,
    })
  } catch (error) {
    console.error('Update event error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// --- Support & FAQ Endpoints ---

// Get all support tickets for current user
app.get('/api/support/tickets', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const pool = getPoolOrThrow()
    const [tickets] = await pool.execute(
      'SELECT id, category, subject, message, status, priority, created_at, updated_at FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    res.json(tickets)
  } catch (error) {
    console.error('Get support tickets error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Create support ticket
app.post('/api/support/tickets', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { category, subject, message, priority } = req.body
    
    if (!category || !subject || !message) {
      return res.status(400).json({ message: 'Category, subject, and message are required' })
    }

    const pool = getPoolOrThrow()
    const [result] = await pool.execute(
      'INSERT INTO support_tickets (user_id, category, subject, message, priority) VALUES (?, ?, ?, ?, ?)',
      [userId, category, subject, message, priority || 'medium']
    )
    
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Support ticket created successfully' 
    })
  } catch (error) {
    console.error('Create support ticket error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get support categories (public)
app.get('/api/support/categories', async (req, res) => {
  try {
    const categories = [
      'General Inquiry',
      'Technical Issue',
      'Billing & Payment',
      'Account & Profile',
      'Event Management',
      'Service Booking',
      'Other'
    ]
    res.json(categories)
  } catch (error) {
    console.error('Get support categories error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get all FAQs (public)
app.get('/api/faqs', async (req, res) => {
  try {
    const { category } = req.query
    const pool = getPoolOrThrow()

    let query = 'SELECT id, category, question, answer, views, helpful_count FROM faqs'
    let params = []

    if (category) {
      query += ' WHERE category = ?'
      params.push(category)
    }

    query += ' ORDER BY views DESC'

    const [faqs] = await pool.execute(query, params)
    res.json(faqs)
  } catch (error) {
    console.error('Get FAQs error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get FAQ categories (public)
app.get('/api/faqs/categories', async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const [results] = await pool.execute(
      'SELECT DISTINCT category FROM faqs WHERE is_active = TRUE ORDER BY category ASC'
    )
    const categories = results.map(r => r.category)
    res.json(categories)
  } catch (error) {
    console.error('Get FAQ categories error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Import payment routes
const paymentRoutes = require('./payment-routes')

// Use payment routes
app.use('/api/payments', paymentRoutes)

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

