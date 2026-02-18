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
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
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
const { getPool, initializeDatabase, registerUser, loginUser } = require('./db')


const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';


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

// Initialize database on startup only when explicitly requested.
// Running the initializer drops and recreates the database (used for tests/seeds).
// To avoid wiping data on accidental server restarts, require DB_INIT=1 to run it.
process.env.DB_INIT=1;

if (process.env.DB_INIT === '1' || process.env.DB_INIT === 'true') {
  initializeDatabase().catch(err => {
    console.warn('⚠️  Database initialization warning:', err.message)
    console.warn('Server will continue running without database. Authentication will fail.')
  })
} else {
  console.log('DB initialization skipped (set DB_INIT=1 to initialize the database)')
}

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
    // Mock data for organizer dashboard
    res.json({
      totalEvents: 5,
      pendingBookings: 3,
      upcomingEvents: 2,
      totalRevenue: '$2,450',
      events: [
        { id: 1, name: 'Wedding Reception', date: '2026-02-15', status: 'confirmed', vendors: 5 },
        { id: 2, name: 'Corporate Gala', date: '2026-03-01', status: 'pending', vendors: 3 },
      ]
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/dashboard/provider-stats', verifyToken, async (req, res) => {
  try {
    // Mock data for provider dashboard
    res.json({
      profileCompletion: '65%',
      pendingRequests: 4,
      completedBookings: 12,
      earnings: '$3,250',
      bookings: [
        { id: 1, eventName: 'Wedding', date: '2026-02-15', status: 'confirmed', amount: '$500' },
        { id: 2, eventName: 'Birthday', date: '2026-02-20', status: 'pending', amount: '$300' },
      ]
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/dashboard/admin-stats', verifyToken, async (req, res) => {
  try {
    // Mock data for admin dashboard
    res.json({
      totalUsers: 42,
      pendingApprovals: 5,
      totalTransactions: '$15,320',
      platformFee: '$2,298',
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'provider', status: 'pending' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'organizer', status: 'approved' },
      ]
    })
  } catch (error) {
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

// --- Reviews API ---

// Submit a review for a completed booking
app.post('/api/reviews', verifyToken, async (req, res) => {
  try {
    const { booking_id, provider_id, rating, comment } = req.body
    const reviewer_id = req.userId
    if (!booking_id || !provider_id || !rating) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    const pool = getPoolOrThrow()
    // Check if booking is completed and belongs to this user
    const [bookings] = await pool.execute(
      'SELECT * FROM service_bookings WHERE id = ? AND organizer_id = ? AND status = ? LIMIT 1',
      [booking_id, reviewer_id, 'completed']
    )
    if (bookings.length === 0) {
      return res.status(403).json({ message: 'You can only review completed bookings you own.' })
    }
    // Check if review already exists
    const [existing] = await pool.execute(
      'SELECT * FROM reviews WHERE booking_id = ? AND reviewer_id = ?',
      [booking_id, reviewer_id]
    )
    if (existing.length > 0) {
      return res.status(409).json({ message: 'You have already reviewed this booking.' })
    }
    // Insert review
    await pool.execute(
      'INSERT INTO reviews (booking_id, reviewer_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [booking_id, reviewer_id, provider_id, rating, comment || null]
    )
    res.status(201).json({ message: 'Review submitted successfully.' })
  } catch (error) {
    console.error('Submit review error:', error.message)
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
    const [services] = await pool.execute(`
      SELECT 
        s.id, 
        s.vendor_id, 
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
        u.id as user_id,
        u.name as vendor_name, 
        u.email as vendor_email
      FROM services s
      JOIN users u ON s.vendor_id = u.id
      WHERE s.is_approved = TRUE
      ORDER BY s.created_at DESC
    `)
    
    res.json(services)
  } catch (error) {
    console.error('Get approved services error:', error.message)
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
    console.log('Fetching services for user:', userId)

    const [results] = await pool.query(
      'SELECT id, title, description, category, price, image, phone, location, latitude, longitude, duration, availability, is_approved, approval_status FROM services WHERE vendor_id = ? ORDER BY created_at DESC',
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
    const { title, description, category, price, duration, availability, phone, location, latitude, longitude } = req.body
    console.log('Create service - body fields:', { title, description, category, price, duration, availability, phone, location, latitude, longitude })
    console.log('Create service - uploaded file:', req.file ? { filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } : null)

    if (!title || !description || !category || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null

    const [result] = await pool.query(
      'INSERT INTO services (vendor_id, title, description, category, price, image, phone, location, latitude, longitude, duration, availability, is_approved, approval_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, NOW())',
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
    const serviceId = parseInt(req.params.id)
    const { title, description, category, price, duration, availability, phone, location, latitude, longitude } = req.body
    console.log('Update service id=', serviceId, '- body fields:', { title, description, category, price, duration, availability, phone, location, latitude, longitude })
    console.log('Update service - uploaded file:', req.file ? { filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } : null)

    if (!title || !description || !category || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Check ownership
    const [results] = await pool.query('SELECT vendor_id FROM services WHERE id = ?', [serviceId])
    if (results.length === 0) {
      return res.status(404).json({ message: 'Service not found' })
    }
    if (results[0].vendor_id !== userId) {
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
    const serviceId = parseInt(req.params.id)

    // Check ownership
    const [results] = await pool.query('SELECT vendor_id FROM services WHERE id = ?', [serviceId])
    if (results.length === 0) {
      return res.status(404).json({ message: 'Service not found' })
    }
    if (results[0].vendor_id !== userId) {
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

    pool.query(
      'SELECT notification_preferences, privacy_settings FROM users WHERE id = ?',
      [userId],
      (error, results) => {
        if (error) {
          return res.status(500).json({ message: 'Database error' })
        }

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
      }
    )
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

    pool.query(updateQuery, updateParams, (error) => {
      if (error) {
        console.error('Update profile error:', error)
        return res.status(500).json({ message: 'Failed to update profile' })
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: userId,
          name,
          email,
          phone: phone || '',
          profile_image: req.file ? `/uploads/${req.file.filename}` : undefined,
        },
      })
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

    pool.query(
      'UPDATE users SET notification_preferences = ? WHERE id = ?',
      [JSON.stringify(notifications), userId],
      (error) => {
        if (error) {
          return res.status(500).json({ message: 'Failed to update preferences' })
        }
        res.json({ message: 'Notification preferences updated', notifications })
      }
    )
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

    pool.query(
      'UPDATE users SET privacy_settings = ? WHERE id = ?',
      [JSON.stringify(privacy), userId],
      (error) => {
        if (error) {
          return res.status(500).json({ message: 'Failed to update privacy settings' })
        }
        res.json({ message: 'Privacy settings updated', privacy })
      }
    )
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
    const [services] = await pool.execute(
      `SELECT s.id, s.vendor_id, s.title, s.description, s.category, s.price, 
              s.image, s.duration, s.availability, s.phone, s.location, s.created_at, s.is_approved,
              u.name as vendor_name, u.email as vendor_email
       FROM services s
       JOIN users u ON s.vendor_id = u.id
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
    const [services] = await pool.execute(
      'SELECT * FROM services WHERE vendor_id = ? AND approval_status = ? ORDER BY created_at DESC',
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

    // send confirmation email via Resend if API key configured
    let mailResult = null
    try {
      const { Resend } = require('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const event = rows[0]
      const html = `
        <p>Hi ${name || 'Attendee'},</p>
        <p>Thanks for registering for <strong>${event.name}</strong> on ${new Date(event.date).toLocaleString()} at ${event.location || ''}.</p>
        <p>Your ticket token: <strong>${token}</strong></p>
        ${qrDataUrl ? `<p><img src="${qrDataUrl}" alt="QR code" style="max-width:240px"/></p>` : ''}
        <p>Show this email at check-in.</p>
      `
      mailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: email,
        subject: `Registration confirmation - ${event.name}`,
        html
      })
    } catch (mailErr) {
      console.warn('Mail send skipped or failed (Resend):', mailErr && mailErr.message ? mailErr.message : mailErr)
    }

    res.status(201).json({ message: 'Registered (public)', token, qr: qrDataUrl, mailSent: !!mailResult })
  } catch (err) {
    console.error('Public event register error:', err.message)
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
             u.name as buyer_name, u.email as buyer_email
      FROM ticket_sales ts
      JOIN tickets t ON ts.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      JOIN users u ON ts.buyer_id = u.id
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

// Purchase ticket(s) for an event
app.post('/api/events/:eventId/purchase', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const { ticket_id, quantity, payment_method } = req.body
    const buyer_id = req.userId

    if (!ticket_id || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'ticket_id and positive quantity are required' })
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
      'INSERT INTO ticket_sales (ticket_id, buyer_id, quantity, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ticket_id, buyer_id, quantity, amount, payment_method || 'offline', transactionId, 'completed']
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
    let query = `SELECT ts.id, ts.ticket_id, ts.buyer_id, ts.quantity, ts.amount, ts.payment_method, ts.transaction_id, ts.validated, ts.created_at, t.ticket_type, t.event_id, e.name as event_name, u.name as buyer_name, u.email as buyer_email
                 FROM ticket_sales ts
                 JOIN tickets t ON ts.ticket_id = t.id
                 JOIN events e ON t.event_id = e.id
                 JOIN users u ON ts.buyer_id = u.id`
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
app.post('/api/events/:eventId/confirm-payment', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const { ticket_id, quantity, payment_intent_id } = req.body
    const buyer_id = req.userId

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
    const [saleResult] = await pool.execute(
      'INSERT INTO ticket_sales (ticket_id, buyer_id, quantity, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ticket_id, buyer_id, quantity, amount, 'stripe', transactionId, 'completed']
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

    res.json({ message: 'Payment confirmed and tickets issued', saleId, transactionId, qr: qrDataUrl, amount })
  } catch (err) {
    console.error('Confirm payment error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Book a service
app.post('/api/service-bookings', verifyToken, async (req, res) => {
  try {
    const { service_id, booking_date, notes } = req.body
    const organizer_id = req.userId
    
    if (!service_id || !booking_date) {
      return res.status(400).json({ message: 'Service ID and booking date are required' })
    }

    const pool = getPoolOrThrow()
    
    // Get service details to find vendor_id
    const [serviceData] = await pool.execute('SELECT vendor_id FROM services WHERE id = ?', [service_id])
    
    if (serviceData.length === 0) {
      return res.status(404).json({ message: 'Service not found' })
    }

    const vendor_id = serviceData[0].vendor_id

    // Create booking
    const [result] = await pool.execute(
      `INSERT INTO service_bookings (service_id, vendor_id, organizer_id, booking_date, notes, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [service_id, vendor_id, organizer_id, booking_date, notes || null]
    )

    console.log(`Service booking created: ID ${result.insertId} for service ${service_id}`)
    res.status(201).json({ 
      message: 'Service booking created successfully',
      bookingId: result.insertId 
    })
  } catch (error) {
    console.error('Create booking error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// Get bookings for organizer
app.get('/api/my-bookings', verifyToken, async (req, res) => {
  try {
    const organizer_id = req.userId
    const pool = getPoolOrThrow()
    
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
        u.name as vendor_name, 
        u.email as vendor_email
       FROM service_bookings sb
       JOIN services s ON sb.service_id = s.id
       JOIN users u ON sb.vendor_id = u.id
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
        u.name as organizer_name, 
        u.email as organizer_email
       FROM service_bookings sb
       JOIN services s ON sb.service_id = s.id
       JOIN users u ON sb.organizer_id = u.id
       WHERE sb.vendor_id = ?
       ORDER BY sb.booking_date DESC`,
      [vendor_id]
    )
    
    res.json(bookings)
  } catch (error) {
    console.error('Get provider bookings error:', error.message)
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

    console.log(`Booking ${bookingId} status updated to ${status}`)
    res.json({ message: 'Booking updated successfully' })
  } catch (error) {
    console.error('Update booking error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// --- Support System API ---

// Get support categories
app.get('/api/support/categories', async (req, res) => {
  try {
    const pool = getPoolOrThrow()
    const [categories] = await pool.execute('SELECT id, name, description FROM support_categories ORDER BY name')
    res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error.message)
    res.status(500).json({ message: error.message })
  }
})

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

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
