/*
  File: server/db.js
  Purpose: MySQL connection pool, schema initialization helpers, and database-level
           functions used by the API (auth, services, bookings, seeds).

  Major responsibilities:
  - Initialize DB and create tables (idempotent DDL)
  - Provide `getPool()` and a single shared pool for queries
  - Implement helper functions: registerUser, loginUser, createService,
    getApprovedServices, getVendorServices, and other CRUD helpers
  - Handle password hashing/verification (bcryptjs) and JWT signing

  Where it affects the UI / pages:
  - Auth flows (SignIn/SignUp)
  - Service visibility (`approved-services` used by `BrowseVendors.tsx`)
  - Settings (password-change uses stored hashed password)

  Notes:
  - `services.approval_status` is the canonical source of truth for service
    visibility (enum: pending, approved, declined).
*/
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// First connection without database to create it
const initialPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Main pool after database creation
let pool = null;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Initialize database and tables
async function initializeDatabase() {
  try {
    // First connection without database to ensure it exists (non-destructive)
    const connection = await initialPool.getConnection()
    // Ensure database exists (non-destructive)
    await connection.execute(`CREATE DATABASE IF NOT EXISTS huzz_auth`)
    console.log('Ensured database exists: huzz_auth')
    connection.release()

    // Now create main pool with the database
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'huzz_auth',
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Create users table with role
    const dbConnection = await pool.getConnection()
    
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('organizer', 'provider', 'admin') DEFAULT 'organizer',
        phone VARCHAR(20),
        profile_image VARCHAR(255),
        bio TEXT,
        is_approved BOOLEAN DEFAULT TRUE,
        notification_preferences JSON,
        privacy_settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create service providers table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS service_providers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        business_name VARCHAR(255) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        description TEXT,
        hourly_rate DECIMAL(10, 2),
        min_booking_hours INT DEFAULT 1,
        availability_status ENUM('available', 'unavailable') DEFAULT 'available',
        rating DECIMAL(3, 2) DEFAULT 0,
        total_ratings INT DEFAULT 0,
        profile_image VARCHAR(255),
        portfolio_images JSON,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create events table (columns aligned with frontend API)
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organizer_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        date DATETIME NOT NULL,
        location VARCHAR(255),
        type VARCHAR(100),
        guest_count INT,
        budget DECIMAL(12, 2),
        status ENUM('pending','draft', 'published', 'confirmed', 'ongoing', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create bookings table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        provider_id INT NOT NULL,
        organizer_id INT NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        booking_date DATETIME NOT NULL,
        duration_hours INT,
        total_cost DECIMAL(12, 2),
        status ENUM('pending', 'confirmed', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
        payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create payments table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `)

    // Create tickets table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        ticket_type VARCHAR(100),
        price DECIMAL(10, 2),
        quantity INT,
        sold INT DEFAULT 0,
        qr_code VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `)

    // Create ticket_sales table to record ticket purchases (includes qr_code and validated flag)
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS ticket_sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        buyer_id INT NOT NULL,
        quantity INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_method VARCHAR(100),
        transaction_id VARCHAR(255),
        qr_code TEXT,
        validated BOOLEAN DEFAULT FALSE,
        status ENUM('pending','completed','failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create event registrations table for users who register for events (non-ticketed)
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create event_attendees table for public registrations (name, email, phone, token)
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        token VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `)

    // Create reviews table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        provider_id INT NOT NULL,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create messages table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        booking_id INT,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `)

    // Create services table (added phone, location, latitude, longitude)
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255),
        phone VARCHAR(30),
        location VARCHAR(255),
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        duration VARCHAR(50),
        availability VARCHAR(50),
        is_approved BOOLEAN DEFAULT FALSE,
        approval_status ENUM('pending','approved','declined') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_approval_status (approval_status)
      )
    `)

    // Create service bookings table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS service_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_id INT NOT NULL,
        vendor_id INT NOT NULL,
        organizer_id INT NOT NULL,
        booking_date DATETIME NOT NULL,
        notes TEXT,
        status ENUM('pending', 'confirmed', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Vendor availability calendar blocks (manual or external sync + booking holds)
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS vendor_availability_blocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        start_at DATETIME NOT NULL,
        end_at DATETIME NOT NULL,
        source ENUM('manual', 'calendar_sync', 'booking') DEFAULT 'manual',
        source_ref VARCHAR(191),
        status ENUM('active', 'cancelled') DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_vendor_time (vendor_id, start_at, end_at),
        INDEX idx_source_ref (source_ref)
      )
    `)

    // Create support tickets table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create FAQs table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS faqs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        question VARCHAR(500) NOT NULL,
        answer TEXT NOT NULL,
        views INT DEFAULT 0,
        helpful_count INT DEFAULT 0,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create default admin account if missing
    try {
      const adminEmail = 'root@admin.com'
      const adminPassword = 'root123'
      const [existingAdmin] = await dbConnection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail])
      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10)
        await dbConnection.execute(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['Root Admin', adminEmail, hashedPassword, 'admin']
        )
        console.log('✓ Created default admin account')
        console.log('  Email: root@admin.com')
        console.log('  Password: root123')
      } else {
        console.log('✓ Default admin account already exists')
      }
    } catch (error) {
      console.error('Warning: Could not ensure default admin:', error.message)
    }

    dbConnection.release()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

// Register user with role
async function registerUser(name, email, password, role = 'organizer') {
  if (!pool) throw new Error('Database is not initialized. Please ensure MySQL is running on port 3306.')
  
  const connection = await pool.getConnection()
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    )
    
    const user = { id: result.insertId, name, email, role }
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
    
    return { token, user }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

// Login user
async function loginUser(email, password) {
  if (!pool) throw new Error('Database is not initialized. Please ensure MySQL is running on port 3306.')
  
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    
    if (rows.length === 0) {
      throw new Error('User not found')
    }
    
    const user = rows[0]
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }
    
    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      profile_image: user.profile_image || '',
    }
    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '7d' })
    
    return { token, user: userObj }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

module.exports = {
  getPool: () => pool,
  initializeDatabase,
  registerUser,
  loginUser,
  JWT_SECRET,
}
