#!/usr/bin/env node
/**
 * File: server/database-init.js
 * Purpose: CLI script to initialize the development/test database and seed
 *          essential demo accounts.
 *
 * Major responsibilities:
 * - Connect to MySQL and drop/create `huzz_auth` (idempotent for dev)
 * - Create tables: users, service_providers, services, events, bookings, etc.
 * - Add helpful indexes and seed initial admin/vendor/demo data
 *
 * Affects:
 * - Local development and CI: guarantees a consistent schema for tests
 * - Documents the intended schema (including `approval_status` on services)
 *
 * Usage: `npm run db:init`
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const {
  MYSQL_HOST = 'localhost',
  MYSQL_USER = 'root',
  MYSQL_PASSWORD = '',
  MYSQL_PORT = 3306,
} = process.env;

async function initializeDatabase() {
  let connection = null;

  try {
    console.log('🚀 Starting database initialization...');
    console.log(`📍 Connecting to MySQL at ${MYSQL_HOST}:${MYSQL_PORT}`);

    // Step 1: Connect to MySQL (without database)
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      port: parseInt(MYSQL_PORT),
    });

    console.log('✅ Connected to MySQL');

    // Step 2: Drop existing database
    try {
      await connection.execute('DROP DATABASE IF EXISTS huzz_auth');
      console.log('🗑️  Dropped existing huzz_auth database');
    } catch (err) {
      console.log('ℹ️  No existing database to drop');
    }

    // Step 3: Create new database and get new connection
    await connection.execute('CREATE DATABASE huzz_auth');
    console.log('📦 Created fresh huzz_auth database');
    
    // Close initial connection and create new one to the database
    await connection.end();

    // Step 4: Create connection to huzz_auth database
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: 'huzz_auth',
      port: parseInt(MYSQL_PORT),
    });
    console.log('✅ Connected to huzz_auth database\n');

    // Step 5: Create tables
    console.log('🏗️  Creating tables...');

    // Users table
    await connection.execute(`
      CREATE TABLE users (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )
    `);
    console.log('  ✓ users table');

    // Service providers table
    await connection.execute(`
      CREATE TABLE service_providers (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_service_type (service_type),
        INDEX idx_rating (rating)
      )
    `);
    console.log('  ✓ service_providers table');

    // Services table
    await connection.execute(`
      CREATE TABLE services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(255),
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        is_approved BOOLEAN DEFAULT FALSE,
        approval_status ENUM('pending','approved','declined') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
        INDEX idx_provider_id (provider_id),
        INDEX idx_category (category),
        INDEX idx_approval_status (approval_status)
      )
    `);
    console.log('  ✓ services table');

    // Events table
    await connection.execute(`
      CREATE TABLE events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organizer_id INT NOT NULL,
        event_name VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATETIME,
        location VARCHAR(255),
        event_type VARCHAR(100),
        status ENUM('planning', 'scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'planning',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_organizer_id (organizer_id),
        INDEX idx_event_date (event_date)
      )
    `);
    console.log('  ✓ events table');

    // Service bookings table
    await connection.execute(`
      CREATE TABLE service_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organizer_id INT NOT NULL,
        provider_id INT NOT NULL,
        service_id INT NOT NULL,
        booking_date DATETIME NOT NULL,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        INDEX idx_organizer_id (organizer_id),
        INDEX idx_provider_id (provider_id),
        INDEX idx_status (status),
        INDEX idx_booking_date (booking_date)
      )
    `);
    console.log('  ✓ service_bookings table');

    // Messages table
    await connection.execute(`
      CREATE TABLE messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        recipient_id INT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_sender_recipient (sender_id, recipient_id),
        INDEX idx_is_read (is_read)
      )
    `);
    console.log('  ✓ messages table');

    // Images table
    await connection.execute(`
      CREATE TABLE images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size INT,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_upload_date (upload_date)
      )
    `);
    console.log('  ✓ images table');

    // Reviews table
    await connection.execute(`
      CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        provider_id INT NOT NULL,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES service_bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_provider_id (provider_id),
        INDEX idx_rating (rating)
      )
    `);
    console.log('  ✓ reviews table');

    // Support categories table
    await connection.execute(`
      CREATE TABLE support_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ support_categories table');

    // Insert default support categories
    await connection.execute(
      `INSERT INTO support_categories (name, description) VALUES 
       (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)`,
      [
        'Booking Issue', 'Issues related to bookings and reservations',
        'Payment Issue', 'Payment and billing related problems',
        'Account Issue', 'Account access and profile issues',
        'Service Quality', 'Complaints about service quality',
        'Other', 'Other issues not listed above'
      ]
    );

    // Support tickets table
    await connection.execute(`
      CREATE TABLE support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES support_categories(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_assigned_to (assigned_to)
      )
    `);
    console.log('  ✓ support_tickets table');

    // Support messages table
    await connection.execute(`
      CREATE TABLE support_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        attachment_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_ticket_id (ticket_id),
        INDEX idx_user_id (user_id)
      )
    `);
    console.log('  ✓ support_messages table');

    // FAQs table
    await connection.execute(`
      CREATE TABLE faqs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        views INT DEFAULT 0,
        helpful_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_views (views)
      )
    `);
    console.log('  ✓ faqs table');

    // Insert default FAQs
    await connection.execute(
      `INSERT INTO faqs (category, question, answer) VALUES 
       (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?),
       (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
      [
        'Booking', 'How do I book a service?', 'Click on "Browse Vendors", select a vendor, choose a service, and click "Book Now". Fill in your event details and confirm the booking.',
        'Booking', 'Can I cancel or reschedule a booking?', 'Yes, you can cancel up to 24 hours before the scheduled date. Contact support if you need to reschedule.',
        'Booking', 'What is the refund policy?', 'Refunds are processed within 5-7 business days of cancellation. Cancellations must be made at least 24 hours before the service date.',
        'Payments', 'What payment methods do you accept?', 'We accept all major credit cards, debit cards, and digital payment methods through our secure payment gateway.',
        'Payments', 'Is my payment information secure?', 'Yes, all payments are processed through encrypted secure channels. We never store your full card details.',
        'Account', 'How do I reset my password?', 'Click "Forgot Password" on the login page, enter your email, and follow the reset instructions sent to your email.',
        'Account', 'How do I update my profile?', 'Go to Settings > Profile and update your information. Providers can add photos and service details.',
        'Vendors', 'How do I become a vendor?', 'Sign up as a Service Provider, complete your profile, add services with details and images, and wait for admin approval.',
        'Services', 'How are vendors verified?', 'All vendors go through an approval process. We verify their credentials and reviews before they can offer services.',
        'General', 'How do I contact support?', 'You can create a support ticket here, email us, or use the live chat feature available 24/7.'
      ]
    );

    // Step 6: Seed default admin user
    console.log('👤 Seeding default admin user...');

    const adminPassword = await bcrypt.hash('root123', 10);
    await connection.execute(
      `INSERT INTO users (name, email, password, role, is_approved) 
       VALUES (?, ?, ?, ?, ?)`,
      ['Admin User', 'root@admin.com', adminPassword, 'admin', 1]
    );

    console.log('✅ Default admin created');
    console.log('   Email: root@admin.com');
    console.log('   Password: root123');

    console.log('\n✨ Database initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Start the server: npm start');
    console.log('  2. Server will use the initialized database');
    console.log('  3. Login with admin credentials above');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Check your MySQL credentials in server/.env');
      console.error('   MYSQL_USER:', MYSQL_USER);
      console.error('   MYSQL_HOST:', MYSQL_HOST);
    } else if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('\n💡 MySQL connection lost. Is MySQL running?');
      console.error(`   Try connecting to: ${MYSQL_HOST}:${MYSQL_PORT}`);
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization
initializeDatabase();
